import type { Command } from '../application/Command.js';
import type { Session } from '../application/Session.js';
export class SaveCommand implements Command {
  constructor(private readonly path?: string) {}
  execute(session: Session): readonly string[] {
    return session.save(this.path);
  }
}
