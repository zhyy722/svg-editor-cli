import { NumericShape } from './NumericShape.js';
export class Line extends NumericShape {
  constructor(id:string,attrs:Readonly<Record<string,string>>){super(id,attrs,['x1','x2'],['y1','y2'],['x1','y1','x2','y2'],[]);}
  override get tag():string{return 'line';}
  override clone():Line{return new Line(this.id,this.attributes);}
}
