import { createInterface } from 'node:readline';

const ENTER_CHARS = new Set(['\n', '\r']);
const CTRL_C = String.fromCharCode(3);
const BACKSPACE_CHARS = new Set([String.fromCharCode(127), '\b']);

export function prompt(promptText: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Reads a line without echoing it to the terminal. Falls back to a plain
 * `prompt()` when stdin isn't a TTY (piped input in tests/CI) — there's no
 * terminal to mask against in that case, and raw mode isn't available.
 */
export function promptHidden(promptText: string): Promise<string> {
  if (!process.stdin.isTTY) {
    return prompt(promptText);
  }

  return new Promise((resolve) => {
    process.stdout.write(promptText);
    let value = '';

    const cleanup = () => {
      process.stdin.removeListener('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };

    function onData(chunk: Buffer) {
      const input = chunk.toString('utf8');
      for (const char of input) {
        if (ENTER_CHARS.has(char)) {
          cleanup();
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (char === CTRL_C) {
          cleanup();
          process.stdout.write('\n');
          process.exit(130);
        }
        if (BACKSPACE_CHARS.has(char)) {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', onData);
  });
}
