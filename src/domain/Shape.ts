import type { Group } from './Group.js';

export abstract class Shape {
  private owner: Group | null = null;
  private readonly style: Record<string, string> = {};
  protected constructor(private readonly identifier: string, attrs: Readonly<Record<string,string>> = {}) {
    if (!identifier || /\s/.test(identifier)) throw new Error('id must be nonempty and contain no whitespace');
    for (const key of ['fill', 'stroke', 'stroke-width']) {
      if (attrs[key] !== undefined) this.set(key, attrs[key]);
    }
  }
  get id(): string { return this.identifier; }
  get parent(): Group | null { return this.owner; }
  abstract get tag(): string;
  get children(): readonly Shape[] { return []; }
  get attributes(): Readonly<Record<string,string>> { return {...this.style}; }
  get content(): string { return ''; }
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract clone(): Shape;
  // Used by SVG import only; CLI scale follows the assignment's geometry rule.
  importScale(factor: number): void {
    this.scale(factor);
    if (this.style['stroke-width'] !== undefined) this.style['stroke-width'] = String(Number(this.style['stroke-width']) * factor);
  }
  set(attr: string, value: string): void {
    if (!['fill','stroke','stroke-width'].includes(attr)) throw new Error(`unknown attribute: ${attr}`);
    if (!value.trim()) throw new Error(`${attr} must not be empty`);
    if (attr === 'stroke-width' && (!Number.isFinite(Number(value)) || Number(value) < 0)) throw new Error('stroke-width must be nonnegative');
    this.style[attr] = value;
  }
  protected finite(value: number): void { if (!Number.isFinite(value)) throw new Error('number must be finite'); }
  protected factor(value: number): void { if (!Number.isFinite(value) || value <= 0) throw new Error('scale factor must be positive'); }
  attach(parent: Group | null): void { this.owner = parent; }
  isAncestorOf(other: Shape): boolean {
    for (let current: Shape | null = other.parent; current; current = current.parent) if (current === this) return true;
    return false;
  }
  describe(): string {
    const entries = Object.entries(this.attributes).map(([k,v])=>`${k}=${v}`).join(' ');
    return `${this.tag}#${this.id}${entries ? '  '+entries : ''}${this.describeContent()}`;
  }
  protected describeContent():string{return '';}
}
