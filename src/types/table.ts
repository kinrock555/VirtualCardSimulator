export type CardRotation = 0 | 90 | 180 | 270;

export type CardInstance = {
  instanceId: string;
  cardId: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotationY: CardRotation;
  faceUp: boolean;
};
