// Data and presets for mobile tool options
export interface PresetBrush {
  id: string;
  nameKey: string;
  size: number;
  pixels: boolean[][];
}

export const MOBILE_PRESET_BRUSHES: PresetBrush[] = [
  { 
    id: 'fine', 
    nameKey: 'toolbar.brushFine', 
    size: 1, 
    pixels: [[true]] 
  },
  { 
    id: 'square', 
    nameKey: 'toolbar.brushSquare', 
    size: 2, 
    pixels: [
      [true, true], 
      [true, true]
    ] 
  },
  { 
    id: 'round', 
    nameKey: 'toolbar.brushRound', 
    size: 3, 
    pixels: [
      [false, true, false], 
      [true, true, true], 
      [false, true, false]
    ] 
  },
  {
    id: 'diagonal',
    nameKey: 'toolbar.brushDiagonal',
    size: 2,
    pixels: [
      [true, false],
      [false, true]
    ]
  },
  { 
    id: 'star', 
    nameKey: 'toolbar.brushStar', 
    size: 5, 
    pixels: [
      [false, false, true, false, false],
      [false, false, true, false, false],
      [true, true, true, true, true],
      [false, false, true, false, false],
      [false, false, true, false, false]
    ] 
  }
];

export const MOBILE_SPRAY_SHAPES: {
  id: 'round' | 'square' | 'cross' | 'star';
  key: string;
  pixels: boolean[][];
}[] = [
  {
    id: 'round',
    key: 'toolbar.shapeRound',
    pixels: [
      [false, false, true, true, true, true, false, false],
      [false, true, true, true, true, true, true, false],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [false, true, true, true, true, true, true, false],
      [false, false, true, true, true, true, false, false],
    ]
  },
  {
    id: 'square',
    key: 'toolbar.shapeSquare',
    pixels: [
      [false, false, false, false, false, false, false, false],
      [false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false],
      [false, false, false, false, false, false, false, false],
    ]
  },
  {
    id: 'cross',
    key: 'toolbar.shapeCross',
    pixels: [
      [false, false, false, true, true, false, false, false],
      [false, false, false, true, true, false, false, false],
      [false, false, false, true, true, false, false, false],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [false, false, false, true, true, false, false, false],
      [false, false, false, true, true, false, false, false],
      [false, false, false, true, true, false, false, false],
    ]
  },
  {
    id: 'star',
    key: 'toolbar.shapeStar',
    pixels: [
      [false, false, false, true, true, false, false, false],
      [false, false, true, true, true, true, false, false],
      [false, true, true, true, true, true, true, false],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [false, true, true, true, true, true, true, false],
      [false, false, true, true, true, true, false, false],
      [false, false, false, true, true, false, false, false],
    ]
  }
];

export const MOBILE_DITHERING_PATTERNS: {
  id: 'checkerboard' | 'bayer' | '25%' | '50%' | '75%' | 'lines' | 'cross' | 'noise';
  key: string;
  pixels: boolean[][];
}[] = [
  {
    id: 'checkerboard',
    key: 'toolbar.ditheringCheckerboard',
    pixels: Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => (x + y) % 2 === 0)
    )
  },
  {
    id: 'bayer',
    key: 'toolbar.ditheringBayer',
    pixels: [
      [false, true, false, true, false, true, false, true],
      [true, false, true, false, true, false, true, false],
      [false, true, false, true, false, true, false, true],
      [true, false, true, false, true, false, true, false],
      [false, true, false, true, false, true, false, true],
      [true, false, true, false, true, false, true, false],
      [false, true, false, true, false, true, false, true],
      [true, false, true, false, true, false, true, false],
    ]
  },
  {
    id: '25%',
    key: 'toolbar.dithering25',
    pixels: Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => x % 2 === 0 && y % 2 === 0)
    )
  },
  {
    id: '50%',
    key: 'toolbar.dithering50',
    pixels: Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => (x + y) % 2 === 0)
    )
  },
  {
    id: '75%',
    key: 'toolbar.dithering75',
    pixels: Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => !(x % 2 === 0 && y % 2 === 0))
    )
  },
  {
    id: 'lines',
    key: 'toolbar.ditheringLines',
    pixels: Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, () => y % 2 === 0)
    )
  },
  {
    id: 'cross',
    key: 'toolbar.ditheringCross',
    pixels: Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => x % 2 === 0 || y % 2 === 0)
    )
  },
  {
    id: 'noise',
    key: 'toolbar.ditheringNoise',
    pixels: [
      [true, false, true, false, false, true, false, true],
      [false, true, false, false, true, false, true, false],
      [true, false, false, true, false, true, false, false],
      [false, false, true, false, true, false, false, true],
      [true, true, false, false, false, true, true, false],
      [false, false, true, true, false, false, false, true],
      [true, false, false, false, true, true, false, false],
      [false, true, true, false, false, false, true, true]
    ]
  }
];
