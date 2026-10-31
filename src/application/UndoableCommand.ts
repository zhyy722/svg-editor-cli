import type { Command } from './Command.js';
import type { Session } from './Session.js';
export interface UndoableCommand extends Command {
  readonly label: string;
  undo(session: Session): void;
  redo(session: Session): void;
}
