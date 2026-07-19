export type TableTypeId = 'standard' | 'round' | 'casino';

export type TableTypeDef = {
  id: TableTypeId;
  name: string;
  description: string;
  /** Small inline SVG swatch shown in the type picker - fully local, no external assets. */
  previewPath: string;
};

function shapeSwatchDataUri(shape: TableTypeId): string {
  const shapeMarkup =
    shape === 'round'
      ? `<circle cx="48" cy="32" r="19" fill="#5b8cff"/>`
      : shape === 'casino'
        ? `<rect x="6" y="14" width="84" height="36" rx="18" fill="#5b8cff"/>`
        : `<rect x="8" y="18" width="80" height="28" rx="4" fill="#5b8cff"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="64"><rect width="96" height="64" fill="#14161c"/>${shapeMarkup}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const TABLE_TYPES: TableTypeDef[] = [
  {
    id: 'standard',
    name: '標準テーブル',
    description: 'これまでどおりの長方形の天板です。',
    previewPath: shapeSwatchDataUri('standard'),
  },
  {
    id: 'round',
    name: '丸テーブル',
    description: '円形の天板を持つテーブルです。中央の1本脚で支えられています。',
    previewPath: shapeSwatchDataUri('round'),
  },
  {
    id: 'casino',
    name: 'カジノテーブル',
    description: '角を大きく丸めた、カジノ風の縁取りを持つテーブルです。天板中央は標準テーブルと同じ広さの平らな範囲です。',
    previewPath: shapeSwatchDataUri('casino'),
  },
];

export const DEFAULT_TABLE_TYPE_ID: TableTypeId = 'standard';

export function getTableTypeById(id: string | null | undefined): TableTypeDef {
  return TABLE_TYPES.find((type) => type.id === id) ?? TABLE_TYPES[0];
}
