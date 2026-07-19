export type RoomEnvironmentId = 'plain' | 'home' | 'casino' | 'card-shop';

export type RoomEnvironment = {
  id: RoomEnvironmentId;
  name: string;
  description: string;
  previewPath: string;
  floorColor: string;
  wallColor: string;
  backgroundColor: string;
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  /** Tints the main directional light's color temperature per theme (e.g. warm for Home, neutral-white for Card Shop). Defaults to plain white if omitted. */
  directionalLightColor: string;
};

function roomSwatchDataUri(floorColor: string, wallColor: string, backgroundColor: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="64">` +
    `<rect width="96" height="64" fill="${backgroundColor}"/>` +
    `<rect x="0" y="0" width="96" height="34" fill="${wallColor}"/>` +
    `<rect x="0" y="34" width="96" height="30" fill="${floorColor}"/>` +
    `<rect x="24" y="40" width="48" height="16" rx="2" fill="rgba(0,0,0,0.25)"/>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const ROOM_ENVIRONMENTS: RoomEnvironment[] = [
  {
    id: 'plain',
    name: '無地',
    description: 'シンプルなスタジオ背景。装飾を抑え、カードとテーブルを最も見やすくします。',
    previewPath: roomSwatchDataUri('#3a3f4a', '#23262e', '#1a1c22'),
    floorColor: '#3a3f4a',
    wallColor: '#23262e',
    backgroundColor: '#1a1c22',
    ambientLightIntensity: 0.9,
    directionalLightIntensity: 1.3,
    directionalLightColor: '#ffffff',
  },
  {
    id: 'home',
    name: 'おうち',
    description: '木目の床と窓のある、暖かく落ち着いたリビング風の部屋です。',
    previewPath: roomSwatchDataUri('#8a5a34', '#d8c7a1', '#4a3d2c'),
    floorColor: '#8a5a34',
    wallColor: '#d8c7a1',
    backgroundColor: '#4a3d2c',
    ambientLightIntensity: 1.0,
    directionalLightIntensity: 1.25,
    directionalLightColor: '#ffe9cf', // slightly warm, lamp-like
  },
  {
    id: 'casino',
    name: 'カジノ',
    description: '深い赤のカーペットと間接照明が特徴の、架空のカードルームです。',
    previewPath: roomSwatchDataUri('#5c1420', '#2a1f18', '#100a08'),
    floorColor: '#5c1420',
    wallColor: '#2a1f18',
    backgroundColor: '#100a08',
    ambientLightIntensity: 0.75,
    directionalLightIntensity: 1.15,
    directionalLightColor: '#fff2df', // dim overall, but a warm spotlight-like tint keeps the table readable
  },
  {
    id: 'card-shop',
    name: 'カードショップ',
    description: 'カード棚が並ぶ、明るいカードショップの対戦スペースです。',
    previewPath: roomSwatchDataUri('#c9c9c0', '#eeeee6', '#7a7d85'),
    floorColor: '#c9c9c0',
    wallColor: '#eeeee6',
    backgroundColor: '#7a7d85',
    ambientLightIntensity: 1.15,
    directionalLightIntensity: 1.4,
    directionalLightColor: '#f5f8ff', // neutral-white, bright storefront lighting
  },
];

export const DEFAULT_ROOM_ENVIRONMENT_ID: RoomEnvironmentId = 'plain';

export function getRoomEnvironmentById(id: string | null | undefined): RoomEnvironment {
  return ROOM_ENVIRONMENTS.find((env) => env.id === id) ?? ROOM_ENVIRONMENTS[0];
}
