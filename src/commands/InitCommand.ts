import type { Command } from '../application/Command.js';
import type { Session } from '../application/Session.js';
export class InitCommand implements Command {
  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {}
  execute(session: Session): readonly string[] {
    return session.init(this.width, this.height);
  }
}
