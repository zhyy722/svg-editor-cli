import type { Command } from '../application/Command.js';
import type { ShapeCreator } from '../application/ShapeCreator.js';
import { Arguments } from './Arguments.js';
import { Tokenizer } from './Tokenizer.js';
import { CreateCommand } from '../commands/CreateCommand.js';
import { DeleteCommand } from '../commands/DeleteCommand.js';
import { MoveCommand } from '../commands/MoveCommand.js';
import { ScaleCommand } from '../commands/ScaleCommand.js';
import { SetCommand } from '../commands/SetCommand.js';
import { GroupCommand } from '../commands/GroupCommand.js';
import { UngroupCommand } from '../commands/UngroupCommand.js';
import { AddToCommand } from '../commands/AddToCommand.js';
import { ZOrderCommand } from '../commands/ZOrderCommand.js';
import { InitCommand } from '../commands/InitCommand.js';
import { ReadCommand } from '../commands/ReadCommand.js';
import { SaveCommand } from '../commands/SaveCommand.js';
import { CanvasCommand } from '../commands/CanvasCommand.js';
import { ResizeCanvasCommand } from '../commands/ResizeCanvasCommand.js';
import { TreeCommand } from '../commands/TreeCommand.js';
import { ShowCommand } from '../commands/ShowCommand.js';
import { HelpCommand } from '../commands/HelpCommand.js';
import { UndoCommand } from '../commands/UndoCommand.js';
import { RedoCommand } from '../commands/RedoCommand.js';
export class CommandRegistry {
  private readonly commands: Map<string, (args: Arguments) => Command>;
  private readonly tokenizer = new Tokenizer();
  constructor(factory: ShapeCreator) {
    // Phase 1 composition point; plugin command registration is a later refactor.
    this.commands = new Map([
      [
        'init',
        (a) => {
          a.count(0, 2);
          return new InitCommand(a.length ? a.number(0) : 800, a.length > 1 ? a.number(1) : 600);
        },
      ],
      ['read', (a) => new ReadCommand(a.count(1).token(0))],
      ['save', (a) => new SaveCommand(a.count(0, 1).optional(0))],
      [
        'canvas',
        (a) => {
          if (a.length === 0) return new CanvasCommand();
          a.count(2);
          return new ResizeCanvasCommand(a.number(0), a.number(1));
        },
      ],
      [
        'create',
        (a) => {
          a.count(2, Number.MAX_SAFE_INTEGER);
          const params = [...a.rest(2)];
          let parent: string | undefined;
          if (params.at(-2) === 'in') {
            parent = params.pop()!;
            params.pop();
          }
          return new CreateCommand(factory, a.token(0), a.token(1), params, parent);
        },
      ],
      ['delete', (a) => new DeleteCommand(a.count(1).token(0))],
      [
        'move',
        (a) => {
          a.count(3);
          return new MoveCommand(a.token(0), a.number(1), a.number(2));
        },
      ],
      [
        'scale',
        (a) => {
          a.count(2);
          return new ScaleCommand(a.token(0), a.number(1));
        },
      ],
      [
        'set',
        (a) => {
          a.count(3);
          return new SetCommand(a.token(0), a.token(1), a.token(2));
        },
      ],
      [
        'group',
        (a) => {
          a.count(3, Number.MAX_SAFE_INTEGER);
          return new GroupCommand(a.token(0), a.rest(1));
        },
      ],
      ['ungroup', (a) => new UngroupCommand(a.count(1).token(0))],
      [
        'addto',
        (a) => {
          a.count(2);
          return new AddToCommand(a.token(0), a.token(1));
        },
      ],
      ['front', (a) => new ZOrderCommand(a.count(1).token(0), true)],
      ['back', (a) => new ZOrderCommand(a.count(1).token(0), false)],
      ['tree', (a) => new TreeCommand(a.count(0, 1).optional(0))],
      ['show', (a) => new ShowCommand(a.count(1).token(0))],
      [
        'help',
        (a) => {
          a.count(0);
          return new HelpCommand();
        },
      ],
      [
        'undo',
        (a) => {
          a.count(0);
          return new UndoCommand();
        },
      ],
      [
        'redo',
        (a) => {
          a.count(0);
          return new RedoCommand();
        },
      ],
    ]);
  }
  parse(line: string): Command | null {
    const tokens = this.tokenizer.tokenize(line);
    if (!tokens.length) return null;
    const factory = this.commands.get(tokens[0]!);
    if (!factory) throw new Error(`unknown command: ${tokens[0]}`);
    return factory(new Arguments(tokens.slice(1)));
  }
}
