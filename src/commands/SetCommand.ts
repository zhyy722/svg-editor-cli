import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
export class SetCommand extends EditCommand {
  constructor(private readonly id:string,private readonly attr:string,private readonly value:string){super();}
  override get label():string{return `set ${this.id} ${this.attr}`;}
  protected override apply(doc:SvgDocument):readonly string[]{const shape=doc.require(this.id);shape.set(this.attr,this.value);return [`${shape.tag}#${this.id} updated: ${this.attr}=${JSON.stringify(this.value)}`];}
}
