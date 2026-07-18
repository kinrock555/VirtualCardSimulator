import type { CardMaster } from '../types/card';
import { stableHash } from './id';

// Eagerly resolved at build time. If the folder is empty this is just `{}` -
// the app must keep working with zero cards registered.
const cardImageModules = import.meta.glob('/src/assets/cards/*.{png,jpg,jpeg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const cardBackModules = import.meta.glob('/src/assets/card-back.{png,jpg,jpeg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

// Used only if src/assets/card-back.png is missing, so the table screen can
// still render a back face instead of crashing on a missing asset.
const FALLBACK_CARD_BACK_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="375" height="525">' +
      '<rect width="100%" height="100%" fill="#26314a"/>' +
      '<rect x="20" y="20" width="335" height="485" fill="none" stroke="#8fa3c4" stroke-width="4"/>' +
      '</svg>',
  );

export function getCardBackUrl(): string {
  const urls = Object.values(cardBackModules);
  return urls[0] ?? FALLBACK_CARD_BACK_URL;
}

function fileNameFromPath(modulePath: string): string {
  const segments = modulePath.split('/');
  return segments[segments.length - 1];
}

function nameFromFileName(fileName: string): string {
  return fileName.replace(/\.(png|jpe?g)$/i, '');
}

/** Reads every supported image under src/assets/cards and builds the initial card master list. */
export function loadCardMastersFromAssets(): CardMaster[] {
  const modulePaths = Object.keys(cardImageModules).sort();
  return modulePaths.map((modulePath) => {
    const fileName = fileNameFromPath(modulePath);
    return {
      id: `card-${stableHash(modulePath)}`,
      name: nameFromFileName(fileName),
      imagePath: cardImageModules[modulePath],
    };
  });
}
