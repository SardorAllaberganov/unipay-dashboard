// Short, copy-paste friendly ids for error reporting. Format: `8a7c-2f1e`.
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

function block(): string {
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function generateReferenceId(): string {
  return `${block()}-${block()}`;
}
