import type { UndoableCommand } from './UndoableCommand.js';
import type { Session } from './Session.js';
export class History {
  private past:UndoableCommand[]=[];
  private future:UndoableCommand[]=[];
  private blocked=true;
  record(command:UndoableCommand):void{this.past.push(command);this.future=[];this.blocked=false;}
  barrier():void{this.past=[];this.future=[];this.blocked=true;}
  undo(session:Session):readonly string[]{
    session.document;
    if(this.blocked)throw new Error('undo not allowed after io command');
    const command=this.past.at(-1);if(!command)throw new Error('nothing to undo');
    command.undo(session);this.past.pop();this.future.push(command);return [`undone: ${command.label}`];
  }
  redo(session:Session):readonly string[]{
    session.document;
    if(this.blocked)throw new Error('undo not allowed after io command');
    const command=this.future.at(-1);if(!command)throw new Error('nothing to redo');
    command.redo(session);this.future.pop();this.past.push(command);return [`redone: ${command.label}`];
  }
}
