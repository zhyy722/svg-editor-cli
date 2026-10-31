import { NumericShape } from './NumericShape.js';
export class Text extends NumericShape {
  private label:string;
  private readonly presentation:Record<string,string>={};
  constructor(id:string,attrs:Readonly<Record<string,string>>,content=''){
    super(id,attrs,['x'],['y'],['x','y'],[]);this.label=content;
    for(const key of ['font-size','text-anchor']) if(attrs[key]!==undefined) this.presentation[key]=attrs[key];
    if(this.presentation['font-size']!==undefined && (!Number.isFinite(Number(this.presentation['font-size'])) || Number(this.presentation['font-size'])<0)) throw new Error('font-size must be nonnegative');
  }
  override get tag():string{return 'text';}
  override get content():string{return this.label;}
  override get attributes():Readonly<Record<string,string>>{return {...super.attributes,...this.presentation};}
  override set(attr:string,value:string):void{if(attr==='text') this.label=value;else super.set(attr,value);}
  override clone():Text{return new Text(this.id,this.attributes,this.content);}
  override importScale(factor:number):void{super.importScale(factor);this.presentation['font-size']=String(Number(this.presentation['font-size']??16)*factor);}
}
