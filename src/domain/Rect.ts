import { NumericShape } from './NumericShape.js';
export class Rect extends NumericShape {
  constructor(id: string, attrs: Readonly<Record<string, string>>) {
    super(id, attrs, ['x'], ['y'], ['x', 'y', 'width', 'height'], ['width', 'height']);
  }
  override get tag(): string {
    return 'rect';
  }
  override clone(): Rect {
    return new Rect(this.id, this.attributes);
  }
}
