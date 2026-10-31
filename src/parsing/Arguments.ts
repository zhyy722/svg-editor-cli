export class Arguments {
  constructor(private readonly values: readonly string[]) {}
  get length(): number {
    return this.values.length;
  }
  count(min: number, max = min): this {
    if (this.length < min || this.length > max) throw new Error('invalid command arguments');
    return this;
  }
  token(index: number): string {
    const result = this.values[index];
    if (result === undefined) throw new Error('missing command argument');
    return result;
  }
  optional(index: number): string | undefined {
    return this.values[index];
  }
  rest(index: number): readonly string[] {
    return this.values.slice(index);
  }
  number(index: number): number {
    const raw = this.token(index),
      number = Number(raw);
    if (!raw.trim() || !Number.isFinite(number)) throw new Error('number must be finite');
    return number;
  }
}
