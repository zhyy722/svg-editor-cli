import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
export class AddToCommand extends EditCommand {
  constructor(
    private readonly parent: string,
    private readonly id: string,
  ) {
    super();
  }
  override get label(): string {
    return `addto ${this.parent} ${this.id}`;
  }
  protected override apply(doc: SvgDocument): readonly string[] {
    doc.addTo(this.parent, this.id);
    return [`${doc.require(this.id).tag}#${this.id} added to g#${this.parent}`];
  }
}
