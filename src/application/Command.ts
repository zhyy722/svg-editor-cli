import type { Session } from './Session.js';
export interface Command {
  execute(session: Session): readonly string[];
}
