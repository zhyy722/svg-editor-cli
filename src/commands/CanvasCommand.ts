import type { Command } from '../application/Command.js';
import type { Session } from '../application/Session.js';
export class CanvasCommand implements Command {
  execute(session: Session): readonly string[] {
    return [`canvas ${session.document.width}x${session.document.height}`];
  }
}
