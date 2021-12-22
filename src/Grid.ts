import { BossName } from './Bosses'

type GridType = 'hexV' | 'hexH' | 'square' | 'linearH' | 'linearV' | 'liveSplit1'
type Coordinates = {
  x: number;
  y: number;
}

const getGridCoordinates = (
  // https://github.com/microsoft/TypeScript/issues/29526
  { gridType, i, j, gridUnitSize }:
  { gridType: GridType, i: number, j: number, gridUnitSize: number }
): Coordinates => {
  let coordinates: Coordinates = { x: 0, y: 0 }
  switch (gridType) {
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
    case 'linearH':
    case 'linearV':
    case 'liveSplit1':
      coordinates.x = 0 + i * gridUnitSize
      coordinates.y = 0 + j * gridUnitSize
      break

    default:
      break
  }

  return coordinates
}

type GridNode = {
  bossName: BossName;
  i: number;
  j: number;
}
type Grids = {
  [key in GridType]: Array<GridNode>;
}

// REVIEW: grids could be loaded from json, so users can change them,
//   but we'll lost ts features then. Also it wouldn't be plain web app after that.
//   Should I invest some time in implementing icons dragging?
//   Also there appears a state managing issue if we're making the grid variable.
const grids: Grids = {
  'hexV': [
    // column 0
    {
      bossName: 'destroyer',
      i: 0, j: 0,
    }, {
      bossName: 'twins',
      i: 0, j: 1,
    }, {
      bossName: 'prime',
      i: 0, j: 2,
    }, {
      bossName: 'golem',
      i: 0, j: 3,
    }, {
      bossName: 'ml',
      i: 0, j: 4,
    },

    // column 1
    {
      bossName: 'skeletron',
      i: 1, j: 0,
    }, {
      bossName: 'wof',
      i: 1, j: 1,
    }, {
      bossName: 'plantera',
      i: 1, j: 2,
    }, {
      bossName: 'cultist',
      i: 1, j: 3,
    },

    // column 2
    {
      bossName: 'dc',
      i: 2, j: 0,
    }, {
      bossName: 'eoc',
      i: 2, j: 1,
    }, {
      bossName: 'qb',
      i: 2, j: 2,
    }, {
      bossName: 'fishron',
      i: 2, j: 3,
    },

    // column 3
    {
      bossName: 'evil',
      i: 3, j: 0,
    }, {
      bossName: 'ks',
      i: 3, j: 1,
    }, {
      bossName: 'qs',
      i: 3, j: 2,
    }, {
      bossName: 'eol',
      i: 3, j: 3,
    },
  ],

  'hexH': [
    // row 0
    {
      bossName: 'dc',
      i: 1, j: 0,
    }, {
      bossName: 'ks',
      i: 2, j: 0,
    }, {
      bossName: 'qs',
      i: 3, j: 0,
    },
    {
     bossName: 'eol',
     i: 4, j: 0,
   },

    // row 1
    {
      bossName: 'evil',
      i: 0, j: 1,
    }, {
      bossName: 'eoc',
      i: 1, j: 1,
    }, {
      bossName: 'qb',
      i: 2, j: 1,
    },
    {
     bossName: 'fishron',
     i: 3, j: 1,
   },

    // row 2
    {
      bossName: 'skeletron',
      i: 1, j: 2,
    }, {
      bossName: 'wof',
      i: 2, j: 2,
    }, {
      bossName: 'plantera',
      i: 3, j: 2,
    }, {
      bossName: 'cultist',
      i: 4, j: 2,
    },

    // row 3
    {
      bossName: 'destroyer',
      i: 0, j: 3,
    },
    {
      bossName: 'twins',
      i: 1, j: 3,
    }, {
      bossName: 'prime',
      i: 2, j: 3,
    }, {
      bossName: 'golem',
      i: 3, j: 3,
    }, {
      bossName: 'ml',
      i: 4, j: 3,
    },
  ],

  'square': [
    // row 0
    {
      bossName: 'evil',
      i: 2, j: 0,
    }, {
      bossName: 'dc',
      i: 3, j: 0,
    }, {
      bossName: 'qb',
      i: 4, j: 0,
    },

    // row 1
    {
      bossName: 'wof',
      i: 1, j: 1,
    }, {
      bossName: 'skeletron',
      i: 2, j: 1,
    }, {
      bossName: 'eoc',
      i: 3, j: 1,
    }, {
     bossName: 'ks',
     i: 4, j: 1,
   },

    // row 2
    {
      bossName: 'destroyer',
      i: 0, j: 2,
    }, {
      bossName: 'twins',
      i: 1, j: 2,
    }, {
      bossName: 'prime',
      i: 2, j: 2,
    }, {
      bossName: 'fishron',
      i: 3, j: 2,
    }, {
      bossName: 'qs',
      i: 4, j: 2,
    },

    // row 3
    {
      bossName: 'plantera',
      i: 0, j: 3,
    }, {
      bossName: 'golem',
      i: 1, j: 3,
    }, {
      bossName: 'cultist',
      i: 2, j: 3,
    }, {
      bossName: 'ml',
      i: 3, j: 3,
    }, {
      bossName: 'eol',
      i: 4, j: 3,
    },
  ],

  // REVIEW
  'linearV': [
    {
      bossName: 'ks',
      i: 0, j: 0,
    }, {
      bossName: 'eoc',
      i: 0, j: 1,
    }, {
      bossName: 'evil',
      i: 0, j: 2,
    }, {
      bossName: 'qb',
      i: 0, j: 3,
    }, {
      bossName: 'dc',
      i: 0, j: 4,
    }, {
      bossName: 'skeletron',
      i: 0, j: 5,
    }, {
      bossName: 'wof',
      i: 0, j: 6,
    }, {
      bossName: 'destroyer',
      i: 0, j: 7,
    }, {
      bossName: 'twins',
      i: 0, j: 8,
    }, {
      bossName: 'prime',
      i: 0, j: 9,
    }, {
      bossName: 'plantera',
      i: 0, j: 10,
    }, {
      bossName: 'golem',
      i: 0, j: 11,
    }, {
      bossName: 'cultist',
      i: 0, j: 12,
    }, {
      bossName: 'ml',
      i: 0, j: 13,
    }, {
      bossName: 'qs',
      i: 0, j: 14,
    }, {
      bossName: 'fishron',
      i: 0, j: 15,
    }, {
      bossName: 'eol',
      i: 0, j: 16,
    },
  ],

  'linearH': [
    {
      bossName: 'ks',
      i: 0, j: 0,
    }, {
      bossName: 'eoc',
      i: 1, j: 0,
    }, {
      bossName: 'evil',
      i: 2, j: 0,
    }, {
      bossName: 'qb',
      i: 3, j: 0,
    }, {
      bossName: 'dc',
      i: 4, j: 0,
    }, {
      bossName: 'skeletron',
      i: 5, j: 0,
    }, {
      bossName: 'wof',
      i: 6, j: 0,
    }, {
      bossName: 'destroyer',
      i: 7, j: 0,
    }, {
      bossName: 'twins',
      i: 8, j: 0,
    }, {
      bossName: 'prime',
      i: 9, j: 0,
    }, {
      bossName: 'plantera',
      i: 10, j: 0,
    }, {
      bossName: 'golem',
      i: 11, j: 0,
    }, {
      bossName: 'cultist',
      i: 12, j: 0,
    }, {
      bossName: 'ml',
      i: 13, j: 0,
    }, {
      bossName: 'qs',
      i: 14, j: 0,
    }, {
      bossName: 'fishron',
      i: 15, j: 0,
    }, {
      bossName: 'eol',
      i: 16, j: 0,
    },
  ],

  'liveSplit1': [
    {
      bossName: 'skeletron',
      i: 0, j: 5,
    },{
      bossName: 'wof',
      i: 0, j: 6,
    }, {
      bossName: 'destroyer',
      i: 0, j: 7,
    }, {
      bossName: 'twins',
      i: 0, j: 8,
    }, {
      bossName: 'prime',
      i: 1, j: 8,
    }, {
      bossName: 'plantera',
      i: 0, j: 9,
    }, {
      bossName: 'golem',
      i: 0, j: 10,
    }, {
      bossName: 'cultist',
      i: 0, j: 11,
    }, {
      bossName: 'ml',
      i: 0, j: 12,
    }, {
      bossName: 'ks',
      i: 0, j: 13,
    }, {
      bossName: 'eoc',
      i: 1, j: 13,
    }, {
      bossName: 'evil',
      i: 2, j: 13,
    }, {
      bossName: 'qb',
      i: 3, j: 13,
    }, {
      bossName: 'dc',
      i: 4, j: 13,
    }, {
      bossName: 'qs',
      i: 5, j: 13,
    }, {
      bossName: 'fishron',
      i: 6, j: 13,
    }, {
      bossName: 'eol',
      i: 7, j: 13,
    },
  ],
}

export { grids, type GridType, getGridCoordinates }
