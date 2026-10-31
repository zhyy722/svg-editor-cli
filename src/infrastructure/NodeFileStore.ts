import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { FileStore } from '../application/FileStore.js';
export class NodeFileStore implements FileStore {
  read(path: string): string {
    return readFileSync(path, 'utf8');
  }
  write(path: string, content: string): void {
    const temporary = join(dirname(path), `.svg-editor-${randomUUID()}.tmp`);
    try {
      writeFileSync(temporary, content, 'utf8');
      renameSync(temporary, path);
    } catch (error) {
      try {
        unlinkSync(temporary);
      } catch {
        /* No temp file if creation failed. */
      }
      throw error;
    }
  }
}
