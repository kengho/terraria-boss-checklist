import { BossName } from './Bosses'

type LayoutType = 'hexV' | 'hexH' | 'square'
type BossProps = {
  bossName: BossName;
  i: number;
  j: number;
}
type Layout = {
  alias: string;
  type: LayoutType;
  scale?: number;
  gridUnitSize?: number;
  bosses: Array<BossProps>;
}
type Layouts = {
  [key: string]: Layout;
}

type Coordinates = {
  x: number;
  y: number;
}

const getGridCoordinates = (
  // https://github.com/microsoft/TypeScript/issues/29526
  { layoutType, i, j, gridUnitSize }:
  { layoutType: LayoutType, i: number, j: number, gridUnitSize: number }
): Coordinates => {
  let coordinates: Coordinates = { x: 0, y: 0 }
  switch (layoutType) {
    // hexV grid indices:
    // y\x    0   1   2
    //
    //  0    0,0     2,0     ...
    //           1,0     ...
    //  1    0,1     2,1     ...
    //           1,1     ...
    //  2    0,2     2,2     ...
    //           1,2     ...
    //  3    0,3     2,3     ...
    //           1,3     ...
    //       ...     ...     ...
    case 'hexV':
      coordinates.x = 0 + i * gridUnitSize * Math.sin(Math.PI / 3)
      coordinates.y = 0 + j * gridUnitSize
      if (i % 2 === 1) {
        coordinates.y += gridUnitSize / 2
      }
      break

    // hexH grid indices:
    // y\x   0     1     2     3
    //
    //  0   0,0   1,0   2,0   3,0    ...
    //  1      0,1   1,1   2,1   3,1   ...
    //  2   0,2   1,2   2,2   3,2    ...
    //  3      0,3   1,3   2,3   3,3   ...
    //      ...   ...   ...   ...   ...
    case 'hexH':
      coordinates.x = 0 + i * gridUnitSize
      coordinates.y = 0 + j * gridUnitSize * Math.sin(Math.PI / 3)
      if (j % 2 === 1) {
        coordinates.x += gridUnitSize / 2
      }
      break

    case 'square':
      coordinates.x = 0 + i * gridUnitSize
      coordinates.y = 0 + j * gridUnitSize
      break

    default:
      break
  }

  return coordinates
}

export { type BossProps, type Layout, type Layouts, getGridCoordinates }
