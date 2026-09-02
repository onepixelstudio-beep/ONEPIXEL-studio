import { StampResource } from '../../types';

export interface AssetMetadata {
  id: string;
  version: number;
  type: 'stamp' | 'pattern' | 'brush' | string;
  name: string;
  description: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  width: number;
  height: number;
  pivot: {
    x: number;
    y: number;
  };
  preview?: string;
  author?: string;
  origin: {
    x: number;
    y: number;
  };
  metadata?: Record<string, unknown>;
}

export type StampMetadata = AssetMetadata;

export class LibraryService {
  private static readonly INDEX_KEY = 'onepixel_stamps_index';
  private static readonly DATA_PREFIX = 'onepixel_stamp_data_';

  /**
   * Performs schema migration for an asset if needed.
   * Currently acts as a robust migration layer / identity function for version 1 schema.
   */
  static migrateAsset(asset: any): StampResource {
    if (!asset) return asset;
    
    // Check if the old "pixels" field exists at the root, and migrate it to data.pixels
    let data = asset.data;
    if (!data) {
      if (asset.pixels) {
        data = { pixels: asset.pixels };
      } else {
        data = { pixels: [] };
      }
    } else if (Array.isArray(data)) {
      // If data was stored directly as an array of pixels previously
      data = { pixels: data };
    }

    return {
      id: asset.id || '',
      version: asset.version || 1,
      type: asset.type || 'stamp',
      name: asset.name || 'Sello sin nombre',
      description: asset.description || '',
      tags: asset.tags || [],
      createdAt: asset.createdAt || Date.now(),
      updatedAt: asset.updatedAt || Date.now(),
      width: asset.width || 0,
      height: asset.height || 0,
      pivot: asset.pivot || asset.origin || { x: 0, y: 0 },
      preview: asset.preview || '',
      author: asset.author || 'user',
      origin: asset.origin || { x: 0, y: 0 },
      metadata: asset.metadata || {},
      data: data
    };
  }

  /**
   * Retrieves the index (list of metadata) of all saved stamps.
   * This is lightweight and avoids loading heavy pixel data into memory on start.
   */
  static getStampsIndex(): StampMetadata[] {
    try {
      let data = localStorage.getItem(this.INDEX_KEY);
      let needsReset = false;
      if (data) {
        try {
          const list = JSON.parse(data);
          const presetCount = Array.isArray(list) ? list.filter((item: any) => item.id && item.id.startsWith('preset-asset-')).length : 0;
          const hasTexture = Array.isArray(list) ? list.some((item: any) => item.type === 'texture') : false;
          const swordPreset = Array.isArray(list) ? list.find((item: any) => item.id === 'preset-asset-stamp-sword') : null;
          
          const icePresetData = localStorage.getItem('onepixel_stamp_data_preset-asset-tile-ice');
          let isIceCorrect = false;
          if (icePresetData) {
            try {
              const parsedIce = JSON.parse(icePresetData);
              if (parsedIce && Array.isArray(parsedIce.pixels) && parsedIce.pixels.length === 256) {
                isIceCorrect = true;
              }
            } catch (e) {}
          }

          if (presetCount < 50 || hasTexture || !swordPreset || swordPreset.width < 16 || !isIceCorrect) {
            needsReset = true;
          }
        } catch (e) {
          needsReset = true;
        }
      }
      if (!data || needsReset) {
        this.initializeDefaultStamps();
        data = localStorage.getItem(this.INDEX_KEY);
      }
      const list = data ? JSON.parse(data) : [];
      return list.map((item: any) => {
        return {
          id: item.id || '',
          version: item.version || 1,
          type: item.type || 'stamp',
          name: item.name || '',
          description: item.description || '',
          tags: item.tags || [],
          createdAt: item.createdAt || Date.now(),
          updatedAt: item.updatedAt || Date.now(),
          width: item.width || 0,
          height: item.height || 0,
          pivot: item.pivot || item.origin || { x: 0, y: 0 },
          preview: item.preview || '',
          author: item.author || 'user',
          origin: item.origin || { x: 0, y: 0 },
          metadata: item.metadata || {}
        };
      });
    } catch (e) {
      console.error('Failed to parse stamps index', e);
      return [];
    }
  }

  /**
   * Initializes the library with 50 diverse, high-quality, professional assets.
   * Exactly 10 assets for each of the 5 authorized categories: stamps, patterns, brushes, tiles, selections.
   */
  static initializeDefaultStamps(): void {
    interface PresetConfig {
      id: string;
      type: string;
      name: string;
      description: string;
      tags: string[];
      width: number;
      height: number;
      lines: string[];
    }

    const colorMap: Record<string, string> = {
      'r': '#ef4444', // Red
      'y': '#fbbf24', // Gold
      'b': '#3b82f6', // Blue
      'w': '#ffffff', // White
      'g': '#94a3b8', // Gray
      'd': '#475569', // Dark Gray
      'o': '#b45309', // Brown
      'k': '#000000', // Black
      'c': '#38bdf8', // Cyan
      'e': '#e2e8f0', // Light Gray
      'p': '#ec4899', // Pink
      'v': '#C8A96A', // Gold
      'n': '#10b981', // Green
      '.': ''         // Transparent
    };

    const parseSprite = (lines: string[], w: number, h: number): string[] => {
      const pixels: string[] = [];
      for (let y = 0; y < h; y++) {
        const line = lines[y] || "";
        for (let x = 0; x < w; x++) {
          const char = line[x] || ".";
          pixels.push(colorMap[char] || "");
        }
      }
      return pixels;
    };

    const configs: PresetConfig[] = [
      // 1. Sellos (Stamps) - 10 items
      {
        id: 'preset-asset-stamp-sword',
        type: 'stamp',
        name: 'Espada de Hielo 16x16',
        description: 'Una espada legendaria de cristal azul tallada en píxeles.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "...............w",
          "..............ew",
          ".............eew",
          "............eew.",
          "...........eew..",
          "..........eew...",
          ".........eew....",
          "........eew.....",
          ".......eew......",
          "......eew.......",
          ".....eew........",
          "....ygy.........",
          "...ydy..........",
          "..yry...........",
          ".y.y............",
          "y..............."
        ]
      },
      {
        id: 'preset-asset-stamp-chest',
        type: 'stamp',
        name: 'Cofre del Rey 16x16',
        description: 'Un cofre real repleto de tesoros con molduras de oro.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "................",
          "...kkkkkkkkkk...",
          "..kyyyyyyyyoyk..",
          ".kyyyyyyyyyoyyk.",
          "kyoooyyoyyoooyyk",
          "kyooooyoyoooooyk",
          "kyooooooooooooyk",
          "kkkkkkkkkkkkkkkk",
          "kyyyyyyyyyyyyyyk",
          "kydddkkkkkddddyk",
          "kydddkkykkddddyk",
          "kydddkkkkkddddyk",
          "kyddddddddddddyk",
          "kyddddddddddddyk",
          ".kyyyyyyyyyyyyk.",
          "..kkkkkkkkkkkk.."
        ]
      },
      {
        id: 'preset-asset-stamp-heart',
        type: 'stamp',
        name: 'Corazón de Cristal 16x16',
        description: 'Un gran corazón de salud roja brillante con destellos.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "................",
          "....kkk....kkk..",
          "..kkrrkk..kkrrkk",
          ".krrrrrrkkrrrrrk",
          "krrrrrrrrrrrrrrk",
          "krrwwwrrrrrrrrrk",
          "krrwwwrrrrrrrrrk",
          "krrrrrrrrrrrrrrk",
          ".krrrrrrrrrrrrk.",
          "..krrrrrrrrrrk..",
          "...krrrrrrrrk...",
          "....krrrrrrk....",
          ".....krrrrk.....",
          "......krrk......",
          ".......kk.......",
          "................"
        ]
      },
      {
        id: 'preset-asset-stamp-potion',
        type: 'stamp',
        name: 'Elixir de Alquimista 16x16',
        description: 'Poción de maná concentrado de un azul vibrante.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "................",
          "......kkkk......",
          "......keek......",
          "......keek......",
          ".....kkwwkk.....",
          "....kewwwwek....",
          "....keeeeeek....",
          "...kbbbbbbbbk...",
          "..kbbwbbbbbbbk..",
          ".kbbwwbbbbbbbbk.",
          ".kbbbbbbbbbbbbk.",
          ".kbbbbbbbbbbbbk.",
          ".kbbbbbbbbbbbbk.",
          "..kbbbbbbbbbbk..",
          "...kkkkkkkkkk...",
          "................"
        ]
      },
      {
        id: 'preset-asset-stamp-shield',
        type: 'stamp',
        name: 'Escudo de Dragón 16x16',
        description: 'Escudo real decorado con un blasón heráldico de fuego.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "................",
          ".kkkkkkkkkkkkkk.",
          "kgggggggggggggdk",
          "kgbbbbbyybbbbbdk",
          "kgbbbbbyybbbbbdk",
          "kgbbbbryyrbbbbdk",
          "kgbbbrryyrrbbbdk",
          "kgbbrrryyrrrbbdk",
          "kgbbrrryyrrrbbdk",
          ".kgbbrryyrrbbdk.",
          ".kgbbryyyrbbbdk.",
          "..kgbbyyybbbdk..",
          "..kgbbyyybbbdk..",
          "...kgbyyybbdk...",
          "....kgyyybdk....",
          ".....kkkkkk....."
        ]
      },
      {
        id: 'preset-asset-stamp-helmet',
        type: 'stamp',
        name: 'Casco de Caballero 16x16',
        description: 'Un casco medieval completo con pluma de combate roja.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "......rrrrr.....",
          ".....ryyyyy.....",
          "....ryykkkkk....",
          "....ykkgeeeegk..",
          "...kgeeeeeeeegk.",
          "..kgeeedggeeeegk",
          ".kgeeeeedgeeeeeg",
          "kgeeeeeeeeedeeeg",
          "kgeeeeedddddeeeg",
          "kgddkkkkkkkkkddg",
          "kgdekeeeeeeekedg",
          ".kgeeeeeeeeegdk.",
          "..kgeeeeeeeegdk.",
          "...kgeeeeeegdk..",
          "....kkkkkkkkdk..",
          "......kkkkk....."
        ]
      },
      {
        id: 'preset-asset-stamp-coin',
        type: 'stamp',
        name: 'Moneda de la Suerte 16x16',
        description: 'Gran moneda de oro reluciente grabada con una estrella.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "................",
          ".....kkkkkk.....",
          "...kkyyyyyykk...",
          "..kyyyyyyyyyyyk.",
          ".kyyyyyyyyyyyyyk",
          "kyyyyywyyyyyyyok",
          "kyyyywwyyyyyyyok",
          "kyyyywwyyyyyyyok",
          "kyyyyyyyyyyyyyok",
          "kyyyyyyyyyyyyyok",
          "kyyyyyyyyyyyyyok",
          ".kyyyyyyyyyyyok.",
          "..kyyyyyyyyyok..",
          "...koyyyyyyook..",
          ".....kkkkkk.....",
          "................"
        ]
      },
      {
        id: 'preset-asset-stamp-key',
        type: 'stamp',
        name: 'Llave de Oro Grande 16x16',
        description: 'Una llave de oro pesada con empuñadura decorada.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "................",
          "....kkkkkk......",
          "..kkyyyyyykk....",
          ".kyyyyyyyyyyk...",
          ".kyykkkkkkyyk...",
          "kyyk.....kyyk...",
          "kyyk.....kyyk...",
          ".kyykkkkkkyyk...",
          "..kkyyyyyykk....",
          "....kyyyyk......",
          "....kyyyyk......",
          "....kyyyyk.kk...",
          "....kyyyykkk....",
          "....kyyyyk.kk...",
          "....kyyyykkk....",
          "....kkkkkk......"
        ]
      },
      {
        id: 'preset-asset-stamp-skull',
        type: 'stamp',
        name: 'Calavera Legendaria 16x16',
        description: 'Calavera misteriosa de un guerrero del pasado.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "................",
          ".....kkkkkk.....",
          "...kkeeeeeekk...",
          "..keeweeeeewekk.",
          ".keeweeeeewewekk",
          "keewkkeeewkkewek",
          "keewkkeeewkkewek",
          "keeeeeeeeeeeeeek",
          "keeeekkkkkkeeeek",
          "keeeekkkkkkeeeek",
          ".keeeeeeeeeeeek.",
          "..keeggggggeek..",
          "...kegkkkkgk....",
          "...kegkkkkgk....",
          "....kkkkkkkk....",
          "................"
        ]
      },
      {
        id: 'preset-asset-stamp-crown',
        type: 'stamp',
        name: 'Corona Imperial 16x16',
        description: 'Símbolo supremo de poder decorado con gemas finas.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "................",
          "......y..y......",
          ".....yryyry.....",
          "....yrryyrry....",
          "...yrryyyrryy...",
          "..yyyyyyyyyyyy..",
          "..ybyybyybyyby..",
          "..yyyyyyyyyyyy..",
          "..yrryyyrryyrr..",
          "..yyyyyyyyyyyy..",
          "..yccccccccccy..",
          "..yyyyyyyyyyyy..",
          "..yppppppppppy..",
          "..yyyyyyyyyyyy..",
          "...oooooooooo...",
          "................"
        ]
      },

      // 2. Patrones (Patterns) - 10 items
      {
        id: 'preset-asset-pattern-chess',
        type: 'pattern',
        name: 'Ajedrez Mini 8x8',
        description: 'Patrón de tablero de ajedrez alterno.',
        tags: [],
        width: 8,
        height: 8,
        lines: [
          "eeddeedd",
          "eeddeedd",
          "ddeeddee",
          "ddeeddee",
          "eeddeedd",
          "eeddeedd",
          "ddeeddee",
          "ddeeddee"
        ]
      },
      {
        id: 'preset-asset-pattern-brick',
        type: 'pattern',
        name: 'Ladrillo Escenario 16x16',
        description: 'Patrón repetible con relieve tridimensional de ladrillos.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "ddddddddgddddddd",
          "drrrrrrkgdrrrrrd",
          "drrrrrrkgdrrrrrd",
          "gkkkkkkkggkkkkkk",
          "ddddgddddddddgdd",
          "drrkgdrrrrrrkgdr",
          "drrkgdrrrrrrkgdr",
          "gkkggkkkkkkkkggk",
          "ddddddddgddddddd",
          "drrrrrrkgdrrrrrd",
          "drrrrrrkgdrrrrrd",
          "gkkkkkkkggkkkkkk",
          "ddddgddddddddgdd",
          "drrkgdrrrrrrkgdr",
          "drrkgdrrrrrrkgdr",
          "gkkggkkkkkkkkggk"
        ]
      },
      {
        id: 'preset-asset-pattern-diagonal',
        type: 'pattern',
        name: 'Rayas Diagonales 8x8',
        description: 'Patrón diagonal continuo de líneas azules.',
        tags: [],
        width: 8,
        height: 8,
        lines: [
          "b...b...",
          ".b...b..",
          "..b...b.",
          "...b...b",
          "b...b...",
          ".b...b..",
          "..b...b.",
          "...b...b"
        ]
      },
      {
        id: 'preset-asset-pattern-waves',
        type: 'pattern',
        name: 'Ondas de Agua 16x16',
        description: 'Ondas fluidas y continuas de agua de mar.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "................",
          "......cccc......",
          "....ccbbbbcc....",
          "...cbbbbbbbbc...",
          "................",
          "................",
          "..cccc....cccc..",
          "ccbbbbccccbbbbcc",
          "bbbbbbbbbbbbbbbb",
          "................",
          "................",
          "......cccc......",
          "....ccbbbbcc....",
          "...cbbbbbbbbc...",
          "................",
          "................"
        ]
      },
      {
        id: 'preset-asset-pattern-woodgrain',
        type: 'pattern',
        name: 'Veta de Madera 16x16',
        description: 'Patrón de suelo de parqué de madera detallado.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "oooooooooooooooo",
          "oddooddooddooddo",
          "odkoodkoodkoodko",
          "oookooookooookoo",
          "oooooooooooooooo",
          "ooddooddooddoodd",
          "ookoodkoodkoodko",
          "oookooookooookoo",
          "oooooooooooooooo",
          "oddooddooddooddo",
          "odkoodkoodkoodko",
          "oookooookooookoo",
          "oooooooooooooooo",
          "ooddooddooddoodd",
          "ookoodkoodkoodko",
          "oookooookooookoo"
        ]
      },
      {
        id: 'preset-asset-pattern-scales',
        type: 'pattern',
        name: 'Escamas de Dragón 8x8',
        description: 'Patrón escamado para dragones, monstruos o techos.',
        tags: [],
        width: 8,
        height: 8,
        lines: [
          "..r...r.",
          ".rrr.rrr",
          "rdddrddd",
          "r...r...",
          ".rrr.rrr",
          "rdddrddd",
          "r...r...",
          "........"
        ]
      },
      {
        id: 'preset-asset-pattern-metalgrid',
        type: 'pattern',
        name: 'Rejilla de Metal 8x8',
        description: 'Rejilla industrial metálica perforada.',
        tags: [],
        width: 8,
        height: 8,
        lines: [
          "dddddddd",
          "dkkddkkd",
          "dkkddkkd",
          "dddddddd",
          "dddddddd",
          "dkkddkkd",
          "dkkddkkd",
          "dddddddd"
        ]
      },
      {
        id: 'preset-asset-pattern-shingles',
        type: 'pattern',
        name: 'Tejas de Tejado 16x16',
        description: 'Patrón clásico de tejas de cabaña terracota repetible.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          ".......o........",
          "......ooo.......",
          ".....ooooo......",
          "kkkkkkkkkkkkkkkk",
          "...o.......o....",
          "..ooo.....ooo...",
          ".ooooo...ooooo..",
          "kkkkkkkkkkkkkkkk",
          ".......o........",
          "......ooo.......",
          ".....ooooo......",
          "kkkkkkkkkkkkkkkk",
          "...o.......o....",
          "..ooo.....ooo...",
          ".ooooo...ooooo..",
          "kkkkkkkkkkkkkkkk"
        ]
      },
      {
        id: 'preset-asset-pattern-diamond',
        type: 'pattern',
        name: 'Rombo Elegante 16x16',
        description: 'Patrón simétrico clásico de papel tapiz en rombos.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "...vv......vv...",
          "..v..v....v..v..",
          ".v....v..v....v.",
          "v......vv......v",
          "v......vv......v",
          ".v....v..v....v.",
          "..v..v....v..v..",
          "...vv......vv...",
          "...vv......vv...",
          "..v..v....v..v..",
          ".v....v..v....v.",
          "v......vv......v",
          "v......vv......v",
          ".v....v..v....v.",
          "..v..v....v..v..",
          "...vv......vv..."
        ]
      },
      {
        id: 'preset-asset-pattern-stars',
        type: 'pattern',
        name: 'Estrellitas de Fondo 16x16',
        description: 'Patrón de noche estrellada perfecto para fondos del cielo.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "................",
          "....y...........",
          "................",
          "..........y.....",
          "................",
          "................",
          "......y.........",
          "................",
          "..y.............",
          "................",
          "............y...",
          "................",
          "................",
          ".......y........",
          "................",
          "................"
        ]
      },

      // 3. Pinceles (Brushes) - 10 items
      {
        id: 'preset-asset-brush-bayer',
        type: 'brush',
        name: 'Sombreado Bayer Fino 8x8',
        description: 'Pincel con textura Bayer fina para transiciones de sombreado.',
        tags: [],
        width: 8,
        height: 8,
        lines: [
          "w.w.w.w.",
          ".w.w.w.w",
          "w.w.w.w.",
          ".w.w.w.w",
          "w.w.w.w.",
          ".w.w.w.w",
          "w.w.w.w.",
          ".w.w.w.w"
        ]
      },
      {
        id: 'preset-asset-brush-noise',
        type: 'brush',
        name: 'Pincel Ruido Disperso 8x8',
        description: 'Pincel de ruido orgánico disperso para texturizar superficies.',
        tags: [],
        width: 8,
        height: 8,
        lines: [
          "w..w..w.",
          "..w..w..",
          ".w..w..w",
          "w..w..w.",
          "..w..w..",
          ".w..w..w",
          "w..w..w.",
          "..w..w.."
        ]
      },
      {
        id: 'preset-asset-brush-cross',
        type: 'brush',
        name: 'Cruz de Precisión 8x8',
        description: 'Pincel simétrico en forma de cruz.',
        tags: [],
        width: 8,
        height: 8,
        lines: [
          "...ww...",
          "...ww...",
          "...ww...",
          "wwwwwwww",
          "wwwwwwww",
          "...ww...",
          "...ww...",
          "...ww..."
        ]
      },
      {
        id: 'preset-asset-brush-round',
        type: 'brush',
        name: 'Pincel Redondo 8x8',
        description: 'Un pincel circular mediano de precisión.',
        tags: [],
        width: 8,
        height: 8,
        lines: [
          "..wwww..",
          ".wwwwww.",
          "wwwwwwww",
          "wwwwwwww",
          "wwwwwwww",
          "wwwwwwww",
          ".wwwwww.",
          "..wwww.."
        ]
      },
      {
        id: 'preset-asset-brush-diagonals',
        type: 'brush',
        name: 'Líneas Diagonales 8x8',
        description: 'Pincel de sombreado con líneas diagonales de un píxel.',
        tags: [],
        width: 8,
        height: 8,
        lines: [
          "w...w...",
          ".w...w..",
          "..w...w.",
          "...w...w",
          "w...w...",
          ".w...w..",
          "..w...w.",
          "...w...w"
        ]
      },
      {
        id: 'preset-asset-brush-dither2',
        type: 'brush',
        name: 'Entramado Medio 8x8',
        description: 'Pincel de semitono medio de franjas cortas.',
        tags: [],
        width: 8,
        height: 8,
        lines: [
          "wwww....",
          "wwww....",
          "....wwww",
          "....wwww",
          "wwww....",
          "wwww....",
          "....wwww",
          "....wwww"
        ]
      },
      {
        id: 'preset-asset-brush-square2',
        type: 'brush',
        name: 'Pincel Cuadrado 8x8',
        description: 'Pincel sólido cuadrado de 8x8 píxeles.',
        tags: [],
        width: 8,
        height: 8,
        lines: [
          "wwwwwwww",
          "wwwwwwww",
          "wwwwwwww",
          "wwwwwwww",
          "wwwwwwww",
          "wwwwwwww",
          "wwwwwwww",
          "wwwwwwww"
        ]
      },
      {
        id: 'preset-asset-brush-splatter',
        type: 'brush',
        name: 'Salpicadura 8x8',
        description: 'Pincel disperso tipo spray o salpicadura artística.',
        tags: [],
        width: 8,
        height: 8,
        lines: [
          "w......w",
          ".w....w.",
          "..w.w...",
          "...w....",
          "...w.w..",
          "..w....w",
          ".w......",
          "w......w"
        ]
      },
      {
        id: 'preset-asset-brush-horizontal',
        type: 'brush',
        name: 'Líneas Horizontales 8x8',
        description: 'Sombreado horizontal de líneas limpias.',
        tags: [],
        width: 8,
        height: 8,
        lines: [
          "wwwwwwww",
          "........",
          "wwwwwwww",
          "........",
          "wwwwwwww",
          "........",
          "wwwwwwww",
          "........"
        ]
      },
      {
        id: 'preset-asset-brush-star',
        type: 'brush',
        name: 'Estrella de 8 Píxeles 8x8',
        description: 'Pincel en forma de destello estelar.',
        tags: [],
        width: 8,
        height: 8,
        lines: [
          "...w....",
          "..www...",
          ".wwwww..",
          "wwwwwwww",
          "wwwwwwww",
          ".wwwww..",
          "..www...",
          "...w...."
        ]
      },

      // 4. Baldosas (Tiles) - 10 items
      {
        id: 'preset-asset-tile-dungeon',
        type: 'tile',
        name: 'Baldosa de Mazmorra 16x16',
        description: 'Baldosa de piedra agrietada para castillos medievales.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "gggggggggggggggk",
          "geeeeeeeeeeeeedk",
          "gedddddddddddddk",
          "gedddddddddddddk",
          "geddkkkdddkkkddk",
          "gedddddddddddddk",
          "gedddddddddddddk",
          "gggggggggggggggk",
          "gddddddddddddddk",
          "gddddddddddddddk",
          "gddddkkkdddkkddk",
          "gddddddddddddddk",
          "gddddddddddddddk",
          "gddddddddddddddk",
          "gddddddddddddddk",
          "kkkkkkkkkkkkkkkk"
        ]
      },
      {
        id: 'preset-asset-tile-tech',
        type: 'tile',
        name: 'Baldosa Tecnológica 16x16',
        description: 'Baldosa futurista con conducto de energía de neón.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "gggggggggggggggk",
          "gcccccccccccccck",
          "gcckkkkkkkkkkcck",
          "gckkkkkkkkkkkkck",
          "gckkcckkkkcckkck",
          "gckkcckkkkcckkck",
          "gckkkkkkkkkkkkck",
          "gckkkkkkkkkkkkck",
          "gckkkkkkkkkkkkck",
          "gckkkkkkkkkkkkck",
          "gckkcckkkkcckkck",
          "gckkcckkkkcckkck",
          "gckkkkkkkkkkkkck",
          "gcckkkkkkkkkkcck",
          "gcccccccccccccck",
          "kkkkkkkkkkkkkkkk"
        ]
      },
      {
        id: 'preset-asset-tile-grass',
        type: 'tile',
        name: 'Baldosa de Hierba 16x16',
        description: 'Suelo orgánico de hierba verde silvestre.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "nnnnnnnnnnnnnnnn",
          "nnnnwwnnnnwnnnnn",
          "nnnnnnnnnnnnnnnn",
          "nnnnnnnnnwnnnnnn",
          "nnwnnnnnnnnnwwnn",
          "nnnnnnnnnnnnnnnn",
          "nnnnwwnnnnwnnnnn",
          "nnnnnnnnnnnnnnnn",
          "nnnnnnnnnnnnnnnn",
          "nnnnwwnnnnwnnnnn",
          "nnnnnnnnnnnnnnnn",
          "nnnnnnnnnwnnnnnn",
          "nnwnnnnnnnnnwwnn",
          "nnnnnnnnnnnnnnnn",
          "nnnnwwnnnnwnnnnn",
          "kkkkkkkkkkkkkkkk"
        ]
      },
      {
        id: 'preset-asset-tile-temple',
        type: 'tile',
        name: 'Baldosa de Templo Ancestral 16x16',
        description: 'Mosaico de piedra arenisca de un santuario antiguo.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "eeeeeeeeeeeeeeeg",
          "eoooooooooooooog",
          "eoyyyyyyyyyyyyog",
          "eoyyyyyyyyyyyyog",
          "eoyyggggggggyyog",
          "eoyygddddddgyyog",
          "eoyygdwwwddgyyog",
          "eoyygdwwwddgyyog",
          "eoyygdwwwddgyyog",
          "eoyygddddddgyyog",
          "eoyyggggggggyyog",
          "eoyyyyyyyyyyyyog",
          "eoyyyyyyyyyyyyog",
          "eoooooooooooooog",
          "eoooooooooooooog",
          "gggggggggggggggg"
        ]
      },
      {
        id: 'preset-asset-tile-clay',
        type: 'tile',
        name: 'Baldosa de Arcilla Cocida 16x16',
        description: 'Terracota rústica decorada para villas romanas.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "rrrrrrrrrrrrrrro",
          "roooooooooooooor",
          "rokkkkkkkkkkkkor",
          "rokrrrrrrrrrrkor",
          "rokrrrrrrrrrrkor",
          "rokrrkkkkkkrrkor",
          "rokrrkkkkkkrrkor",
          "rokrrkkyykkrrkor",
          "rokrrkkyykkrrkor",
          "rokrrkkkkkkrrkor",
          "rokrrkkkkkkrrkor",
          "rokrrrrrrrrrrkor",
          "rokrrrrrrrrrrkor",
          "rokkkkkkkkkkkkor",
          "roooooooooooooor",
          "oooooooooooooooo"
        ]
      },
      {
        id: 'preset-asset-tile-oak',
        type: 'tile',
        name: 'Baldosa de Madera de Roble 16x16',
        description: 'Parquet de madera noble para suelos elegantes.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "oooooooooooooood",
          "oddddddddddddddd",
          "oddddddddddddddd",
          "odddkkkkkkkkdddd",
          "odddkkkkkkkkdddd",
          "odddkkooookkdddd",
          "odddkkooookkdddd",
          "odddkkooookkdddd",
          "odddkkooookkdddd",
          "odddkkkkkkkkdddd",
          "odddkkkkkkkkdddd",
          "oddddddddddddddd",
          "oddddddddddddddd",
          "oddddddddddddddd",
          "oddddddddddddddd",
          "dddddddddddddddd"
        ]
      },
      {
        id: 'preset-asset-tile-sand',
        type: 'tile',
        name: 'Baldosa de Arena Desértica 16x16',
        description: 'Textura de duna ondulada por el viento del desierto.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "yyyyyyyyyyyyyyyo",
          "yooooooooooooooo",
          "yooooooooooooooo",
          "yoyyyyyyyyyyyyoo",
          "yoyyyyyyyyyyyyoo",
          "yooooooooooooooo",
          "yyyyyyyyyyyyyyyo",
          "yooooooooooooooo",
          "yooooooooooooooo",
          "yoyyyyyyyyyyyyoo",
          "yoyyyyyyyyyyyyoo",
          "yooooooooooooooo",
          "yyyyyyyyyyyyyyyo",
          "yooooooooooooooo",
          "yooooooooooooooo",
          "oooooooooooooooo"
        ]
      },
      {
        id: 'preset-asset-tile-ice',
        type: 'tile',
        name: 'Baldosa de Hielo Glacial 16x16',
        description: 'Suelo congelado deslizante con destellos de luz fría.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "eeeeeeeeeeeeeeec",
          "eccccccccccccccg",
          "eccccccccccccccg",
          "eccwwwwwwwwwwccg",
          "eccwwwwwwwwwwccg",
          "eccccccccccccccg",
          "eeeeeeeeeeeeeeec",
          "eccccccccccccccg",
          "eccccccccccccccg",
          "eccwwwwwwwwwwccg",
          "eccwwwwwwwwwwccg",
          "eccccccccccccccg",
          "eccccccccccccccg",
          "eccccccccccccccg",
          "eccccccccccccccg",
          "gggggggggggggggg"
        ]
      },
      {
        id: 'preset-asset-tile-circuit',
        type: 'tile',
        name: 'Baldosa de Circuito Dorado 16x16',
        description: 'Placa base de silicio para tecnología informática.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "dddddddddddddddk",
          "dyyyyyyyyyyyyyyk",
          "dyyyyyyyyyyyyyyk",
          "dyykkkkkkkkkkyyk",
          "dyykkkkkkkkkkyyk",
          "dyykkkkkkkkkkyyk",
          "dyykkkkkkkkkkyyk",
          "dyykkkkkkkkkkyyk",
          "dyykkkkkkkkkkyyk",
          "dyykkkkkkkkkkyyk",
          "dyykkkkkkkkkkyyk",
          "dyykkkkkkkkkkyyk",
          "dyyyyyyyyyyyyyyk",
          "dyyyyyyyyyyyyyyk",
          "dyyyyyyyyyyyyyyk",
          "kkkkkkkkkkkkkkkk"
        ]
      },
      {
        id: 'preset-asset-tile-mosaic',
        type: 'tile',
        name: 'Baldosa de Mosaico Azul 16x16',
        description: 'Baldosas vidriadas de mosaico para fuentes o templos.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "cebbebbecebbebbc",
          "ewebbeweewebbewe",
          "beewbeebeewbeebb",
          "bbbebebbbbbebebb",
          "bbbebebbbbbebebb",
          "beewbeebeewbeebb",
          "ewebbeweewebbewe",
          "cebbebbecebbebbc",
          "cebbebbecebbebbc",
          "ewebbeweewebbewe",
          "beewbeebeewbeebb",
          "bbbebebbbbbebebb",
          "bbbebebbbbbebebb",
          "beewbeebeewbeebb",
          "ewebbeweewebbewe",
          "cebbebbecebbebbc"
        ]
      },

      // 5. Selecciones (Selections) - 10 items
      {
        id: 'preset-asset-selection-corner',
        type: 'selection',
        name: 'Selección de Esquina 16x16',
        description: 'Guía con esquinas marcadas para encuadres precisos.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "ccc..........ccc",
          "c..............c",
          "c..............c",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "c..............c",
          "c..............c",
          "ccc..........ccc"
        ]
      },
      {
        id: 'preset-asset-selection-grid',
        type: 'selection',
        name: 'Selección de Rejilla 16x16',
        description: 'Guía de cuadrícula punteada para delimitación de celdas.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "c.c.c.c.c.c.c.c.",
          "................",
          "c..............c",
          "................",
          "c..............c",
          "................",
          "c..............c",
          "................",
          "c..............c",
          "................",
          "c..............c",
          "................",
          "c..............c",
          "................",
          "c..............c",
          ".c.c.c.c.c.c.c.c"
        ]
      },
      {
        id: 'preset-asset-selection-circle',
        type: 'selection',
        name: 'Marco Circular 16x16',
        description: 'Encuadre redondo simétrico perfecto.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "......cccc......",
          "....cc....cc....",
          "...c........c...",
          "..c..........c..",
          ".c............c.",
          ".c............c.",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          ".c............c.",
          ".c............c.",
          "..c..........c..",
          "...c........c...",
          "....cc....cc....",
          "......cccc......"
        ]
      },
      {
        id: 'preset-asset-selection-crosshair',
        type: 'selection',
        name: 'Cruz de Enfoque 16x16',
        description: 'Retícula clásica de mira telescópica o cámara.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          ".......cc.......",
          ".......cc.......",
          ".......cc.......",
          "................",
          "................",
          "................",
          "................",
          "ccc..........ccc",
          "ccc..........ccc",
          "................",
          "................",
          "................",
          "................",
          ".......cc.......",
          ".......cc.......",
          ".......cc......."
        ]
      },
      {
        id: 'preset-asset-selection-rhombus',
        type: 'selection',
        name: 'Selección Romboide 16x16',
        description: 'Guía geométrica con forma de rombo de 16x16.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          ".......cc.......",
          "......c..c......",
          ".....c....c.....",
          "....c......c....",
          "...c........c...",
          "..c..........c..",
          ".c............c.",
          "c..............c",
          "c..............c",
          ".c............c.",
          "..c..........c..",
          "...c........c...",
          "....c......c....",
          ".....c....c.....",
          "......c..c......",
          ".......cc......."
        ]
      },
      {
        id: 'preset-asset-selection-frame16',
        type: 'selection',
        name: 'Marco de Esquina 16x16',
        description: 'Esquinas de encuadre amplias para lienzos grandes.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "cccccccccccccccc",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          "cccccccccccccccc"
        ]
      },
      {
        id: 'preset-asset-selection-third16',
        type: 'selection',
        name: 'Rejilla de Tercios 16x16',
        description: 'Guía composición de regla de tercios para diseño.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          ".....c....c.....",
          ".....c....c.....",
          ".....c....c.....",
          ".....c....c.....",
          ".....c....c.....",
          "cccccccccccccccc",
          ".....c....c.....",
          ".....c....c.....",
          ".....c....c.....",
          ".....c....c.....",
          "cccccccccccccccc",
          ".....c....c.....",
          ".....c....c.....",
          ".....c....c.....",
          ".....c....c.....",
          ".....c....c....."
        ]
      },
      {
        id: 'preset-asset-selection-octagonal',
        type: 'selection',
        name: 'Marco Octogonal 16x16',
        description: 'Marco simétrico con esquinas suavizadas de corte octogonal.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "....cccccccc....",
          "..cc........cc..",
          ".c............c.",
          ".c............c.",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          "c..............c",
          ".c............c.",
          ".c............c.",
          "..cc........cc..",
          "....cccccccc...."
        ]
      },
      {
        id: 'preset-asset-selection-lshape',
        type: 'selection',
        name: 'Selección en L 16x16',
        description: 'Dos esquinas en forma de L opuestas para guías.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          "cccc............",
          "c...............",
          "c...............",
          "c...............",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "...............c",
          "...............c",
          "...............c",
          "............cccc"
        ]
      },
      {
        id: 'preset-asset-selection-center16',
        type: 'selection',
        name: 'Guía de Retícula Central 16x16',
        description: 'Enfoque de retícula central y marcas perimetrales para simetría.',
        tags: [],
        width: 16,
        height: 16,
        lines: [
          ".......cc.......",
          ".......cc.......",
          ".......cc.......",
          ".......cc.......",
          ".......cc.......",
          ".......cc.......",
          ".......cc.......",
          "cccccccccccccccc",
          "cccccccccccccccc",
          ".......cc.......",
          ".......cc.......",
          ".......cc.......",
          ".......cc.......",
          ".......cc.......",
          ".......cc.......",
          ".......cc......."
        ]
      }
    ];

    const presets: StampResource[] = configs.map(cfg => ({
      id: cfg.id,
      version: 1,
      type: cfg.type as any,
      name: cfg.name,
      description: cfg.description,
      tags: cfg.tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      width: cfg.width,
      height: cfg.height,
      pivot: { x: Math.floor(cfg.width / 2), y: Math.floor(cfg.height / 2) },
      origin: { x: 0, y: 0 },
      data: {
        pixels: parseSprite(cfg.lines, cfg.width, cfg.height)
      }
    }));

    // Combine any user custom-created stamps (not prefix with preset-asset-)
    let currentList: any[] = [];
    try {
      const data = localStorage.getItem(this.INDEX_KEY);
      if (data) {
        currentList = JSON.parse(data);
      }
    } catch (e) {
      console.error(e);
    }

    const userAssets = Array.isArray(currentList) ? currentList.filter(item => item && item.id && !item.id.startsWith('preset-asset-')) : [];

    const combinedMetadataList: StampMetadata[] = [
      ...userAssets,
      ...presets.map(p => ({
        id: p.id,
        version: p.version,
        type: p.type,
        name: p.name,
        description: p.description,
        tags: p.tags,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        width: p.width,
        height: p.height,
        pivot: p.pivot,
        preview: p.preview || '',
        author: p.author || 'system',
        origin: p.origin,
        metadata: p.metadata || {}
      }))
    ];

    try {
      localStorage.setItem(this.INDEX_KEY, JSON.stringify(combinedMetadataList));
      presets.forEach(p => {
        localStorage.setItem(`${this.DATA_PREFIX}${p.id}`, JSON.stringify(p.data));
      });
    } catch (e) {
      console.error('Failed to pre-populate default stamps', e);
    }
  }

  /**
   * Retrieves a full StampResource with its pixel data, loading it lazily from storage.
   */
  static getStamp(id: string): StampResource | null {
    const index = this.getStampsIndex();
    const meta = index.find(item => item.id === id);
    if (!meta) return null;

    try {
      const dataStr = localStorage.getItem(`${this.DATA_PREFIX}${id}`);
      const data = dataStr ? JSON.parse(dataStr) : null;
      const rawAsset = {
        ...meta,
        data,
      };
      return this.migrateAsset(rawAsset);
    } catch (e) {
      console.error(`Failed to load stamp pixel data for ${id}`, e);
      return null;
    }
  }

  /**
   * Saves a StampResource by writing metadata to the index and pixel data to a separate key.
   */
  static saveStamp(stamp: StampResource): void {
    const index = this.getStampsIndex();
    const migrated = this.migrateAsset(stamp);
    
    // Split metadata and heavy pixel data
    const metadata: StampMetadata = {
      id: migrated.id,
      version: migrated.version,
      type: migrated.type,
      name: migrated.name,
      description: migrated.description,
      tags: migrated.tags,
      createdAt: migrated.createdAt,
      updatedAt: migrated.updatedAt,
      width: migrated.width,
      height: migrated.height,
      pivot: migrated.pivot,
      preview: migrated.preview,
      author: migrated.author,
      origin: migrated.origin,
      metadata: migrated.metadata,
    };

    // Update index
    const existingIndex = index.findIndex(item => item.id === migrated.id);
    if (existingIndex >= 0) {
      index[existingIndex] = metadata;
    } else {
      index.push(metadata);
    }

    try {
      localStorage.setItem(this.INDEX_KEY, JSON.stringify(index));
      localStorage.setItem(`${this.DATA_PREFIX}${migrated.id}`, JSON.stringify(migrated.data));
    } catch (e) {
      console.error('Failed to save stamp to localStorage', e);
      throw e;
    }
  }

  /**
   * Deletes a stamp from the index and deletes its pixel data.
   */
  static deleteStamp(id: string): void {
    const index = this.getStampsIndex();
    const filteredIndex = index.filter(item => item.id !== id);
    
    try {
      localStorage.setItem(this.INDEX_KEY, JSON.stringify(filteredIndex));
      localStorage.removeItem(`${this.DATA_PREFIX}${id}`);
    } catch (e) {
      console.error(`Failed to delete stamp ${id}`, e);
      throw e;
    }
  }

  /**
   * Clears all stamps from local storage.
   */
  static clearAllStamps(): void {
    const index = this.getStampsIndex();
    index.forEach(item => {
      localStorage.removeItem(`${this.DATA_PREFIX}${item.id}`);
    });
    localStorage.removeItem(this.INDEX_KEY);
  }
}
