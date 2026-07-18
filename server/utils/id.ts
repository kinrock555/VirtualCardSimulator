const ROOM_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I - avoids visual ambiguity

function randomBlock(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ROOM_ID_ALPHABET[Math.floor(Math.random() * ROOM_ID_ALPHABET.length)];
  }
  return out;
}

/** e.g. "A7K9-PQ2M" - random, not sequential, easy to read aloud/type. */
export function generateRoomId(): string {
  return `${randomBlock(4)}-${randomBlock(4)}`;
}

export function generateInstanceId(): string {
  return `inst-${randomToken()}`;
}

export function generateStackId(): string {
  return `stack-${randomToken()}`;
}

function randomToken(): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}
