import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
export class MoveCommand extends EditCommand {
  constructor(
    private readonly id: string,
    private readonly dx: number,
    private readonly dy: number,
  ) {
    super();
  }
  override get label(): string {
    return `move ${this.id}`;
  }
  protected override apply(doc: SvgDocument): readonly string[] {
    const shape = doc.require(this.id);
    shape.move(this.dx, this.dy);
    return [`${shape.tag}#${this.id} moved by (${this.dx},${this.dy})`];
  }
}
