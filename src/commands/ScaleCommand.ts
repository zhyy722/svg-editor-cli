import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
export class ScaleCommand extends EditCommand {
  constructor(
    private readonly id: string,
    private readonly factor: number,
  ) {
    super();
  }
  override get label(): string {
    return `scale ${this.id}`;
  }
  protected override apply(doc: SvgDocument): readonly string[] {
    const shape = doc.require(this.id);
    shape.scale(this.factor);
    return [`${shape.tag}#${this.id} scaled by ${this.factor}`];
  }
}
