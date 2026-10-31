import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
export class DeleteCommand extends EditCommand {
  constructor(private readonly id:string){super();}
  override get label():string{return `delete ${this.id}`;}
  protected override apply(doc:SvgDocument):readonly string[]{const shape=doc.require(this.id);doc.delete(this.id);return [`${shape.tag}#${this.id} deleted`];}
}
