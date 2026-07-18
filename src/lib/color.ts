/** Darkens a `#rrggbb` hex color by `amount` (0-1) - used to derive the table frame/leg wood tone from a theme's felt color without adding new theme fields. */
export function darkenHex(hex: string, amount: number): string {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return hex;
  const value = parseInt(match[1], 16);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  const factor = Math.min(1, Math.max(0, 1 - amount));
  const toHex = (channel: number) => Math.round(channel * factor).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
