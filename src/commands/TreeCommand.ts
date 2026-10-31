import type { Command } from '../application/Command.js';
import type { Session } from '../application/Session.js';
import type { Shape } from '../domain/Shape.js';
export class TreeCommand implements Command {
  constructor(private readonly id?:string){}
  execute(session:Session):readonly string[]{
    const doc=session.document,lines:string[]=[];
    const visit=(node:Shape,prefix:string,last:boolean,top=false):void=>{
      lines.push(prefix+(top?'':last?'└── ':'├── ')+node.describe());
      node.children.forEach((child,i)=>visit(child,prefix+(top?'':last?'    ':'│   '),i===node.children.length-1));
    };
    if(this.id)visit(doc.require(this.id),'',true,true);
    else{lines.push(`svg (${doc.width}x${doc.height})`);doc.root.children.forEach((child,i)=>visit(child,'',i===doc.root.children.length-1));}
    return lines;
  }
}
