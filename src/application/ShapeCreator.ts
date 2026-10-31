import type { Shape } from '../domain/Shape.js';
export interface ShapeCreator {
  create(type:string,id:string,params:readonly string[]):Shape;
  fromSvg(type:string,id:string,attrs:Readonly<Record<string,string>>,text:string):Shape;
}
