import type { SvgDocument } from '../domain/SvgDocument.js';
export interface SvgCodec {
  decode(xml:string):{document:SvgDocument;warnings:readonly string[]};
  encode(document:SvgDocument):string;
}
