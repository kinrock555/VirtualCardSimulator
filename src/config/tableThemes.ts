export type TableTheme = {
  id: string;
  name: string;
  /** CSS-ish hex color for the table/playmat surface (tints the procedural pattern below). */
  tableColor: string;
  /** Pattern style the 3D surface texture generator should draw for this theme. */
  surfacePattern: 'weave' | 'felt' | 'planks';
  /** Color of the 3D scene background / fog behind the table. */
  backgroundColor: string;
  /** Small inline SVG swatch shown in the theme picker - fully local, no external assets. */
  previewPath: string;
};

function swatchDataUri(tableColor: string, backgroundColor: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="64">` +
    `<rect width="96" height="64" fill="${backgroundColor}"/>` +
    `<rect x="8" y="18" width="80" height="38" rx="4" fill="${tableColor}"/>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const TABLE_THEMES: TableTheme[] = [
  {
    id: 'red-carpet',
    name: '赤いじゅうたん',
    tableColor: '#7c2431',
    surfacePattern: 'weave',
    backgroundColor: '#0e0708',
    previewPath: swatchDataUri('#7c2431', '#0e0708'),
  },
  {
    id: 'classic-green',
    name: 'クラシックグリーン',
    tableColor: '#3d7256',
    surfacePattern: 'felt',
    backgroundColor: '#05060a',
    previewPath: swatchDataUri('#3d7256', '#05060a'),
  },
  {
    id: 'dark-table',
    name: 'ダークテーブル',
    tableColor: '#3d4048',
    surfacePattern: 'planks',
    backgroundColor: '#020203',
    previewPath: swatchDataUri('#3d4048', '#020203'),
  },
  // ---- Lighter, more approachable colors added alongside the original 3 ----
  {
    id: 'ivory',
    name: 'アイボリー',
    tableColor: '#e8dcc4',
    surfacePattern: 'felt',
    backgroundColor: '#181510',
    previewPath: swatchDataUri('#e8dcc4', '#181510'),
  },
  {
    id: 'light-blue',
    name: 'ライトブルー',
    tableColor: '#a9c9e6',
    surfacePattern: 'weave',
    backgroundColor: '#0d141d',
    previewPath: swatchDataUri('#a9c9e6', '#0d141d'),
  },
  {
    id: 'mint-green',
    name: 'ミントグリーン',
    tableColor: '#a7ddc2',
    surfacePattern: 'felt',
    backgroundColor: '#0b1712',
    previewPath: swatchDataUri('#a7ddc2', '#0b1712'),
  },
  {
    id: 'light-pink',
    name: 'ライトピンク',
    tableColor: '#eec9d3',
    surfacePattern: 'weave',
    backgroundColor: '#191012',
    previewPath: swatchDataUri('#eec9d3', '#191012'),
  },
  {
    id: 'light-wood',
    name: 'ライトウッド',
    tableColor: '#d9b988',
    surfacePattern: 'planks',
    backgroundColor: '#171208',
    previewPath: swatchDataUri('#d9b988', '#171208'),
  },
];

export const DEFAULT_TABLE_THEME_ID = TABLE_THEMES[1].id; // classic-green matches the original look

export function getTableThemeById(themeId: string): TableTheme {
  return TABLE_THEMES.find((theme) => theme.id === themeId) ?? TABLE_THEMES[1];
}
