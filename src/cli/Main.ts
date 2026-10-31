import { createInterface } from 'node:readline';
import { readFileSync } from 'node:fs';
import { Session } from '../application/Session.js';
import { ShapeFactory } from '../parsing/ShapeFactory.js';
import { CommandRegistry } from '../parsing/CommandRegistry.js';
import { XmlSvgCodec } from '../infrastructure/XmlSvgCodec.js';
import { NodeFileStore } from '../infrastructure/NodeFileStore.js';
import { Editor } from './Editor.js';

export class Main {
  private readonly editor:Editor;
  constructor(){const shapes=new ShapeFactory();this.editor=new Editor(new Session(new XmlSvgCodec(shapes),new NodeFileStore()),new CommandRegistry(shapes));}
  private execute(line:string):void{for(const message of this.editor.execute(line))console.log(message);}
  run(args:readonly string[]):void{
    if(args.length){
      if(args.length!==2||args[0]!=='--script'){console.error('error: usage: node dist/cli/Main.js [--script file.txt]');process.exitCode=1;}
      else{try{for(const line of readFileSync(args[1]!,'utf8').split(/\r?\n/))this.execute(line);}catch{console.error(`error: cannot read script: ${args[1]}`);process.exitCode=1;}}
      return;
    }
    console.log("svg-editor 0.1 — type 'help' for commands");
    const interactive=Boolean(process.stdin.isTTY);
    const reader=createInterface({input:process.stdin,output:process.stdout,terminal:interactive});
    reader.setPrompt('svg> ');if(interactive)reader.prompt();
    reader.on('line',line=>{this.execute(line);if(interactive)reader.prompt();});
  }
}
new Main().run(process.argv.slice(2));
