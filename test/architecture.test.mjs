import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync,readFileSync } from 'node:fs';
import { resolve,dirname,basename } from 'node:path';

const root=resolve('src');
const rules={domain:['domain'],application:['application','domain'],commands:['commands','application','domain'],parsing:['parsing','commands','application','domain'],infrastructure:['infrastructure','application','domain'],cli:['cli','parsing','infrastructure','application','domain']};
function files(path){return readdirSync(path,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(resolve(path,entry.name)):[resolve(path,entry.name)]);}
test('production dependencies follow the architecture; external dependencies stay in adapters/CLI',()=>{
 for(const path of files(root).filter(p=>p.endsWith('.ts'))){
  const source=readFileSync(path,'utf8'),module=path.slice(root.length+1).split(/[\\/]/)[0];
  for(const match of source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)){
   const target=match[1];
   if(target.startsWith('.')){const dependency=resolve(dirname(path),target).slice(root.length+1).split(/[\\/]/)[0];assert(rules[module].includes(dependency),`${module} -> ${dependency}: ${path}`);}
   else assert(['infrastructure','cli'].includes(module),`external dependency ${target} in ${module}`);
  }
 }
});
test('each production class has its own matching file and no tag switch dispatch',()=>{
 for(const path of files(root).filter(p=>p.endsWith('.ts'))){const source=readFileSync(path,'utf8');const classes=[...source.matchAll(/export (?:abstract )?class (\w+)/g)];assert(classes.length<=1,path);if(classes.length)assert.equal(basename(path,'.ts'),classes[0][1]);assert(!/\bswitch\s*\(/.test(source),path);}
});
