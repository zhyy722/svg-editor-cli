import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
export class GroupCommand extends EditCommand {
  constructor(
    private readonly id: string,
    private readonly members: readonly string[],
  ) {
    super();
  }
  override get label(): string {
    return `group ${this.id}`;
  }
  protected override apply(doc: SvgDocument): readonly string[] {
    doc.group(this.id, this.members);
    return [`g#${this.id} created with ${this.members.length} children`];
  }
}
