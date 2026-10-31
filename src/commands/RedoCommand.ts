import type { Command } from '../application/Command.js';
import type { Session } from '../application/Session.js';
export class RedoCommand implements Command {execute(session:Session):readonly string[]{return session.history.redo(session);}}
