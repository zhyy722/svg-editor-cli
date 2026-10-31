import type { Session } from '../application/Session.js';
import type { CommandRegistry } from '../parsing/CommandRegistry.js';
export class Editor {
  constructor(private readonly session:Session,private readonly commands:CommandRegistry){}
  execute(line:string):readonly string[]{
    try{return this.commands.parse(line)?.execute(this.session)??[];}
    catch(error){return [`error: ${String(error instanceof Error?error.message:error).replace(/[\r\n]+/g,' ')}`];}
  }
}
