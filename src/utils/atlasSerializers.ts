import { SpriteAtlas } from '../types';

/**
 * Serializes a SpriteAtlas into TexturePacker JSON (Hash) format.
 * Fully compliant with PixiJS, Phaser, and modern game engines.
 */
export function serializeAtlasToJson(atlas: SpriteAtlas, imageFileName: string): string {
  const framesRecord: Record<string, any> = {};

  atlas.frames.forEach((f) => {
    framesRecord[f.name] = {
      frame: { x: f.x, y: f.y, w: f.w, h: f.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h },
      sourceSize: { w: f.w, h: f.h },
      pivot: { x: f.pivotX ?? 0.5, y: f.pivotY ?? 0.5 }
    };
  });

  const output = {
    frames: framesRecord,
    meta: {
      app: atlas.meta.app,
      version: '1.0.0',
      image: imageFileName,
      format: 'RGBA8888',
      size: { w: atlas.meta.width, h: atlas.meta.height },
      scale: atlas.meta.scale.toString(),
      schema: atlas.meta.schema,
      schemaVersion: atlas.meta.schemaVersion,
      generator: atlas.meta.generator
    }
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Serializes a SpriteAtlas into Starling / Cocos2D compliant XML format.
 */
export function serializeAtlasToXml(atlas: SpriteAtlas, imageFileName: string): string {
  // Escape attributes helper to prevent invalid XML syntax
  const escapeXml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<TextureAtlas imagePath="${escapeXml(imageFileName)}" width="${atlas.meta.width}" height="${atlas.meta.height}" app="${escapeXml(atlas.meta.app)}" version="1.0.0" schema="${escapeXml(atlas.meta.schema)}" schemaVersion="${escapeXml(atlas.meta.schemaVersion)}">\n`;

  atlas.frames.forEach((f) => {
    const pivotAttr = f.pivotX !== undefined ? ` pivotX="${f.pivotX}" pivotY="${f.pivotY ?? 0.5}"` : '';
    xml += `  <SubTexture name="${escapeXml(f.name)}" x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}"${pivotAttr} />\n`;
  });

  xml += `</TextureAtlas>\n`;
  return xml;
}
