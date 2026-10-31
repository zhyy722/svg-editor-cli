import { DOMParser } from '@xmldom/xmldom';
import type { SvgCodec } from '../application/SvgCodec.js';
import { SvgDocument } from '../domain/SvgDocument.js';
import type { Shape } from '../domain/Shape.js';
import { Group } from '../domain/Group.js';
import type { ShapeCreator } from '../application/ShapeCreator.js';

export class XmlSvgCodec implements SvgCodec {
  constructor(private readonly factory: ShapeCreator) {}
  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  encode(document: SvgDocument): string {
    const write = (shape: Shape, depth: number): string => {
      const pad = '  '.repeat(depth),
        attrs = { id: shape.id, ...shape.attributes };
      const head = `${pad}<${shape.tag} ${Object.entries(attrs)
        .map(([k, v]) => `${k}="${this.escape(v)}"`)
        .join(' ')}`;
      if (shape instanceof Group)
        return `${head}>\n${shape.children.map((child) => write(child, depth + 1)).join('')}${pad}</g>\n`;
      return `${head}>${this.escape(shape.content)}</${shape.tag}>\n`;
    };
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="${document.viewBox}">\n${document.root.children.map((child) => write(child, 1)).join('')}</svg>\n`;
  }
  decode(xml: string): { document: SvgDocument; warnings: readonly string[] } {
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('DTD and entities are not supported');
    const errors: string[] = [];
    const parsed = new DOMParser({
      errorHandler: {
        warning: (m) => errors.push(m),
        error: (m) => errors.push(m),
        fatalError: (m) => errors.push(m),
      },
    }).parseFromString(xml, 'image/svg+xml');
    if (errors.length || !parsed.documentElement) throw new Error('invalid SVG XML');
    const root = parsed.documentElement;
    if (root.tagName !== 'svg' || root.namespaceURI !== 'http://www.w3.org/2000/svg')
      throw new Error('expected SVG root and namespace');
    for (let i = 0; i < root.attributes.length; i++) {
      const attr = root.attributes.item(i)!;
      if (!['xmlns', 'width', 'height', 'viewBox', 'version', 'id'].includes(attr.name))
        throw new Error(`unsupported SVG root attribute: ${attr.name}`);
    }
    if (
      parsed.childNodes.length &&
      Array.from({ length: parsed.childNodes.length }, (_, i) => parsed.childNodes.item(i)).filter(
        (n) => n?.nodeType === 1,
      ).length !== 1
    )
      throw new Error('multiple XML roots');
    const box = root.getAttribute('viewBox');
    if (box) {
      const values = box
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      if (
        values.length !== 4 ||
        values.some((n) => !Number.isFinite(n)) ||
        values[2]! <= 0 ||
        values[3]! <= 0
      )
        throw new Error('invalid viewBox');
    }
    const dimensions = box
      ?.trim()
      .split(/[\s,]+/)
      .map(Number);
    const document = new SvgDocument(
      Number(root.getAttribute('width') || dimensions?.[2] || 800),
      Number(root.getAttribute('height') || dimensions?.[3] || 600),
      box || undefined,
    );
    const reserved = new Set<string>();
    const elements = (parent: Element): Element[] =>
      Array.from({ length: parent.childNodes.length }, (_, i) => parent.childNodes.item(i)).filter(
        (n) => n?.nodeType === 1,
      ) as Element[];
    const collect = (element: Element): void => {
      const id = element.getAttribute('id');
      if (id) {
        if (reserved.has(id)) throw new Error(`id already exists: ${id}`);
        reserved.add(id);
      }
      for (const child of elements(element)) collect(child);
    };
    collect(root);
    const warnings: string[] = [];
    const counters = new Map<string, number>();
    const read = (element: Element): Shape => {
      const type = element.tagName;
      if (element.namespaceURI !== root.namespaceURI)
        throw new Error('foreign SVG namespace is not supported');
      let id = element.getAttribute('id');
      if (!id) {
        let serial = counters.get(type) ?? 0;
        do {
          id = `${type}${++serial}`;
        } while (reserved.has(id));
        counters.set(type, serial);
        reserved.add(id);
        warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
      }
      const attrs: Record<string, string> = {};
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes.item(i)!;
        if (!['id', 'transform', 'data-kind'].includes(attr.name)) attrs[attr.name] = attr.value;
      }
      const children = elements(element);
      const shape = this.factory.fromSvg(type, id, attrs, element.textContent ?? '');
      if (shape instanceof Group) {
        for (const child of children) shape.insert(read(child));
      } else if (children.length) throw new Error('nested elements require a g container');
      this.transform(shape, element.getAttribute('transform') ?? '');
      return shape;
    };
    for (const child of elements(root)) document.add(read(child));
    return { document, warnings };
  }
  private transform(shape: Shape, value: string): void {
    if (!value.trim()) return;
    const operations = [...value.matchAll(/(translate|scale)\s*\(([^)]*)\)/g)];
    if (value.replace(/(translate|scale)\s*\([^)]*\)/g, '').trim())
      throw new Error('unsupported SVG transform');
    for (const operation of operations.reverse()) {
      const args = operation[2]!
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      if (args.length < 1 || args.length > 2 || args.some((n) => !Number.isFinite(n)))
        throw new Error('invalid SVG transform');
      if (operation[1] === 'translate') shape.move(args[0]!, args[1] ?? 0);
      else {
        if (args[1] !== undefined && args[1] !== args[0])
          throw new Error('non-uniform scale is not supported');
        shape.importScale(args[0]!);
      }
    }
  }
}
