export class Tokenizer {
  tokenize(line: string): readonly string[] {
    if (!line.trim() || line.trimStart().startsWith('#')) return [];
    const tokens: string[] = [];
    let token = '',
      quoted = false,
      started = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (ch === '"') {
        quoted = !quoted;
        started = true;
        continue;
      }
      if (ch === '\\' && quoted && ['"', '\\'].includes(line[i + 1] ?? '')) {
        token += line[++i];
        started = true;
        continue;
      }
      if (/\s/.test(ch) && !quoted) {
        if (started) {
          tokens.push(token);
          token = '';
          started = false;
        }
        continue;
      }
      token += ch;
      started = true;
    }
    if (quoted) throw new Error('unterminated double quote');
    if (started) tokens.push(token);
    return tokens;
  }
}
