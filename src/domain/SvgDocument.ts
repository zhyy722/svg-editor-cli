import { Group } from './Group.js';
import type { Shape } from './Shape.js';
export class SvgDocument {
  private canvasWidth: number;
  private canvasHeight: number;
  private bounds: string;
  private readonly canvasRoot = new Group('__canvas__');
  constructor(width = 800, height = 600, viewBox?: string) {
    this.positive(width);
    this.positive(height);
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.bounds = viewBox ?? `0 0 ${width} ${height}`;
  }
  get width(): number {
    return this.canvasWidth;
  }
  get height(): number {
    return this.canvasHeight;
  }
  get viewBox(): string {
    return this.bounds;
  }
  get root(): Group {
    return this.canvasRoot;
  }
  resize(width: number, height: number): void {
    this.positive(width);
    this.positive(height);
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.bounds = `0 0 ${width} ${height}`;
  }
  private positive(value: number): void {
    if (!Number.isFinite(value) || value <= 0)
      throw new Error('canvas dimensions must be positive');
  }
  all(): readonly Shape[] {
    const result: Shape[] = [];
    const visit = (node: Shape): void => {
      result.push(node);
      for (const child of node.children) visit(child);
    };
    for (const child of this.root.children) visit(child);
    return result;
  }
  find(id: string): Shape | undefined {
    return this.all().find((shape) => shape.id === id);
  }
  require(id: string): Shape {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  container(id: string): Group {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such container: ${id}`);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    return shape;
  }
  assertAvailable(id: string): void {
    if (this.find(id)) throw new Error(`id already exists: ${id}`);
  }
  add(shape: Shape, parent: Group = this.root): void {
    const ids = new Set<string>();
    const visit = (node: Shape): void => {
      this.assertAvailable(node.id);
      if (ids.has(node.id)) throw new Error(`id already exists: ${node.id}`);
      ids.add(node.id);
      for (const child of node.children) visit(child);
    };
    visit(shape);
    parent.insert(shape);
  }
  delete(id: string): void {
    const shape = this.require(id);
    shape.parent!.remove(shape);
  }
  group(id: string, ids: readonly string[]): void {
    this.assertAvailable(id);
    if (ids.length < 2) throw new Error('group requires at least two shapes');
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group member');
    const selected = ids.map((value) => this.require(value));
    for (const a of selected)
      for (const b of selected)
        if (a !== b && a.isAncestorOf(b))
          throw new Error(`cannot group a container into its own descendant: ${a.id}`);
    const order = this.all();
    selected.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    let parent = selected[0]!.parent!;
    while (!selected.every((node) => node.parent === parent || parent.isAncestorOf(node)))
      parent = parent.parent!;
    let branch: Shape = selected[0]!;
    while (branch.parent !== parent) branch = branch.parent!;
    const index = parent.children.indexOf(branch);
    const result = new Group(id);
    for (const node of selected) {
      node.parent!.remove(node);
      result.insert(node);
    }
    parent.insert(result, index);
  }
  ungroup(id: string): void {
    const group = this.container(id);
    const parent = group.parent!;
    if (parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const index = parent.remove(group);
    let offset = 0;
    for (const child of group.children) {
      group.remove(child);
      parent.insert(child, index + offset++);
    }
  }
  addTo(gid: string, id: string): void {
    const group = this.container(gid),
      shape = this.require(id);
    if (shape === group || shape.isAncestorOf(group))
      throw new Error(`cannot group a container into its own descendant: ${id}`);
    shape.parent!.remove(shape);
    group.insert(shape);
  }
  reorder(id: string, front: boolean): void {
    const shape = this.require(id),
      parent = shape.parent!;
    parent.remove(shape);
    parent.insert(shape, front ? parent.children.length : 0);
  }
  clone(): SvgDocument {
    const result = new SvgDocument(this.width, this.height, this.viewBox);
    for (const child of this.root.children) result.add(child.clone());
    return result;
  }
}
