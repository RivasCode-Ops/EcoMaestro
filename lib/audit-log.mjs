import { mkdir, appendFile } from 'fs/promises';
import { join } from 'path';

const LOG_DIR = join(process.cwd(), 'data');
const LOG_FILE = join(LOG_DIR, 'audit.log.jsonl');

export async function auditLog(event) {
  const row = {
    ts: new Date().toISOString(),
    ...event
  };
  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(LOG_FILE, JSON.stringify(row) + '\n', 'utf8');
  } catch (e) {
    console.warn('audit-log:', e.message);
  }
  return row;
}
