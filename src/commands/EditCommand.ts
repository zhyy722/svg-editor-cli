import type { Command } from '../application/Command.js';
import type { Session } from '../application/Session.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
export abstract class EditCommand implements Command {
  private before:SvgDocument|null=null;
  private after:SvgDocument|null=null;
  abstract get label():string;
  protected abstract apply(document:SvgDocument):readonly string[];
  execute(session:Session):readonly string[]{
    const original=session.document;const draft=original.clone();
    const messages=this.apply(draft);
    this.before=original.clone();this.after=draft.clone();session.replace(draft);session.history.record(this);return messages;
  }
  undo(session:Session):void{if(!this.before)throw new Error('command not executed');session.replace(this.before.clone());}
  redo(session:Session):void{if(!this.after)throw new Error('command not executed');session.replace(this.after.clone());}
}
