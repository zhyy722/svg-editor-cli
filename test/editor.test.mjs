import test from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../dist/application/Session.js';
import { ShapeFactory } from '../dist/parsing/ShapeFactory.js';
import { CommandRegistry } from '../dist/parsing/CommandRegistry.js';
import { XmlSvgCodec } from '../dist/infrastructure/XmlSvgCodec.js';
import { Editor } from '../dist/cli/Editor.js';

class MemoryFiles {
  files = new Map();
  failWrite = false;
  read(path) {
    if (!this.files.has(path)) throw Error('missing');
    return this.files.get(path);
  }
  write(path, content) {
    if (this.failWrite) throw Error('unwritable');
    this.files.set(path, content);
  }
}
function setup() {
  const factory = new ShapeFactory(),
    codec = new XmlSvgCodec(factory),
    files = new MemoryFiles(),
    session = new Session(codec, files),
    editor = new Editor(session, new CommandRegistry(factory));
  const run = (line) => editor.execute(line).join('\n');
  const ok = (line) => {
    const result = run(line);
    assert(!result.startsWith('error:'), result);
    return result;
  };
  return { codec, files, session, run, ok, snapshot: () => codec.encode(session.document) };
}
function svg(content, attrs = 'width="400" height="300"') {
  return `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${content}</svg>`;
}

test('no document, help, comments and display commands do not enter history', () => {
  const s = setup();
  assert.match(s.run('tree'), /^error: no document/);
  assert.match(s.ok('help'), /create ellipse/);
  assert.equal(s.run(' # comment'), '');
  s.ok('init');
  assert.equal(s.ok('canvas'), 'canvas 800x600');
  s.ok('create rect a 1 2 3 4');
  s.ok('canvas');
  s.ok('tree');
  s.ok('show a');
  s.ok('help');
  s.ok('undo');
  assert.equal(s.session.document.find('a'), undefined);
});
test('all six types, default paint absent, finite geometry and exact set whitelist', () => {
  const s = setup();
  s.ok('init 400 300');
  s.ok('create rect r 1.5 -2 3 4');
  s.ok('create circle c 1 2 3 red');
  s.ok('create ellipse e 1 2 3 4 blue');
  s.ok('create line l 1 2 3 4 black');
  s.ok('create text t 4 5 "你好 & <世界>"');
  s.ok('create g g');
  assert.equal(s.session.document.all().length, 6);
  assert.equal(s.session.document.require('r').attributes.fill, undefined);
  assert.equal(s.session.document.require('l').attributes.stroke, 'black');
  s.ok('set r width 99');
  s.ok('set t text ""');
  assert.equal(s.session.document.require('t').content, '');
  const before = s.snapshot();
  for (const line of [
    'set c width 2',
    'set g x 2',
    'set r id z',
    'create box b 1 2 3 4 x',
    'create hexagon h',
    'create circle bad 1 2 -1',
    'scale r 0',
    'scale r -1',
    'move r NaN 1',
    'create rect z 0 0 1 1 red extra',
    'set r width -1',
  ]) {
    assert.match(s.run(line), /^error:/, line);
    assert.equal(s.snapshot(), before, line);
  }
});
test('composite move/scale, create in, style inheritance and nested undo/redo', () => {
  const s = setup();
  s.ok('init');
  s.ok('create g outer');
  s.ok('create g inner in outer');
  s.ok('create rect r 10 20 30 40 in inner');
  s.ok('create text t 10 20 "hello world" in inner');
  const before = s.snapshot();
  s.ok('move outer 2 3');
  assert.equal(s.session.document.require('r').attributes.x, '12');
  s.ok('scale outer 2');
  assert.equal(s.session.document.require('r').attributes.height, '80');
  assert.equal(s.session.document.require('t').attributes.y, '46');
  s.ok('set outer fill green');
  assert.equal(s.session.document.require('outer').attributes.fill, 'green');
  s.ok('undo');
  s.ok('undo');
  s.ok('undo');
  assert.equal(s.snapshot(), before);
  s.ok('redo');
  s.ok('redo');
  assert.equal(s.session.document.require('r').attributes.x, '24');
});
test('failed edit leaves redo intact; new successful edit clears redo', () => {
  const s = setup();
  s.ok('init');
  s.ok('create rect r 0 0 10 10');
  s.ok('move r 4 5');
  s.ok('undo');
  const before = s.snapshot();
  assert.match(s.run('set r width -2'), /^error:/);
  assert.equal(s.snapshot(), before);
  s.ok('redo');
  assert.equal(s.session.document.require('r').attributes.x, '4');
  s.ok('undo');
  s.ok('set r fill red');
  assert.equal(s.run('redo'), 'error: nothing to redo');
});
test('group preserves source z-order; subtree deletion is one undo unit; ids are case sensitive', () => {
  const s = setup();
  s.ok('init');
  s.ok('create rect A 1 2 3 4');
  s.ok('create rect a 0 0 1 1');
  s.ok('create circle c 0 0 1');
  s.ok('group g c A');
  assert.deepEqual(
    s.session.document.require('g').children.map((n) => n.id),
    ['A', 'c'],
  );
  const before = s.snapshot();
  s.ok('delete g');
  assert.equal(s.session.document.find('A'), undefined);
  s.ok('undo');
  assert.equal(s.snapshot(), before);
  s.ok('redo');
  assert.equal(s.session.document.find('c'), undefined);
  assert(s.session.document.find('a'));
});
test('cycle, overlap, duplicate id and parent validation failures are atomic', () => {
  const s = setup();
  s.ok('init');
  s.ok('create g g');
  s.ok('create g inner in g');
  s.ok('create rect r 0 0 1 1 in inner');
  const before = s.snapshot();
  for (const [command, error] of [
    ['group bad r g', 'cannot group a container into its own descendant: g'],
    ['addto inner g', 'cannot group a container into its own descendant: g'],
    ['addto g g', 'cannot group a container into its own descendant: g'],
    ['create g g', 'id already exists: g'],
    ['create g q in absent', 'no such container: absent'],
    ['create g q in r', 'not a container: r'],
    ['delete absent', 'no such shape: absent'],
  ]) {
    assert.equal(s.run(command), 'error: ' + error);
    assert.equal(s.snapshot(), before);
  }
  s.ok('undo');
  assert.equal(s.session.document.find('r'), undefined);
});
test('nested ungroup keeps child slot; top-level ungroup is rejected', () => {
  const s = setup();
  s.ok('init');
  s.ok('create g root');
  s.ok('create rect a 0 0 1 1 in root');
  s.ok('create g inner in root');
  s.ok('create circle c 0 0 1 in inner');
  s.ok('create rect b 0 0 1 1 in root');
  const before = s.snapshot();
  s.ok('ungroup inner');
  assert.deepEqual(
    s.session.document.require('root').children.map((n) => n.id),
    ['a', 'c', 'b'],
  );
  s.ok('undo');
  assert.equal(s.snapshot(), before);
  assert.equal(s.run('ungroup root'), 'error: cannot ungroup top-level container: root');
});
test('addto and front/back affect siblings only and restore order', () => {
  const s = setup();
  s.ok('init');
  s.ok('create g a');
  s.ok('create g b');
  s.ok('create rect r 1 2 3 4 in a');
  s.ok('create rect q 0 0 1 1 in b');
  s.ok('addto b r');
  assert.equal(s.session.document.require('r').parent.id, 'b');
  assert.deepEqual(
    s.session.document.require('b').children.map((n) => n.id),
    ['q', 'r'],
  );
  s.ok('back r');
  assert.deepEqual(
    s.session.document.require('b').children.map((n) => n.id),
    ['r', 'q'],
  );
  s.ok('front r');
  assert.deepEqual(
    s.session.document.require('b').children.map((n) => n.id),
    ['q', 'r'],
  );
  s.ok('undo');
  assert.deepEqual(
    s.session.document.require('b').children.map((n) => n.id),
    ['r', 'q'],
  );
});
test('cross-parent group uses lowest common ancestor; undo restores all parents', () => {
  const s = setup();
  s.ok('init');
  s.ok('create g a');
  s.ok('create g b');
  s.ok('create rect r 0 0 1 1 in a');
  s.ok('create circle c 0 0 1 in b');
  const before = s.snapshot();
  s.ok('group merged c r');
  assert.equal(s.session.document.require('merged').parent, s.session.document.root);
  assert.deepEqual(
    s.session.document.require('merged').children.map((n) => n.id),
    ['r', 'c'],
  );
  s.ok('undo');
  assert.equal(s.snapshot(), before);
});
test('IO barriers, default path and failed IO preserving history and path', () => {
  const s = setup();
  s.ok('init');
  s.ok('create rect a 0 0 1 1');
  assert.equal(s.run('save'), 'error: no file path. use save <file.svg>');
  s.ok('undo');
  s.ok('redo');
  s.ok('save "my file.svg"');
  assert.equal(s.session.filePath, 'my file.svg');
  assert.equal(s.run('undo'), 'error: undo not allowed after io command');
  s.ok('move a 1 1');
  s.files.failWrite = true;
  assert.equal(s.run('save bad.svg'), 'error: cannot write file: bad.svg');
  assert.equal(s.session.filePath, 'my file.svg');
  s.ok('undo');
  s.files.failWrite = false;
  s.ok('save');
  s.ok('read "my file.svg"');
  assert.equal(s.run('redo'), 'error: undo not allowed after io command');
  s.ok('create circle c 0 0 1');
  assert.equal(s.run('read missing.svg'), 'error: cannot read file: missing.svg');
  s.ok('undo');
  s.ok('canvas 320 240');
  assert.equal(s.run('undo'), 'error: undo not allowed after io command');
  const old = s.snapshot();
  assert.match(s.run('canvas 0 10'), /^error:/);
  assert.equal(s.snapshot(), old);
});
test('auto ids avoid explicit ids that occur later in external SVG', () => {
  const s = setup();
  s.files.files.set('x.svg', svg('<rect/><rect id="rect1"/><g><circle/></g>'));
  assert.match(s.ok('read x.svg'), /assigned id rect2/);
  for (const id of ['rect1', 'rect2', 'g1', 'circle1']) assert(s.session.document.find(id));
  assert.equal(new Set(s.session.document.all().map((n) => n.id)).size, 4);
});
test('XML round trip preserves tree, unicode, text escaping and styles', () => {
  const s = setup();
  s.ok('init 400 200');
  s.ok('create g g');
  s.ok('create rect r 1 2 3 4 #eee in g');
  s.ok('set r stroke-width 2.5');
  s.ok('create text t 5 6 "你好 & <世界>" in g');
  const before = s.snapshot();
  s.ok('save doc.svg');
  assert.match(s.files.files.get('doc.svg'), /&amp;/);
  s.ok('read doc.svg');
  assert.equal(s.snapshot(), before);
  assert.equal(s.session.document.require('t').content, '你好 & <世界>');
});
test('invalid XML, duplicate ids, unsupported input and DTD do not replace document', () => {
  const s = setup();
  s.ok('init');
  s.ok('create rect a 0 0 1 1');
  const before = s.snapshot(),
    path = s.session.filePath;
  for (const input of [
    svg('<rect id="r"/><circle id="r"/>'),
    svg('<path id="p"/>'),
    svg('<rect id="r" banana="x"/>'),
    '<svg><rect></svg>',
    '<!DOCTYPE svg [<!ENTITY x "bad">]>' + svg(''),
    svg('<g id="g"><rect id="r" width="-1"/></g>'),
  ]) {
    s.files.files.set('bad.svg', input);
    assert.match(s.run('read bad.svg'), /^error:/);
    assert.equal(s.snapshot(), before);
    assert.equal(s.session.filePath, path);
  }
  s.ok('undo');
});
test('nested transform import normalizes coordinates and preserves supported text attributes', () => {
  const s = setup();
  s.files.files.set(
    'x.svg',
    svg(
      '<g id="outer" transform="translate(60,40)"><g id="inner" transform="translate(200,0) scale(0.8)"><rect id="r" x="0" y="0" width="120" height="60"/><text id="t" x="60" y="38" text-anchor="middle" font-size="16">End</text></g></g>',
    ),
  );
  s.ok('read x.svg');
  assert.equal(s.session.document.require('r').attributes.x, '260');
  assert.equal(s.session.document.require('r').attributes.width, '96');
  assert.equal(s.session.document.require('t').attributes['font-size'], '12.8');
  const before = s.snapshot();
  s.ok('save y.svg');
  s.ok('read y.svg');
  assert.equal(s.snapshot(), before);
});
test('overflow midway through recursive edit rolls back every sibling and history', () => {
  const s = setup();
  s.ok('init');
  s.ok('create g g');
  s.ok('create rect a 1 2 3 4 in g');
  s.ok('create rect b 1e308 1 2 3 in g');
  const before = s.snapshot();
  assert.match(s.run('scale g 10'), /^error:/);
  assert.equal(s.snapshot(), before);
  s.ok('undo');
  assert.equal(s.session.document.find('b'), undefined);
});
test('quotes, backslashes, empty text, arity and unterminated quote', () => {
  const s = setup();
  s.ok('init');
  s.ok('create text t 1 2 ""');
  assert.match(s.ok('show t'), /text=""/);
  s.ok(String.raw`set t text "a \"b\" \\ c"`);
  assert.equal(s.session.document.require('t').content, 'a "b" \\ c');
  const before = s.snapshot();
  for (const input of [
    'set t text "bad',
    'move t 2',
    'undo extra',
    'create text t2 1 2',
    'help extra',
    'wat',
    'set t x ""',
  ])
    assert.match(s.run(input), /^error:/);
  assert.equal(s.snapshot(), before);
});
