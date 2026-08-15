const ENTER_CHARS = new Set(['\n', '\r']);
const CTRL_C = String.fromCharCode(3);
const BACKSPACE_CHARS = new Set([String.fromCharCode(127), '\b']);

let batchedLinesPromise: Promise<string[]> | null = null;
let batchedLines: string[] | null = null;

/**
 * Piped/non-TTY stdin (tests, CI, `command | aegis ...`) delivers all input
 * as one stream that ends (EOF) once the writer is done. readline's
 * `.question()` doesn't compose safely against that: it processes whatever
 * is already buffered as soon as it arrives, so a *second* `.question()`
 * call — attached only after the first one's callback resolves — can miss a
 * line that arrived in the same chunk as the first. Reading all of stdin to
 * EOF once, then handing out lines from that buffer, sidesteps the race
 * entirely and is exactly what non-interactive usage needs anyway.
 */
function readAllStdinLines(): Promise<string[]> {
  if (!batchedLinesPromise) {
    batchedLinesPromise = new Promise((resolve) => {
      let data = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (chunk: string) => {
        data += chunk;
      });
      process.stdin.on('end', () => resolve(data.split(/\r?\n/)));
      process.stdin.resume();
    });
  }
  return batchedLinesPromise;
}

async function nextBatchedLine(): Promise<string> {
  if (batchedLines === null) {
    batchedLines = await readAllStdinLines();
  }
  return batchedLines.shift() ?? '';
}

/** Reads one line of visible input, echoing it back when run non-interactively. */
export async function prompt(promptText: string): Promise<string> {
  if (!process.stdin.isTTY) {
    process.stdout.write(promptText);
    const line = await nextBatchedLine();
    process.stdout.write(`${line}\n`);
    return line;
  }
  return readTtyLine(promptText, { mask: false });
}

/**
 * Reads a line without echoing it to the terminal. Falls back to the same
 * batched, EOF-driven read as `prompt()` when stdin isn't a TTY — there's no
 * terminal to mask against in that case, and raw mode isn't available.
 */
export async function promptHidden(promptText: string): Promise<string> {
  if (!process.stdin.isTTY) {
    process.stdout.write(promptText);
    const line = await nextBatchedLine();
    process.stdout.write('\n');
    return line;
  }
  return readTtyLine(promptText, { mask: true });
}

function readTtyLine(promptText: string, options: { mask: boolean }): Promise<string> {
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
        if (!options.mask) process.stdout.write(char);
      }
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', onData);
  });
}
