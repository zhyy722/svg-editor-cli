import type { Command } from '../application/Command.js';
import type { Session } from '../application/Session.js';
export class ShowCommand implements Command {
  constructor(private readonly id:string){}
  execute(session:Session):readonly string[]{const doc=session.document,shape=doc.require(this.id);return [`${shape.tag}#${shape.id}  parent=${shape.parent===doc.root?'svg':'g#'+shape.parent!.id}`,`  ${Object.entries(shape.attributes).map(([k,v])=>`${k}=${v}`).join(' ')}`,...(shape.content!==''?[`  text=${JSON.stringify(shape.content)}`]:[])];}
}
