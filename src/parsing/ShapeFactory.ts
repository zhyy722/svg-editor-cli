import type { Shape } from '../domain/Shape.js';
import { Rect } from '../domain/Rect.js';
import { Circle } from '../domain/Circle.js';
import { Ellipse } from '../domain/Ellipse.js';
import { Line } from '../domain/Line.js';
import { Text } from '../domain/Text.js';
import { Group } from '../domain/Group.js';
import type { ShapeCreator } from '../application/ShapeCreator.js';

export class ShapeFactory implements ShapeCreator {
  // Phase 1 composition point; replace the built-in registration list in plugin phase.
  private readonly providers = new Map<
    string,
    {
      keys: readonly string[];
      paint?: string;
      text?: boolean;
      build: (id: string, attrs: Readonly<Record<string, string>>, text: string) => Shape;
    }
  >([
    [
      'rect',
      { keys: ['x', 'y', 'width', 'height'], paint: 'fill', build: (id, a) => new Rect(id, a) },
    ],
    ['circle', { keys: ['cx', 'cy', 'r'], paint: 'fill', build: (id, a) => new Circle(id, a) }],
    [
      'ellipse',
      { keys: ['cx', 'cy', 'rx', 'ry'], paint: 'fill', build: (id, a) => new Ellipse(id, a) },
    ],
    [
      'line',
      { keys: ['x1', 'y1', 'x2', 'y2'], paint: 'stroke', build: (id, a) => new Line(id, a) },
    ],
    ['text', { keys: ['x', 'y'], text: true, build: (id, a, t) => new Text(id, a, t) }],
    ['g', { keys: [], build: (id, a) => new Group(id, a) }],
  ]);
  private provider(type: string) {
    const found = this.providers.get(type);
    if (!found) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return found;
  }
  create(type: string, id: string, params: readonly string[]): Shape {
    const p = this.provider(type),
      required = p.keys.length + (p.text ? 1 : 0);
    if (params.length < required || params.length > required + (p.paint ? 1 : 0))
      throw new Error(`invalid create parameters for ${type}`);
    const attrs: Record<string, string> = {};
    p.keys.forEach((key, index) => {
      const raw = params[index]!;
      if (!raw.trim() || !Number.isFinite(Number(raw))) throw new Error('number must be finite');
      attrs[key] = raw;
    });
    if (p.paint && params[required] !== undefined) attrs[p.paint] = params[required]!;
    return p.build(id, attrs, p.text ? params[p.keys.length]! : '');
  }
  fromSvg(type: string, id: string, attrs: Readonly<Record<string, string>>, text: string): Shape {
    const p = this.provider(type);
    const allowed = new Set([
      ...p.keys,
      'fill',
      'stroke',
      'stroke-width',
      ...(p.text ? ['font-size', 'text-anchor'] : []),
    ]);
    for (const key of Object.keys(attrs))
      if (!allowed.has(key)) throw new Error(`unsupported SVG attribute: ${key}`);
    return p.build(id, attrs, text);
  }
}
