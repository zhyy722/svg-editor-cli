import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
export class ZOrderCommand extends EditCommand {
  constructor(private readonly id:string,private readonly front:boolean){super();}
  override get label():string{return `${this.front?'front':'back'} ${this.id}`;}
  protected override apply(doc:SvgDocument):readonly string[]{doc.reorder(this.id,this.front);return [`${doc.require(this.id).tag}#${this.id} moved to ${this.front?'front':'back'}`];}
}
