import { NumericShape } from './NumericShape.js';
export class Circle extends NumericShape {
  constructor(id:string,attrs:Readonly<Record<string,string>>){super(id,attrs,['cx'],['cy'],['cx','cy','r'],['r']);}
  override get tag():string{return 'circle';}
  override clone():Circle{return new Circle(this.id,this.attributes);}
}
