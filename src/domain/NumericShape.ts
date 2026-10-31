import { Shape } from './Shape.js';

export abstract class NumericShape extends Shape {
  private readonly geometry: Record<string,number> = {};
  protected constructor(id:string, attrs:Readonly<Record<string,string>>, private readonly xKeys:readonly string[], private readonly yKeys:readonly string[], keys:readonly string[], private readonly sizes:readonly string[]) {
    super(id, attrs);
    for (const key of keys) {
      const number = Number(attrs[key] ?? '0');
      this.finite(number);
      if (sizes.includes(key) && number < 0) throw new Error(`${key} must be nonnegative`);
      this.geometry[key] = number;
    }
  }
  override get attributes(): Readonly<Record<string,string>> {
    return {...Object.fromEntries(Object.entries(this.geometry).map(([k,v])=>[k,String(v)])), ...super.attributes};
  }
  override set(attr:string,value:string):void {
    if (!Object.hasOwn(this.geometry ?? {},attr)) { super.set(attr,value); return; }
    const number=Number(value);this.finite(number);
    if (this.sizes.includes(attr) && number<0) throw new Error(`${attr} must be nonnegative`);
    this.geometry[attr]=number;
  }
  override move(dx:number,dy:number):void {
    this.finite(dx);this.finite(dy);
    for(const key of this.xKeys) { const n=this.geometry[key]!+dx;this.finite(n);this.geometry[key]=n; }
    for(const key of this.yKeys) { const n=this.geometry[key]!+dy;this.finite(n);this.geometry[key]=n; }
  }
  override scale(factor:number):void {
    this.factor(factor);
    for(const key of Object.keys(this.geometry)) { const n=this.geometry[key]!*factor;this.finite(n);this.geometry[key]=n; }
  }
}
