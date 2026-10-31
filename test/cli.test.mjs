import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync,writeFileSync,readFileSync,rmSync,mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { NodeFileStore } from '../dist/infrastructure/NodeFileStore.js';

const entry=resolve('dist/cli/Main.js');
test('actual piped CLI runs commands, continues after errors and round-trips files with spaces',()=>{
 const dir=mkdtempSync(join(tmpdir(),'svg-cli-'));
 try{
  const input=['# script','init 400 200','create g flow','create rect a 1 2 30 40 red in flow','create text t 2 3 "你好 世界" in flow','move flow 10 20','undo','redo','create circle a 0 0 1','save "demo file.svg"','undo','read "demo file.svg"','tree','show a','canvas','help'].join('\n');
  const result=spawnSync(process.execPath,[entry],{cwd:dir,input,encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/error: id already exists: a/);assert.match(result.stdout,/error: undo not allowed after io command/);assert.match(result.stdout,/rect#a  parent=g#flow/);assert.match(result.stdout,/你好 世界/);const xml=readFileSync(join(dir,'demo file.svg'),'utf8');assert.match(xml,/x="11" y="22"/);assert.match(xml,/width="400" height="200"/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('script mode handles comments, missing files and CLI arguments',()=>{
 const dir=mkdtempSync(join(tmpdir(),'svg-script-'));
 try{writeFileSync(join(dir,'input.txt'),'# comment\ninit\ncreate circle c 1 2 3\nshow c\n');const result=spawnSync(process.execPath,[entry,'--script','input.txt'],{cwd:dir,encoding:'utf8'});assert.equal(result.status,0);assert.match(result.stdout,/circle#c  parent=svg/);assert(!result.stdout.includes('svg>'));const missing=spawnSync(process.execPath,[entry,'--script','missing.txt'],{cwd:dir,encoding:'utf8'});assert.equal(missing.status,1);assert.match(missing.stderr,/error: cannot read script/);const invalid=spawnSync(process.execPath,[entry,'--wat'],{encoding:'utf8'});assert.equal(invalid.status,1);}
 finally{rmSync(dir,{recursive:true,force:true});}
});
test('real filesystem adapter replaces existing output and fails without damaging it',()=>{
 const dir=mkdtempSync(join(tmpdir(),'svg-files-'));
 try{const files=new NodeFileStore(),path=join(dir,'file.svg');files.write(path,'first');files.write(path,'second');assert.equal(files.read(path),'second');mkdirSync(join(dir,'folder'));assert.throws(()=>files.write(join(dir,'folder'),'bad'));assert.equal(files.read(path),'second');assert.throws(()=>files.write(join(dir,'absent','file.svg'),'bad'));}
 finally{rmSync(dir,{recursive:true,force:true});}
});
