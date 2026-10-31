import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
export class UngroupCommand extends EditCommand {
  constructor(private readonly id:string){super();}
  override get label():string{return `ungroup ${this.id}`;}
  protected override apply(doc:SvgDocument):readonly string[]{doc.ungroup(this.id);return [`g#${this.id} ungrouped`];}
}
