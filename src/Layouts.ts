type LayoutTypeWithIndices = 'hexV' | 'hexH' | 'square'
type LayoutTypeWithCoordinates = 'cartesian'
type LayoutType = LayoutTypeWithIndices | LayoutTypeWithCoordinates

// example from here:
//   https://stackoverflow.com/a/37688375
interface BossPropsBasics {
  bossName: string;
}
interface BossPropsWithIndices extends BossPropsBasics {
  x: never;
  y: never;
  i: number;
  j: number;
}
interface BossPropsWithCoordinates extends BossPropsBasics {
  x: number;
  y: number;
  i: never;
  j: never;
}
type BossProps = BossPropsWithIndices | BossPropsWithCoordinates

interface LayoutBasics {
  alias: string;
  scale?: number;
  gridUnitSize?: number;
}
interface LayoutWithIndices extends LayoutBasics {
  type: LayoutTypeWithIndices;
  bosses: Array<BossPropsWithIndices>;
}
interface LayoutWithCoordinates extends LayoutBasics {
  type: LayoutTypeWithCoordinates;
  bosses: Array<BossPropsWithCoordinates>;
}
type Layout = LayoutWithIndices | LayoutWithCoordinates
type Layouts = {
  [key: string]: Layout;
}

const getGridCoordinates = (
  // https://github.com/microsoft/TypeScript/issues/29526
  { layoutType, i, j, gridUnitSize }:
  { layoutType: LayoutTypeWithIndices, i: number, j: number, gridUnitSize: number }
): { x: number, y: number } => {
  let coordinates: { x: number, y: number } = { x: 0, y: 0 }
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

export { type BossProps, type LayoutType, type Layout, type Layouts, getGridCoordinates }
