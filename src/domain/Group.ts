import { Shape } from './Shape.js';
export class Group extends Shape {
  private readonly nodes:Shape[]=[];
  constructor(id:string,attrs:Readonly<Record<string,string>>={}){super(id,attrs);}
  override get tag():string{return 'g';}
  override get children():readonly Shape[]{return [...this.nodes];}
  insert(shape:Shape,index=this.nodes.length):void{
    if(shape===this || shape.isAncestorOf(this)) throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
    if(shape.parent) throw new Error('shape already has a parent');
    this.nodes.splice(index,0,shape);shape.attach(this);
  }
  remove(shape:Shape):number{
    const index=this.nodes.indexOf(shape);if(index<0)throw new Error('shape is not a child');
    this.nodes.splice(index,1);shape.attach(null);return index;
  }
  override move(dx:number,dy:number):void{this.finite(dx);this.finite(dy);for(const child of this.nodes)child.move(dx,dy);}
  override scale(factor:number):void{this.factor(factor);for(const child of this.nodes)child.scale(factor);}
  override importScale(factor:number):void{this.factor(factor);for(const child of this.nodes)child.importScale(factor);const width=this.attributes['stroke-width'];if(width!==undefined)super.set('stroke-width',String(Number(width)*factor));}
  override clone():Group{const result=new Group(this.id,this.attributes);for(const child of this.nodes)result.insert(child.clone());return result;}
}
