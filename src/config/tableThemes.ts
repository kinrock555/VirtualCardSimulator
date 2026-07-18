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
    tableColor: '#5c1420',
    surfacePattern: 'weave',
    backgroundColor: '#0e0708',
    previewPath: swatchDataUri('#5c1420', '#0e0708'),
  },
  {
    id: 'classic-green',
    name: 'クラシックグリーン',
    tableColor: '#2f5a44',
    surfacePattern: 'felt',
    backgroundColor: '#05060a',
    previewPath: swatchDataUri('#2f5a44', '#05060a'),
  },
  {
    id: 'dark-table',
    name: 'ダークテーブル',
    tableColor: '#24262b',
    surfacePattern: 'planks',
    backgroundColor: '#020203',
    previewPath: swatchDataUri('#24262b', '#020203'),
  },
];

export const DEFAULT_TABLE_THEME_ID = TABLE_THEMES[1].id; // classic-green matches the original look

export function getTableThemeById(themeId: string): TableTheme {
  return TABLE_THEMES.find((theme) => theme.id === themeId) ?? TABLE_THEMES[1];
}
