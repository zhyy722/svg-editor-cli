import { NumericShape } from './NumericShape.js';
export class Ellipse extends NumericShape {
  constructor(id:string,attrs:Readonly<Record<string,string>>){super(id,attrs,['cx'],['cy'],['cx','cy','rx','ry'],['rx','ry']);}
  override get tag():string{return 'ellipse';}
  override clone():Ellipse{return new Ellipse(this.id,this.attributes);}
}
