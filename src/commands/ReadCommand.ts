import type { Command } from '../application/Command.js';
import type { Session } from '../application/Session.js';
export class ReadCommand implements Command {
  constructor(private readonly path:string){}
  execute(session:Session):readonly string[]{return session.read(this.path);}
}
