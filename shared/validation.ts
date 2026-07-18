// Pure, dependency-free validators shared by the client (best-effort UX
// checks) and the server (the authoritative gatekeeper - nothing here is
// trusted just because the client already checked it).
import { MAX_DRAW_COUNT, PLAYER_NAME_MAX_LENGTH } from './onlineTypes';
import type { CardZone } from './cardTypes';

const CARD_ZONES: readonly CardZone[] = ['deck', 'hand', 'table', 'graveyard', 'banished'];

const ROOM_ID_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function isNonEmptyString(value: unknown, maxLength = 200): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

/** Strips characters that would let a name break out of plain-text rendering, defense in depth. */
export function sanitizePlainText(value: string): string {
  return value.replace(/[<>&"'`]/g, '').trim();
}

export function isValidPlayerName(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= PLAYER_NAME_MAX_LENGTH;
}

export function normalizePlayerName(value: string): string {
  return sanitizePlainText(value).slice(0, PLAYER_NAME_MAX_LENGTH);
}

export function isValidRoomId(value: unknown): value is string {
  return typeof value === 'string' && ROOM_ID_PATTERN.test(value);
}

export function isValidPlayerId(value: unknown): value is string {
  return isNonEmptyString(value, 100);
}

export function isValidInstanceId(value: unknown): value is string {
  return isNonEmptyString(value, 100);
}

export function isValidStackId(value: unknown): value is string {
  return isNonEmptyString(value, 100);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isValidCoordinate(value: unknown): value is number {
  return isFiniteNumber(value) && Math.abs(value) < 1000;
}

export function isValidRotationDirection(value: unknown): value is 'left' | 'right' {
  return value === 'left' || value === 'right';
}

export function isValidZone(value: unknown): value is CardZone {
  return typeof value === 'string' && (CARD_ZONES as readonly string[]).includes(value);
}

export function isValidDrawCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_DRAW_COUNT;
}

export function isValidInstanceIdArray(value: unknown, maxLength = 500): value is string[] {
  return Array.isArray(value) && value.length <= maxLength && value.every((id) => isValidInstanceId(id));
}

export function isValidThemeId(value: unknown): value is string {
  return isNonEmptyString(value, 64);
}
