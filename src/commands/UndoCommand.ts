import type { Command } from '../application/Command.js';
import type { Session } from '../application/Session.js';
export class UndoCommand implements Command {
  execute(session: Session): readonly string[] {
    return session.history.undo(session);
  }
}
