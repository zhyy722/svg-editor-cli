import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
import type { ShapeCreator } from '../application/ShapeCreator.js';
export class CreateCommand extends EditCommand {
  constructor(
    private readonly factory: ShapeCreator,
    private readonly type: string,
    private readonly id: string,
    private readonly params: readonly string[],
    private readonly parent?: string,
  ) {
    super();
  }
  override get label(): string {
    return `create ${this.id}`;
  }
  protected override apply(doc: SvgDocument): readonly string[] {
    doc.assertAvailable(this.id);
    const parent = this.parent ? doc.container(this.parent) : doc.root;
    const shape = this.factory.create(this.type, this.id, this.params);
    doc.add(shape, parent);
    return [`${shape.tag}#${this.id} created${this.parent ? ' in g#' + this.parent : ''}`];
  }
}
