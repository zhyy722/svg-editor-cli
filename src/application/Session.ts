import { SvgDocument } from '../domain/SvgDocument.js';
import { History } from './History.js';
import type { SvgCodec } from './SvgCodec.js';
import type { FileStore } from './FileStore.js';
export class Session {
  private current:SvgDocument|null=null;
  private path:string|null=null;
  readonly history=new History();
  constructor(private readonly codec:SvgCodec,private readonly files:FileStore){}
  get document():SvgDocument{if(!this.current)throw new Error("no document. use 'init' or 'read' first");return this.current;}
  get filePath():string|null{return this.path;}
  replace(document:SvgDocument):void{this.current=document;}
  init(width:number,height:number):readonly string[]{const next=new SvgDocument(width,height);this.current=next;this.path=null;this.history.barrier();return [`canvas ${width}x${height} created`];}
  resize(width:number,height:number):readonly string[]{const next=this.document.clone();next.resize(width,height);this.current=next;this.history.barrier();return [`canvas resized to ${width}x${height}`];}
  read(path:string):readonly string[]{
    let xml:string;try{xml=this.files.read(path);}catch{throw new Error(`cannot read file: ${path}`);}
    const result=this.codec.decode(xml);this.current=result.document;this.path=path;this.history.barrier();
    return [...result.warnings,`read ${path} (${result.document.all().length} elements)`];
  }
  save(path?:string):readonly string[]{
    const document=this.document;const target=path??this.path;
    if(!target)throw new Error('no file path. use save <file.svg>');
    const xml=this.codec.encode(document);
    try{this.files.write(target,xml);}catch{throw new Error(`cannot write file: ${target}`);}
    this.path=target;this.history.barrier();return [`saved to ${target} (${document.all().length} elements)`];
  }
}
