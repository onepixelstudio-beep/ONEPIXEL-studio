import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Check, Download, Layers } from 'lucide-react';
import { PixelProject } from '../types';
import { translate, LanguageCode } from '../i18n';

interface PatternsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: PixelProject;
  currentFrameId: string;
  currentLayerId: string;
  selection: { active: boolean; pixels: boolean[] };
  onUpdatePixels: (pixels: { [frameId: string]: { [layerId: string]: string[] } }, isUndoable?: boolean) => void;
  onStartHistoryAction?: () => void;
  onApplyPatternStamp?: (pattern: { pixels: string[]; width: number; height: number; name: string }) => void;
  language?: LanguageCode;
}

interface PatternItem {
  id: string;
  name: string;
  nameKey?: string;
  category: string;
  pixels: string[]; // flat array of width * height colors
  width: number;
  height: number;
}

// Generate high quality pixel art textures (8x8) for presets
const PRESET_CATEGORIES = [
  { id: 'nature', nameKey: 'patternsModal.catNature' },
  { id: 'stone', nameKey: 'patternsModal.catStone' },
  { id: 'wood', nameKey: 'patternsModal.catWood' },
  { id: 'metal', nameKey: 'patternsModal.catMetal' },
  { id: 'water', nameKey: 'patternsModal.catWater' },
  { id: 'sand', nameKey: 'patternsModal.catSand' },
  { id: 'lava', nameKey: 'patternsModal.catLava' },
  { id: 'fantasy', nameKey: 'patternsModal.catFantasy' },
  { id: 'scifi', nameKey: 'patternsModal.catScifi' },
  { id: 'retro', nameKey: 'patternsModal.catRetro' },
  { id: 'effects', nameKey: 'patternsModal.catEffects' }
];

const generatePresetPatterns = (): PatternItem[] => {
  const list: PatternItem[] = [];

  const addPreset = (category: string, index: number, name: string, colorGrid: string[][]) => {
    // Flatten the grid
    const pixels = colorGrid.flat();
    const capCat = category.charAt(0).toUpperCase() + category.slice(1);
    list.push({
      id: `preset-${category}-${index}`,
      name,
      nameKey: `patternsModal.preset${capCat}${index}`,
      category,
      pixels,
      width: 8,
      height: 8
    });
  };

  // 1. NATURALEZA (nature)
  const v1 = '#14532d', v2 = '#166534', v3 = '#15803d', v4 = '#22c55e', v5 = '#4ade80';
  addPreset('nature', 1, 'Césped de Pradera', [
    [v2, v2, v3, v2, v2, v3, v2, v2],
    [v2, v4, v3, v2, v4, v3, v2, v4],
    [v3, v3, v2, v3, v3, v2, v3, v3],
    [v2, v2, v4, v5, v2, v2, v4, v5],
    [v2, v2, v3, v2, v2, v3, v2, v2],
    [v2, v4, v3, v2, v4, v3, v2, v4],
    [v3, v3, v2, v3, v3, v2, v3, v3],
    [v2, v2, v4, v5, v2, v2, v4, v5]
  ]);

  const na1 = '#15803d', na2 = '#166534', na_red = '#ef4444', na_yel = '#eab308', na_whi = '#ffffff';
  addPreset('nature', 2, 'Flores Silvestres', [
    [na1, na1, na2, na1, na1, na_red, na1, na1],
    [na1, na_yel, na1, na1, na1, na1, na1, na1],
    [na2, na1, na1, na1, na_whi, na1, na1, na2],
    [na1, na1, na_red, na1, na1, na1, na_yel, na1],
    [na1, na1, na2, na1, na1, na_red, na1, na1],
    [na1, na_yel, na1, na1, na1, na1, na1, na1],
    [na2, na1, na1, na1, na_whi, na1, na1, na2],
    [na1, na1, na_red, na1, na1, na1, na_yel, na1]
  ]);

  const mu1 = '#064e3b', mu2 = '#0f766e', mu3 = '#115e59', mu4 = '#0d9488', mu5 = '#2dd4bf';
  addPreset('nature', 3, 'Musgo de Bosque', [
    [mu1, mu1, mu2, mu1, mu1, mu2, mu1, mu1],
    [mu1, mu3, mu4, mu3, mu1, mu3, mu4, mu3],
    [mu2, mu4, mu5, mu4, mu2, mu4, mu5, mu4],
    [mu1, mu3, mu4, mu3, mu1, mu3, mu4, mu3],
    [mu1, mu1, mu2, mu1, mu1, mu2, mu1, mu1],
    [mu1, mu3, mu4, mu3, mu1, mu3, mu4, mu3],
    [mu2, mu4, mu5, mu4, mu2, mu4, mu5, mu4],
    [mu1, mu3, mu4, mu3, mu1, mu3, mu4, mu3]
  ]);

  const ot1 = '#7c2d12', ot2 = '#9a3412', ot3 = '#c2410c', ot4 = '#ea580c', ot5 = '#ca8a04';
  addPreset('nature', 4, 'Hojas de Otoño', [
    [ot2, ot3, ot2, ot1, ot2, ot3, ot2, ot1],
    [ot3, ot4, ot5, ot3, ot3, ot4, ot5, ot3],
    [ot2, ot5, ot5, ot4, ot2, ot5, ot5, ot4],
    [ot1, ot3, ot4, ot2, ot1, ot3, ot4, ot2],
    [ot2, ot3, ot2, ot1, ot2, ot3, ot2, ot1],
    [ot3, ot4, ot5, ot3, ot3, ot4, ot5, ot3],
    [ot2, ot5, ot5, ot4, ot2, ot5, ot5, ot4],
    [ot1, ot3, ot4, ot2, ot1, ot3, ot4, ot2]
  ]);

  // 2. PIEDRA (stone)
  const st1 = '#1f2937', st2 = '#374151', st3 = '#4b5563', st4 = '#6b7280', st5 = '#9ca3af';
  addPreset('stone', 1, 'Adoquines Grises', [
    [st5, st4, st4, st4, st5, st4, st4, st4],
    [st4, st3, st3, st1, st4, st3, st3, st1],
    [st4, st3, st2, st1, st4, st3, st2, st1],
    [st1, st1, st1, st1, st1, st1, st1, st1],
    [st5, st4, st4, st4, st5, st4, st4, st4],
    [st4, st3, st3, st1, st4, st3, st3, st1],
    [st4, st3, st2, st1, st4, st3, st2, st1],
    [st1, st1, st1, st1, st1, st1, st1, st1]
  ]);

  const an1 = '#78350f', an2 = '#92400e', an3 = '#b45309', an4 = '#d97706', an5 = '#f59e0b';
  addPreset('stone', 2, 'Piedra Ancestral', [
    [an5, an4, an4, an4, an4, an4, an4, an5],
    [an4, an1, an1, an4, an4, an1, an1, an4],
    [an4, an4, an1, an4, an4, an1, an4, an4],
    [an4, an4, an1, an1, an1, an1, an4, an4],
    [an4, an4, an1, an4, an4, an1, an4, an4],
    [an4, an1, an2, an4, an4, an1, an2, an4],
    [an4, an4, an4, an4, an4, an4, an4, an4],
    [an5, an4, an4, an4, an4, an4, an4, an5]
  ]);

  const ca1 = '#111827', ca2 = '#374151', ca3 = '#4b5563', ca4 = '#6b7280';
  addPreset('stone', 3, 'Ladrillo de Castillo', [
    [ca4, ca4, ca4, ca1, ca4, ca4, ca4, ca1],
    [ca3, ca2, ca2, ca1, ca3, ca2, ca2, ca1],
    [ca1, ca1, ca1, ca1, ca1, ca1, ca1, ca1],
    [ca4, ca1, ca4, ca4, ca4, ca1, ca4, ca4],
    [ca2, ca1, ca3, ca2, ca2, ca1, ca3, ca2],
    [ca1, ca1, ca1, ca1, ca1, ca1, ca1, ca1],
    [ca4, ca4, ca4, ca1, ca4, ca4, ca4, ca1],
    [ca3, ca2, ca2, ca1, ca3, ca2, ca2, ca1]
  ]);

  const pz1 = '#030712', pz2 = '#111827', pz3 = '#1f2937', pz4 = '#374151', pz5 = '#4b5563';
  addPreset('stone', 4, 'Pizarra Agrietada', [
    [pz3, pz3, pz4, pz3, pz3, pz4, pz3, pz3],
    [pz3, pz1, pz3, pz3, pz1, pz3, pz3, pz1],
    [pz4, pz3, pz2, pz1, pz4, pz3, pz2, pz1],
    [pz3, pz3, pz1, pz3, pz3, pz1, pz3, pz3],
    [pz3, pz3, pz4, pz3, pz3, pz4, pz3, pz3],
    [pz3, pz1, pz3, pz3, pz1, pz3, pz3, pz1],
    [pz4, pz3, pz2, pz1, pz4, pz3, pz2, pz1],
    [pz3, pz3, pz1, pz3, pz3, pz1, pz3, pz3]
  ]);

  // 6. ARENA (sand)
  const sa1 = '#78350f', sa2 = '#92400e', sa3 = '#d97706', sa4 = '#fbbf24', sa5 = '#fef08a';
  addPreset('sand', 1, 'Dunas Suaves', [
    [sa3, sa3, sa3, sa4, sa3, sa3, sa3, sa4],
    [sa3, sa4, sa5, sa4, sa3, sa4, sa5, sa4],
    [sa4, sa5, sa3, sa5, sa4, sa5, sa3, sa5],
    [sa3, sa4, sa4, sa4, sa3, sa4, sa4, sa4],
    [sa3, sa3, sa3, sa4, sa3, sa3, sa3, sa4],
    [sa3, sa4, sa5, sa4, sa3, sa4, sa5, sa4],
    [sa4, sa5, sa3, sa5, sa4, sa5, sa3, sa5],
    [sa3, sa4, sa4, sa4, sa3, sa4, sa4, sa4]
  ]);

  const as1 = '#b45309', as2 = '#d97706', as3 = '#f59e0b';
  addPreset('sand', 2, 'Arena Seca', [
    [as1, as1, as2, as1, as1, as1, as2, as1],
    [as1, as2, as3, as2, as1, as2, as3, as2],
    [as2, as3, as1, as3, as2, as3, as1, as3],
    [as1, as2, as2, as2, as1, as2, as2, as2],
    [as1, as1, as2, as1, as1, as1, as2, as1],
    [as1, as2, as3, as2, as1, as2, as3, as2],
    [as2, as3, as1, as3, as2, as3, as1, as3],
    [as1, as2, as2, as2, as1, as2, as2, as2]
  ]);

  const fs1 = '#451a03', fs2 = '#78350f', fs3 = '#d97706';
  addPreset('sand', 3, 'Fósiles en Arena', [
    [fs3, fs3, fs3, fs3, fs3, fs3, fs3, fs3],
    [fs3, fs2, fs2, fs3, fs3, fs2, fs2, fs3],
    [fs3, fs3, fs1, fs3, fs3, fs1, fs3, fs3],
    [fs3, fs3, fs3, fs3, fs3, fs3, fs3, fs3],
    [fs3, fs3, fs3, fs3, fs3, fs3, fs3, fs3],
    [fs3, fs2, fs2, fs3, fs3, fs2, fs2, fs3],
    [fs3, fs3, fs1, fs3, fs3, fs1, fs3, fs3],
    [fs3, fs3, fs3, fs3, fs3, fs3, fs3, fs3]
  ]);

  const os1 = '#451a03', os2 = '#78350f', os3 = '#92400e';
  addPreset('sand', 4, 'Oasis Seco', [
    [os3, os3, os3, os1, os3, os3, os3, os1],
    [os3, os3, os1, os3, os3, os3, os1, os3],
    [os3, os1, os3, os3, os3, os1, os3, os3],
    [os1, os3, os3, os3, os1, os3, os3, os3],
    [os3, os3, os3, os1, os3, os3, os3, os1],
    [os3, os3, os1, os3, os3, os3, os1, os3],
    [os3, os1, os3, os3, os3, os1, os3, os3],
    [os1, os3, os3, os3, os1, os3, os3, os3]
  ]);

  // 5. AGUA (water)
  const wa1 = '#1e3a8a', wa2 = '#1d4ed8', wa3 = '#2563eb', wa4 = '#3b82f6', wa5 = '#60a5fa';
  addPreset('water', 1, 'Ondas Marinas', [
    [wa1, wa1, wa1, wa1, wa1, wa1, wa1, wa1],
    [wa1, wa1, wa4, wa1, wa1, wa1, wa4, wa1],
    [wa1, wa4, wa5, wa4, wa1, wa4, wa5, wa4],
    [wa1, wa1, wa1, wa1, wa1, wa1, wa1, wa1],
    [wa1, wa1, wa1, wa1, wa1, wa1, wa1, wa1],
    [wa1, wa1, wa1, wa4, wa1, wa1, wa1, wa4],
    [wa1, wa1, wa4, wa5, wa4, wa1, wa4, wa5],
    [wa1, wa1, wa1, wa1, wa1, wa1, wa1, wa1]
  ]);

  const lo1 = '#172554', lo2 = '#1e3a8a', lo3 = '#1d4ed8', lo_grn = '#10b981', lo_pnk = '#ec4899';
  addPreset('water', 2, 'Estanque de Loto', [
    [lo2, lo2, lo2, lo1, lo2, lo2, lo2, lo1],
    [lo2, lo_grn, lo_grn, lo2, lo2, lo2, lo2, lo2],
    [lo2, lo_grn, lo_pnk, lo2, lo2, lo_grn, lo_grn, lo2],
    [lo1, lo2, lo2, lo2, lo2, lo_grn, lo2, lo2],
    [lo2, lo2, lo2, lo1, lo2, lo2, lo2, lo1],
    [lo2, lo2, lo2, lo2, lo2, lo2, lo2, lo2],
    [lo2, lo2, lo2, lo2, lo2, lo2, lo2, lo2],
    [lo1, lo2, lo2, lo2, lo2, lo2, lo2, lo2]
  ]);

  const ri1 = '#1e3b8b', ri2 = '#2563eb', ri3 = '#3b82f6', ri4 = '#60a5fa', ri5 = '#93c5fd';
  addPreset('water', 3, 'Corriente de Río', [
    [ri2, ri3, ri2, ri2, ri3, ri2, ri2, ri3],
    [ri3, ri4, ri3, ri3, ri4, ri3, ri3, ri4],
    [ri1, ri2, ri2, ri1, ri2, ri2, ri1, ri2],
    [ri2, ri2, ri3, ri2, ri2, ri3, ri2, ri2],
    [ri3, ri4, ri5, ri4, ri3, ri4, ri5, ri4],
    [ri2, ri3, ri4, ri3, ri2, ri3, ri4, ri3],
    [ri1, ri2, ri2, ri1, ri2, ri2, ri1, ri2],
    [ri2, ri2, ri2, ri2, ri2, ri2, ri2, ri2]
  ]);

  const pr1 = '#0F3D34', pr2 = '#1e3a8a', pr3 = '#1d4ed8';
  addPreset('water', 4, 'Agua Profunda', [
    [pr1, pr1, pr1, pr1, pr1, pr1, pr1, pr1],
    [pr1, pr1, pr2, pr1, pr1, pr1, pr2, pr1],
    [pr1, pr2, pr3, pr2, pr1, pr2, pr3, pr2],
    [pr1, pr1, pr1, pr1, pr1, pr1, pr1, pr1],
    [pr1, pr1, pr1, pr1, pr1, pr1, pr1, pr1],
    [pr1, pr1, pr1, pr2, pr1, pr1, pr1, pr2],
    [pr1, pr1, pr2, pr3, pr2, pr1, pr2, pr3],
    [pr1, pr1, pr1, pr1, pr1, pr1, pr1, pr1]
  ]);

  // 3. MADERA (wood)
  const wo1 = '#451a03', wo2 = '#78350f', wo3 = '#92400e', wo4 = '#b45309', wo5 = '#d97706';
  addPreset('wood', 1, 'Madera de Roble', [
    [wo3, wo3, wo3, wo3, wo3, wo3, wo3, wo3],
    [wo3, wo2, wo2, wo2, wo3, wo2, wo2, wo3],
    [wo4, wo3, wo1, wo3, wo4, wo3, wo1, wo3],
    [wo3, wo3, wo3, wo3, wo3, wo3, wo3, wo3],
    [wo3, wo3, wo3, wo3, wo3, wo3, wo3, wo3],
    [wo3, wo2, wo2, wo2, wo3, wo2, wo2, wo3],
    [wo4, wo3, wo1, wo3, wo4, wo3, wo1, wo3],
    [wo3, wo3, wo3, wo3, wo3, wo3, wo3, wo3]
  ]);

  addPreset('wood', 2, 'Tablas Rústicas', [
    [wo5, wo4, wo4, wo4, wo5, wo4, wo4, wo4],
    [wo4, wo3, wo3, wo1, wo4, wo3, wo3, wo1],
    [wo4, wo3, wo2, wo1, wo4, wo3, wo2, wo1],
    [wo1, wo1, wo1, wo1, wo1, wo1, wo1, wo1],
    [wo5, wo4, wo4, wo4, wo5, wo4, wo4, wo4],
    [wo4, wo3, wo3, wo1, wo4, wo3, wo3, wo1],
    [wo4, wo3, wo2, wo1, wo4, wo3, wo2, wo1],
    [wo1, wo1, wo1, wo1, wo1, wo1, wo1, wo1]
  ]);

  addPreset('wood', 3, 'Tronco de Árbol', [
    [wo2, wo2, wo2, wo1, wo2, wo2, wo2, wo1],
    [wo2, wo4, wo4, wo2, wo2, wo4, wo4, wo2],
    [wo1, wo2, wo2, wo2, wo1, wo2, wo2, wo2],
    [wo2, wo2, wo2, wo2, wo2, wo2, wo2, wo2],
    [wo2, wo2, wo1, wo2, wo2, wo2, wo1, wo2],
    [wo2, wo2, wo2, wo2, wo2, wo2, wo2, wo2],
    [wo1, wo2, wo2, wo2, wo1, wo2, wo2, wo2],
    [wo2, wo2, wo2, wo1, wo2, wo2, wo2, wo1]
  ]);

  addPreset('wood', 4, 'Corteza Antigua', [
    [wo1, wo2, wo1, wo1, wo1, wo2, wo1, wo1],
    [wo1, wo3, wo2, wo1, wo1, wo3, wo2, wo1],
    [wo2, wo3, wo1, wo3, wo2, wo3, wo1, wo3],
    [wo3, wo1, wo1, wo1, wo3, wo1, wo1, wo1],
    [wo1, wo2, wo1, wo1, wo1, wo2, wo1, wo1],
    [wo1, wo3, wo2, wo1, wo1, wo3, wo2, wo1],
    [wo2, wo3, wo1, wo3, wo2, wo3, wo1, wo3],
    [wo3, wo1, wo1, wo1, wo3, wo1, wo1, wo1]
  ]);

  // 4. METAL (metal)
  const me1 = '#0F3D34', me2 = '#1e293b', me3 = '#334155', me4 = '#475569', me5 = '#64748b';
  addPreset('metal', 1, 'Placa con Remaches', [
    [me5, me4, me4, me4, me4, me4, me4, me4],
    [me4, me3, me3, me3, me3, me3, me3, me1],
    [me4, me3, me5, me3, me3, me5, me3, me1],
    [me4, me3, me3, me3, me3, me3, me3, me1],
    [me4, me3, me3, me3, me3, me3, me3, me1],
    [me4, me3, me5, me3, me3, me5, me3, me1],
    [me4, me3, me3, me3, me3, me3, me3, me1],
    [me4, me1, me1, me1, me1, me1, me1, me1]
  ]);

  addPreset('metal', 2, 'Rejilla Industrial', [
    [me1, me1, me1, me5, me1, me1, me1, me5],
    [me1, me1, me5, me1, me1, me1, me5, me1],
    [me1, me5, me1, me1, me1, me5, me1, me1],
    [me5, me1, me1, me1, me5, me1, me1, me1],
    [me1, me1, me1, me5, me1, me1, me1, me5],
    [me1, me1, me5, me1, me1, me1, me5, me1],
    [me1, me5, me1, me1, me1, me5, me1, me1],
    [me5, me1, me1, me1, me5, me1, me1, me1]
  ]);

  const ox1 = '#3f1a04', ox2 = '#7c2d12', ox3 = '#475569', ox4 = '#64748b';
  addPreset('metal', 3, 'Metal Oxidado', [
    [ox3, ox3, ox2, ox3, ox3, ox3, ox3, ox3],
    [ox3, ox2, ox1, ox2, ox3, ox3, ox3, ox3],
    [ox3, ox3, ox2, ox3, ox3, ox3, ox2, ox3],
    [ox3, ox3, ox3, ox3, ox3, ox2, ox1, ox2],
    [ox3, ox3, ox3, ox3, ox3, ox3, ox2, ox3],
    [ox3, ox3, ox3, ox3, ox3, ox3, ox3, ox3],
    [ox3, ox3, ox3, ox3, ox3, ox3, ox3, ox3],
    [ox3, ox3, ox3, ox3, ox3, ox3, ox3, ox3]
  ]);

  const cp1 = '#0F3D34', cp2 = '#1e293b', cp3 = '#3b82f6', cp4 = '#06b6d4';
  addPreset('metal', 4, 'Circuito Sci-Fi', [
    [cp1, cp1, cp1, cp1, cp1, cp1, cp1, cp1],
    [cp1, cp3, cp3, cp3, cp3, cp3, cp3, cp1],
    [cp1, cp3, cp4, cp3, cp3, cp4, cp3, cp1],
    [cp1, cp3, cp3, cp3, cp3, cp3, cp3, cp1],
    [cp1, cp1, cp1, cp1, cp1, cp1, cp1, cp1],
    [cp1, cp3, cp3, cp3, cp3, cp3, cp3, cp1],
    [cp1, cp3, cp3, cp3, cp3, cp3, cp3, cp1],
    [cp1, cp1, cp1, cp1, cp1, cp1, cp1, cp1]
  ]);

  // 7. LAVA (lava)
  const lav1 = '#450a0a', lav2 = '#7f1d1d', lav3 = '#991b1b', lav4 = '#dc2626', lav5 = '#f97316', lav6 = '#facc15';
  addPreset('lava', 1, 'Flujo de Lava', [
    [lav1, lav1, lav1, lav1, lav1, lav1, lav1, lav1],
    [lav1, lav5, lav6, lav5, lav1, lav1, lav1, lav1],
    [lav1, lav6, lav6, lav6, lav1, lav1, lav5, lav1],
    [lav1, lav5, lav6, lav5, lav1, lav5, lav6, lav5],
    [lav1, lav1, lav1, lav1, lav1, lav1, lav1, lav1],
    [lav1, lav1, lav1, lav1, lav1, lav5, lav6, lav5],
    [lav1, lav5, lav1, lav1, lav1, lav6, lav6, lav6],
    [lav1, lav1, lav1, lav1, lav1, lav5, lav6, lav5]
  ]);

  const mag1 = '#1c1917', mag2 = '#292524', mag3 = '#7c2d12', mag4 = '#ea580c';
  addPreset('lava', 2, 'Magma Petrificado', [
    [mag1, mag1, mag1, mag3, mag1, mag1, mag1, mag3],
    [mag1, mag1, mag3, mag4, mag3, mag1, mag3, mag4],
    [mag1, mag1, mag1, mag3, mag1, mag1, mag1, mag3],
    [mag1, mag1, mag1, mag1, mag1, mag1, mag1, mag1],
    [mag1, mag1, mag1, mag3, mag1, mag1, mag1, mag3],
    [mag1, mag1, mag3, mag4, mag3, mag1, mag3, mag4],
    [mag1, mag1, mag1, mag3, mag1, mag1, mag1, mag3],
    [mag1, mag1, mag1, mag1, mag1, mag1, mag1, mag1]
  ]);

  addPreset('lava', 3, 'Lava Burbujeante', [
    [lav1, lav1, lav1, lav1, lav1, lav1, lav1, lav1],
    [lav1, lav6, lav6, lav1, lav1, lav6, lav6, lav1],
    [lav1, lav6, lav6, lav1, lav1, lav6, lav6, lav1],
    [lav1, lav1, lav1, lav1, lav1, lav1, lav1, lav1],
    [lav1, lav1, lav1, lav1, lav1, lav1, lav1, lav1],
    [lav1, lav6, lav6, lav1, lav1, lav6, lav6, lav1],
    [lav1, lav6, lav6, lav1, lav1, lav6, lav6, lav1],
    [lav1, lav1, lav1, lav1, lav1, lav1, lav1, lav1]
  ]);

  const ce1 = '#0c0a09', ce2 = '#1c1917', ce3 = '#ef4444', ce4 = '#f97316';
  addPreset('lava', 4, 'Ceniza Activa', [
    [ce2, ce2, ce2, ce2, ce2, ce2, ce2, ce2],
    [ce2, ce3, ce2, ce2, ce2, ce3, ce2, ce2],
    [ce2, ce2, ce4, ce2, ce2, ce2, ce4, ce2],
    [ce2, ce2, ce2, ce2, ce2, ce2, ce2, ce2],
    [ce2, ce2, ce2, ce2, ce2, ce2, ce2, ce2],
    [ce2, ce2, ce3, ce2, ce2, ce2, ce3, ce2],
    [ce2, ce2, ce2, ce4, ce2, ce2, ce2, ce4],
    [ce2, ce2, ce2, ce2, ce2, ce2, ce2, ce2]
  ]);

  // 8. FANTASÍA (fantasy)
  const fa1 = '#0F3D34', fa2 = '#102419', fa3 = '#C8A96A', fa4 = '#e2c992', fa5 = '#f4e8cb';
  addPreset('fantasy', 1, 'Fuego Mágico', [
    [fa1, fa1, fa1, fa1, fa1, fa1, fa1, fa1],
    [fa1, fa3, fa4, fa3, fa1, fa1, fa1, fa1],
    [fa1, fa4, fa5, fa4, fa1, fa1, fa3, fa1],
    [fa1, fa3, fa4, fa3, fa1, fa3, fa4, fa3],
    [fa1, fa1, fa1, fa1, fa1, fa4, fa5, fa4],
    [fa1, fa1, fa1, fa3, fa1, fa3, fa4, fa3],
    [fa1, fa1, fa3, fa4, fa3, fa1, fa1, fa1],
    [fa1, fa1, fa1, fa1, fa1, fa1, fa1, fa1]
  ]);

  const cry1 = '#047857', cry2 = '#10b981', cry3 = '#34d399', cry4 = '#a7f3d0', cry5 = '#ffffff';
  addPreset('fantasy', 2, 'Cristal Celestial', [
    [cry4, cry3, cry3, cry3, cry4, cry3, cry3, cry3],
    [cry3, cry2, cry2, cry1, cry3, cry2, cry2, cry1],
    [cry3, cry2, cry5, cry1, cry3, cry2, cry5, cry1],
    [cry1, cry1, cry1, cry1, cry1, cry1, cry1, cry1],
    [cry4, cry3, cry3, cry3, cry4, cry3, cry3, cry3],
    [cry3, cry2, cry2, cry1, cry3, cry2, cry2, cry1],
    [cry3, cry2, cry5, cry1, cry3, cry2, cry5, cry1],
    [cry1, cry1, cry1, cry1, cry1, cry1, cry1, cry1]
  ]);

  const shd1 = '#030712', shd2 = '#111827', shd3 = '#1f2937', shd4 = '#311042', shd5 = '#581c87';
  addPreset('fantasy', 3, 'Éter de Sombras', [
    [shd3, shd3, shd4, shd3, shd3, shd4, shd3, shd3],
    [shd3, shd1, shd3, shd3, shd1, shd3, shd3, shd1],
    [shd4, shd3, shd2, shd1, shd4, shd3, shd2, shd1],
    [shd3, shd3, shd1, shd3, shd3, shd1, shd3, shd3],
    [shd3, shd3, shd4, shd3, shd3, shd4, shd3, shd3],
    [shd3, shd1, shd3, shd3, shd1, shd3, shd3, shd1],
    [shd4, shd3, shd2, shd1, shd4, shd3, shd2, shd1],
    [shd3, shd3, shd1, shd3, shd3, shd1, shd3, shd3]
  ]);

  const fd1 = '#14532d', fd2 = '#166534', fd3 = '#854d0e', fd4 = '#a16207', fd5 = '#fef08a';
  addPreset('fantasy', 4, 'Bosque de Hadas', [
    [fd1, fd1, fd1, fd5, fd1, fd1, fd1, fd1],
    [fd1, fd2, fd1, fd1, fd1, fd2, fd1, fd1],
    [fd1, fd1, fd1, fd1, fd1, fd1, fd5, fd1],
    [fd1, fd1, fd2, fd1, fd1, fd1, fd1, fd1],
    [fd3, fd3, fd3, fd3, fd3, fd3, fd3, fd3],
    [fd4, fd4, fd4, fd4, fd4, fd4, fd4, fd4],
    [fd1, fd1, fd1, fd1, fd1, fd5, fd1, fd1],
    [fd1, fd1, fd2, fd1, fd1, fd1, fd1, fd1]
  ]);

  // 9. SCI-FI (scifi)
  const sc1 = '#0F3D34', sc2 = '#1e293b', sc3 = '#334155', sc4 = '#475569', sc5 = '#38bdf8';
  addPreset('scifi', 1, 'Panel de Nave', [
    [sc4, sc4, sc4, sc4, sc4, sc4, sc4, sc4],
    [sc4, sc2, sc2, sc2, sc4, sc2, sc2, sc2],
    [sc4, sc2, sc5, sc2, sc4, sc2, sc5, sc2],
    [sc4, sc2, sc2, sc2, sc4, sc2, sc2, sc2],
    [sc4, sc4, sc4, sc4, sc4, sc4, sc4, sc4],
    [sc4, sc2, sc2, sc2, sc4, sc2, sc2, sc2],
    [sc4, sc2, sc2, sc2, sc4, sc2, sc2, sc2],
    [sc4, sc4, sc4, sc4, sc4, sc4, sc4, sc4]
  ]);

  const dt1 = '#022c22', dt2 = '#059669', dt3 = '#34d399', dt4 = '#ffffff';
  addPreset('scifi', 2, 'Matriz de Datos', [
    [dt1, dt2, dt1, dt1, dt1, dt2, dt1, dt1],
    [dt1, dt3, dt2, dt1, dt1, dt3, dt2, dt1],
    [dt1, dt4, dt3, dt2, dt1, dt4, dt3, dt2],
    [dt1, dt1, dt1, dt1, dt1, dt1, dt1, dt1],
    [dt1, dt1, dt1, dt2, dt1, dt1, dt1, dt2],
    [dt1, dt2, dt1, dt3, dt2, dt1, dt2, dt3],
    [dt2, dt3, dt2, dt4, dt3, dt2, dt3, dt4],
    [dt1, dt1, dt1, dt1, dt1, dt1, dt1, dt1]
  ]);

  const pl1 = '#1e1b4b', pl2 = '#311042', pl3 = '#d946ef', pl4 = '#06b6d4', pl5 = '#ffffff';
  addPreset('scifi', 3, 'Núcleo de Plasma', [
    [pl1, pl1, pl1, pl1, pl1, pl1, pl1, pl1],
    [pl1, pl3, pl3, pl4, pl4, pl3, pl3, pl1],
    [pl1, pl3, pl5, pl5, pl5, pl5, pl3, pl1],
    [pl1, pl4, pl5, pl5, pl5, pl5, pl4, pl1],
    [pl1, pl4, pl5, pl5, pl5, pl5, pl4, pl1],
    [pl1, pl3, pl5, pl5, pl5, pl5, pl3, pl1],
    [pl1, pl3, pl3, pl4, pl4, pl3, pl3, pl1],
    [pl1, pl1, pl1, pl1, pl1, pl1, pl1, pl1]
  ]);

  const cy1 = '#180026', cy2 = '#f43f5e', cy3 = '#06b6d4', cy4 = '#d946ef';
  addPreset('scifi', 4, 'Neon Cyberpunk', [
    [cy1, cy1, cy1, cy1, cy1, cy1, cy1, cy1],
    [cy1, cy2, cy2, cy1, cy1, cy3, cy3, cy1],
    [cy1, cy2, cy4, cy2, cy1, cy3, cy4, cy3],
    [cy1, cy1, cy1, cy1, cy1, cy1, cy1, cy1],
    [cy1, cy1, cy1, cy1, cy1, cy1, cy1, cy1],
    [cy1, cy3, cy3, cy1, cy1, cy2, cy2, cy1],
    [cy1, cy3, cy4, cy3, cy1, cy2, cy4, cy2],
    [cy1, cy1, cy1, cy1, cy1, cy1, cy1, cy1]
  ]);

  // 10. RETRO (retro)
  const gb1 = '#0f380f', gb2 = '#306230', gb3 = '#8bac0f', gb4 = '#9bbc0f';
  addPreset('retro', 1, 'GameBoy DMG', [
    [gb1, gb1, gb1, gb1, gb1, gb1, gb1, gb1],
    [gb1, gb3, gb4, gb3, gb1, gb1, gb1, gb1],
    [gb1, gb4, gb4, gb4, gb1, gb1, gb3, gb1],
    [gb1, gb3, gb4, gb3, gb1, gb3, gb4, gb3],
    [gb1, gb1, gb1, gb1, gb1, gb4, gb4, gb4],
    [gb1, gb1, gb1, gb3, gb1, gb3, gb4, gb3],
    [gb1, gb1, gb3, gb4, gb3, gb1, gb1, gb1],
    [gb1, gb1, gb1, gb1, gb1, gb1, gb1, gb1]
  ]);

  const nes1 = '#fc9838', nes2 = '#f83800', nes3 = '#0044ff', nes4 = '#ffffff';
  addPreset('retro', 2, 'NES Clásico', [
    [nes3, nes3, nes3, nes3, nes3, nes3, nes3, nes3],
    [nes3, nes2, nes1, nes2, nes3, nes3, nes3, nes3],
    [nes2, nes1, nes4, nes1, nes3, nes3, nes2, nes3],
    [nes3, nes2, nes1, nes2, nes3, nes2, nes1, nes2],
    [nes3, nes3, nes3, nes3, nes3, nes1, nes4, nes1],
    [nes3, nes3, nes3, nes2, nes3, nes2, nes1, nes2],
    [nes3, nes3, nes2, nes1, nes2, nes3, nes3, nes3],
    [nes3, nes3, nes3, nes3, nes3, nes3, nes3, nes3]
  ]);

  const cga1 = '#000000', cga2 = '#55ffff', cga3 = '#ff55ff', cga4 = '#ffffff';
  addPreset('retro', 3, 'CGA Retro', [
    [cga1, cga2, cga1, cga1, cga1, cga3, cga1, cga1],
    [cga2, cga4, cga2, cga1, cga3, cga4, cga3, cga1],
    [cga1, cga2, cga1, cga1, cga1, cga3, cga1, cga1],
    [cga1, cga1, cga1, cga1, cga1, cga1, cga1, cga1],
    [cga1, cga1, cga1, cga3, cga1, cga1, cga1, cga2],
    [cga1, cga3, cga1, cga4, cga3, cga1, cga3, cga4],
    [cga1, cga1, cga1, cga3, cga1, cga1, cga1, cga2],
    [cga1, cga1, cga1, cga1, cga1, cga1, cga1, cga1]
  ]);

  const tx1 = '#0000ff', tx2 = '#ff0000', tx3 = '#ffff00', tx4 = '#ffffff';
  addPreset('retro', 4, 'Teletexto', [
    [tx1, tx1, tx2, tx2, tx3, tx3, tx4, tx4],
    [tx1, tx1, tx2, tx2, tx3, tx3, tx4, tx4],
    [tx2, tx2, tx3, tx3, tx4, tx4, tx1, tx1],
    [tx2, tx2, tx3, tx3, tx4, tx4, tx1, tx1],
    [tx3, tx3, tx4, tx4, tx1, tx1, tx2, tx2],
    [tx3, tx3, tx4, tx4, tx1, tx1, tx2, tx2],
    [tx4, tx4, tx1, tx1, tx2, tx2, tx3, tx3],
    [tx4, tx4, tx1, tx1, tx2, tx2, tx3, tx3]
  ]);

  // 11. EFECTOS (effects)
  const ru1 = '#111827', ru2 = '#374151', ru3 = '#9ca3af', ru4 = '#f3f4f6';
  addPreset('effects', 1, 'Ruido Analógico', [
    [ru1, ru3, ru2, ru4, ru1, ru2, ru4, ru3],
    [ru4, ru2, ru1, ru3, ru3, ru4, ru1, ru2],
    [ru2, ru4, ru3, ru1, ru4, ru1, ru3, ru2],
    [ru3, ru1, ru4, ru2, ru2, ru3, ru2, ru1],
    [ru1, ru3, ru2, ru4, ru1, ru2, ru4, ru3],
    [ru4, ru2, ru1, ru3, ru3, ru4, ru1, ru2],
    [ru2, ru4, ru3, ru1, ru4, ru1, ru3, ru2],
    [ru3, ru1, ru4, ru2, ru2, ru3, ru2, ru1]
  ]);

  const tv1 = '#1f2937', tv2 = '#e5e7eb';
  addPreset('effects', 2, 'Estática de TV', [
    [tv1, tv2, tv1, tv2, tv1, tv2, tv1, tv2],
    [tv2, tv1, tv2, tv1, tv2, tv1, tv2, tv1],
    [tv1, tv2, tv1, tv2, tv1, tv2, tv1, tv2],
    [tv2, tv1, tv2, tv1, tv2, tv1, tv2, tv1],
    [tv1, tv2, tv1, tv2, tv1, tv2, tv1, tv2],
    [tv2, tv1, tv2, tv1, tv2, tv1, tv2, tv1],
    [tv1, tv2, tv1, tv2, tv1, tv2, tv1, tv2],
    [tv2, tv1, tv2, tv1, tv2, tv1, tv2, tv1]
  ]);

  const ne1 = '#18000c', ne2 = '#f43f5e', ne3 = '#fda4af', ne4 = '#ffffff';
  addPreset('effects', 3, 'Luz de Neón', [
    [ne1, ne1, ne1, ne1, ne1, ne1, ne1, ne1],
    [ne1, ne2, ne2, ne2, ne2, ne2, ne2, ne1],
    [ne1, ne2, ne3, ne3, ne3, ne3, ne2, ne1],
    [ne1, ne2, ne3, ne4, ne4, ne3, ne2, ne1],
    [ne1, ne2, ne3, ne4, ne4, ne3, ne2, ne1],
    [ne1, ne2, ne3, ne3, ne3, ne3, ne2, ne1],
    [ne1, ne2, ne2, ne2, ne2, ne2, ne2, ne1],
    [ne1, ne1, ne1, ne1, ne1, ne1, ne1, ne1]
  ]);

  const gl1 = '#000000', gl2 = '#ff0055', gl3 = '#00ffcc', gl4 = '#ffffff';
  addPreset('effects', 4, 'Efecto Glitch', [
    [gl1, gl1, gl2, gl2, gl1, gl1, gl3, gl3],
    [gl1, gl1, gl2, gl4, gl1, gl1, gl3, gl4],
    [gl2, gl2, gl1, gl1, gl3, gl3, gl1, gl1],
    [gl3, gl3, gl1, gl1, gl2, gl2, gl1, gl1],
    [gl1, gl1, gl3, gl3, gl1, gl1, gl2, gl2],
    [gl1, gl1, gl3, gl4, gl1, gl1, gl2, gl4],
    [gl3, gl3, gl1, gl1, gl2, gl2, gl1, gl1],
    [gl2, gl2, gl1, gl1, gl3, gl3, gl1, gl1]
  ]);

  return list;
};

export default function PatternsModal({
  isOpen,
  onClose,
  project,
  currentFrameId,
  currentLayerId,
  selection,
  onUpdatePixels,
  onStartHistoryAction,
  onApplyPatternStamp,
  language = 'es',
}: PatternsModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('nature');
  const [presets, setPresets] = useState<PatternItem[]>([]);
  const [customPatterns, setCustomPatterns] = useState<PatternItem[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<PatternItem | null>(null);
  const [saveName, setSaveName] = useState('');
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [showApplyChoiceDialog, setShowApplyChoiceDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const previewCanvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  useEffect(() => {
    setPresets(generatePresetPatterns());
  }, []);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('resprite_custom_patterns');
      if (stored) {
        try {
          setCustomPatterns(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse custom patterns', e);
        }
      } else {
        setCustomPatterns([]);
      }
    }
  }, [isOpen]);

  // Set first selected pattern inside category when activeCategory changes
  useEffect(() => {
    const list = activeCategory === 'custom' 
      ? customPatterns 
      : presets.filter(p => p.category === activeCategory);
    if (list.length > 0) {
      setSelectedPattern(list[0]);
    } else {
      setSelectedPattern(null);
    }
  }, [activeCategory, presets, customPatterns]);

  // Handle rendering of repeating 3x3 tiles on canvas
  useEffect(() => {
    if (!selectedPattern) return;
    
    // Render the main active visual preview canvas
    const canvas = document.getElementById('selected-pattern-preview-canvas') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const { pixels, width, height } = selectedPattern;
        const zoom = 5; // size of each pixel

        // Render 3x3 tiles
        for (let tileY = 0; tileY < 4; tileY++) {
          for (let tileX = 0; tileX < 4; tileX++) {
            const startX = tileX * width * zoom;
            const startY = tileY * height * zoom;

            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const color = pixels[y * width + x] || 'transparent';
                ctx.fillStyle = color;
                ctx.fillRect(startX + x * zoom, startY + y * zoom, zoom, zoom);
              }
            }
          }
        }
      }
    }
  }, [selectedPattern]);

  // Handle preview canvases for all items in current category
  useEffect(() => {
    const list = activeCategory === 'custom'
      ? customPatterns
      : presets.filter(p => p.category === activeCategory);

    list.forEach(p => {
      const canvas = previewCanvasRefs.current[p.id];
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const { pixels, width, height } = p;
          const zoom = 3; // small preview zoom

          // Render 2x2 tiles to show tiling
          for (let tileY = 0; tileY < 2; tileY++) {
            for (let tileX = 0; tileX < 2; tileX++) {
              const startX = tileX * width * zoom;
              const startY = tileY * height * zoom;

              for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                  const color = pixels[y * width + x] || 'transparent';
                  ctx.fillStyle = color;
                  ctx.fillRect(startX + x * zoom, startY + y * zoom, zoom, zoom);
                }
              }
            }
          }
        }
      }
    });
  }, [activeCategory, presets, customPatterns]);

  if (!isOpen) return null;

  const currentCategoryPatterns = activeCategory === 'custom'
    ? customPatterns
    : presets.filter(p => p.category === activeCategory);

  const handleFillPatternDirect = () => {
    if (!selectedPattern) return;
    const framePixels = project.pixels[currentFrameId];
    const layerPixels = framePixels?.[currentLayerId];
    if (!layerPixels) return;

    onStartHistoryAction?.();

    const updated = { ...project.pixels };
    const nextPixels = [...layerPixels];

    const patW = selectedPattern.width;
    const patH = selectedPattern.height;

    for (let y = 0; y < project.height; y++) {
      for (let x = 0; x < project.width; x++) {
        const canvasIdx = y * project.width + x;

        // If there's an active selection, only fill selected pixels
        if (selection.active && !selection.pixels[canvasIdx]) {
          continue;
        }

        // Map canvas coordinates to pattern coordinate space
        const patX = x % patW;
        const patY = y % patH;
        const color = selectedPattern.pixels[patY * patW + patX];
        if (color) {
          nextPixels[canvasIdx] = color;
        }
      }
    }

    updated[currentFrameId][currentLayerId] = nextPixels;
    onUpdatePixels(updated, false);
    onClose();
  };

  const handleSaveCurrentAsPattern = () => {
    const framePixels = project.pixels[currentFrameId];
    const layerPixels = framePixels?.[currentLayerId];
    if (!layerPixels) return;

    const finalName = saveName.trim() || `Patrón Personalizado ${customPatterns.length + 1}`;
    
    // We can crop the pattern size to the selection bounding box if active, otherwise full screen
    let startX = 0, startY = 0;
    let cropW = project.width;
    let cropH = project.height;

    if (selection.active) {
      let minX = project.width, maxX = -1, minY = project.height, maxY = -1;
      let hasSel = false;
      for (let y = 0; y < project.height; y++) {
        for (let x = 0; x < project.width; x++) {
          if (selection.pixels[y * project.width + x]) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            hasSel = true;
          }
        }
      }
      if (hasSel) {
        startX = minX;
        startY = minY;
        cropW = maxX - minX + 1;
        cropH = maxY - minY + 1;
      }
    }

    // Capture the cropped rectangle colors
    const pixels: string[] = [];
    for (let y = startY; y < startY + cropH; y++) {
      for (let x = startX; x < startX + cropW; x++) {
        const color = layerPixels[y * project.width + x] || '';
        pixels.push(color);
      }
    }

    const newPattern: PatternItem = {
      id: `custom-${Date.now()}`,
      name: finalName,
      category: 'custom',
      pixels,
      width: cropW,
      height: cropH
    };

    const nextCustom = [...customPatterns, newPattern];
    setCustomPatterns(nextCustom);
    localStorage.setItem('resprite_custom_patterns', JSON.stringify(nextCustom));
    setSaveName('');
    setIsSavingCustom(false);
    setActiveCategory('custom');
    setSelectedPattern(newPattern);
  };

  const handleDeleteCustomPatternClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  const confirmDeleteCustomPattern = () => {
    if (!deleteTargetId) return;
    const nextCustom = customPatterns.filter(p => p.id !== deleteTargetId);
    setCustomPatterns(nextCustom);
    localStorage.setItem('resprite_custom_patterns', JSON.stringify(nextCustom));
    if (selectedPattern?.id === deleteTargetId) {
      setSelectedPattern(nextCustom[0] || null);
    }
    setDeleteTargetId(null);
  };

  const getPatternName = (p: PatternItem) => (p.nameKey ? translate(p.nameKey as any, language as any) : p.name);

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs" id="patterns-modal-container">
      <div className="bg-[#102419] border border-[#102419] rounded-2xl w-full max-w-4xl h-[620px] flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#102419] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#C8A96A]" />
            <div>
              <h3 className="text-sm font-bold text-white leading-none">{translate('patternsModal.title', language as any)}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">{translate('patternsModal.subtitle', language as any)}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[#102419] rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body layout */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          
          {/* Left Categories Sidebar */}
          <div className="w-52 border-r border-[#102419] bg-[#102419]/80 py-3 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-0.5 px-2">
              <span className="text-[9px] font-extrabold text-slate-400 px-2.5 uppercase tracking-wider block mb-1">{translate('patternsModal.presets', language as any)}</span>
              {PRESET_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                    activeCategory === cat.id 
                      ? 'bg-[#102419] text-[#C8A96A] border border-[#C8A96A]/30' 
                      : 'hover:bg-[#102419] text-slate-300'
                  }`}
                >
                  <span>{translate(cat.nameKey as any, language as any)}</span>
                  <span className="text-[8px] opacity-60 font-mono">{translate('patternsModal.variationsCount', language as any, { count: 5 })}</span>
                </button>
              ))}

              <div className="h-px bg-[#102419] my-2" />
              
              <span className="text-[9px] font-extrabold text-slate-400 px-2.5 uppercase tracking-wider block mb-1">{translate('patternsModal.yourCreations', language as any)}</span>
              <button
                onClick={() => setActiveCategory('custom')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                  activeCategory === 'custom' 
                    ? 'bg-[#102419] text-[#C8A96A] border border-[#C8A96A]/30' 
                    : 'hover:bg-[#102419] text-slate-300'
                }`}
              >
                <span>{translate('patternsModal.saved', language as any)}</span>
                <span className="text-[8px] bg-[#102419] text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">{customPatterns.length}</span>
              </button>
            </div>

            {/* Save Pattern Quick Trigger */}
            <div className="px-3 pt-3">
              {!isSavingCustom ? (
                <button
                  onClick={() => setIsSavingCustom(true)}
                  className="w-full py-2 bg-[#102419]/20 border border-[#C8A96A]/30 hover:bg-[#102419]/40 text-[#C8A96A] hover:text-white rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{translate('patternsModal.captureSelection', language as any)}</span>
                </button>
              ) : (
                <div className="p-2 bg-[#102419] border border-[#C8A96A]/30 rounded-xl space-y-2 animate-in slide-in-from-bottom-2 duration-150">
                  <span className="text-[9px] text-[#C8A96A] font-extrabold block">{translate('patternsModal.newPattern', language as any)}</span>
                  <input
                    type="text"
                    placeholder={translate('patternsModal.patternNamePlaceholder', language as any)}
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    className="w-full text-[10px] px-2 py-1.5 rounded bg-[#102419] border border-[#102419] text-slate-200 focus:outline-none focus:border-[#C8A96A]"
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={handleSaveCurrentAsPattern}
                      className="flex-1 py-1 bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] text-white rounded text-[9px] font-bold transition"
                    >
                      {translate('common.save', language as any)}
                    </button>
                    <button
                      onClick={() => setIsSavingCustom(false)}
                      className="px-2 py-1 bg-[#102419] hover:bg-[#102419] text-slate-400 rounded text-[9px]"
                    >
                      X
                    </button>
                  </div>
                  {selection.active ? (
                    <p className="text-[7.5px] text-slate-400 leading-tight">{translate('patternsModal.captureSelectionDesc', language as any, {
                      bbox: (() => {
                        let minX = project.width, maxX = -1, minY = project.height, maxY = -1;
                        let hasSel = false;
                        selection.pixels.forEach((val, idx) => {
                          if (val) {
                            const x = idx % project.width;
                            const y = Math.floor(idx / project.width);
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                            hasSel = true;
                          }
                        });
                        return hasSel ? `${maxX - minX + 1}x${maxY - minY + 1}` : '---';
                      })()
                    })}</p>
                  ) : (
                    <p className="text-[7.5px] text-slate-400 leading-tight">{translate('patternsModal.captureLayerDesc', language as any, { size: `${project.width}x${project.height}` })}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Central grid & Right detailed preview layout */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Grid of variations */}
            <div className="flex-1 p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  {activeCategory === 'custom' 
                    ? translate('patternsModal.yourPatterns', language as any) 
                    : translate('patternsModal.categoryVariations', language as any, { cat: translate(PRESET_CATEGORIES.find(c => c.id === activeCategory)?.nameKey as any || '', language as any) })}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">{translate('patternsModal.itemsCount', language as any, { count: currentCategoryPatterns.length })}</span>
              </div>

              {currentCategoryPatterns.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-[#102419] rounded-2xl p-6 bg-[#102419]/10">
                  <p className="text-xs text-slate-400">{translate('patternsModal.noPatterns', language as any)}</p>
                  <p className="text-[10px] text-slate-500 mt-2 max-w-xs">{translate('patternsModal.noPatternsDesc', language as any)}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentCategoryPatterns.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPattern(p)}
                      className={`relative group p-2.5 rounded-xl border cursor-pointer transition flex flex-col items-center justify-center ${
                        selectedPattern?.id === p.id 
                          ? 'bg-[#102419] border-[#C8A96A] shadow-md' 
                          : 'bg-[#102419]/60 border-[#102419] hover:border-[#102419] hover:bg-[#102419]'
                      }`}
                    >
                      {/* Repeating Canvas preview */}
                      <div className="w-[50px] h-[50px] rounded bg-[#102419] border border-[#102419] flex items-center justify-center overflow-hidden mb-2">
                        <canvas
                          ref={el => { previewCanvasRefs.current[p.id] = el; }}
                          width={48}
                          height={48}
                          className="image-render-pixel"
                        />
                      </div>

                      <div className="text-center w-full min-w-0">
                        <p className="text-[10px] font-bold text-slate-200 truncate leading-tight group-hover:text-white">{getPatternName(p)}</p>
                        <p className="text-[8px] text-slate-400 font-mono mt-0.5">{p.width}x{p.height} px</p>
                      </div>

                      {/* Floating delete button for custom ones */}
                      {p.category === 'custom' && (
                        <button
                          onClick={(e) => handleDeleteCustomPatternClick(p.id, e)}
                          className="absolute top-1 right-1 p-1 bg-rose-950/90 hover:bg-rose-800 border border-rose-800/40 rounded text-rose-300 opacity-60 group-hover:opacity-100 transition-all hover:scale-110"
                          title={translate('patternsModal.deletePatternTooltip', language as any)}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Detailed Preview Box */}
            <div className="w-64 border-l border-[#102419] bg-[#102419]/80 p-5 flex flex-col justify-between overflow-y-auto">
              {selectedPattern ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] text-[#C8A96A] font-bold uppercase tracking-wider font-mono">{translate('patternsModal.pattern2D', language as any)}</span>
                    <h4 className="text-xs font-bold text-slate-200 truncate mt-1">{getPatternName(selectedPattern)}</h4>
                  </div>

                  {/* Canvas Render Box (Tiled 4x4) */}
                  <div className="w-full h-44 rounded-xl bg-[#102419] border border-[#102419] flex items-center justify-center overflow-hidden relative group">
                    <canvas
                      id="selected-pattern-preview-canvas"
                      width={160}
                      height={160}
                      className="image-render-pixel"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-[#102419]/90 px-2 py-1 text-[8px] text-slate-400 text-center font-mono select-none pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      {translate('patternsModal.sample4x4', language as any)}
                    </div>
                  </div>

                  <div className="space-y-2 bg-[#102419]/50 p-3 rounded-lg border border-[#102419]">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                      <span>{translate('patternsModal.width', language as any)}</span>
                      <span className="text-slate-200 font-bold">{selectedPattern.width}px</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                      <span>{translate('patternsModal.height', language as any)}</span>
                      <span className="text-slate-200 font-bold">{selectedPattern.height}px</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                      <span>{translate('patternsModal.category', language as any)}</span>
                      <span className="text-slate-200 font-bold capitalize">
                        {selectedPattern.category === 'custom' 
                          ? translate('patternsModal.yourCreations', language as any) 
                          : translate(PRESET_CATEGORIES.find(c => c.id === selectedPattern.category)?.nameKey as any || '', language as any)}
                      </span>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 leading-normal">
                    {selection.active 
                      ? translate('patternsModal.fillSelectionDesc', language as any) 
                      : translate('patternsModal.fillLayerDesc', language as any)}
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                  <p className="text-[10px]">{translate('patternsModal.selectVariationPrompt', language as any)}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-4 border-t border-[#102419] space-y-2">
                <button
                  onClick={() => setShowApplyChoiceDialog(true)}
                  disabled={!selectedPattern}
                  className="w-full py-2.5 bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{selection.active ? translate('patternsModal.fillSelectionBtn', language as any) : translate('patternsModal.applyPatternBtn', language as any)}</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2 bg-[#102419] hover:bg-[#102419] text-slate-300 rounded-xl text-xs font-medium transition"
                >
                  {translate('common.cancel', language as any)}
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* --- OPTION DIALOG (ASK FOR SCALING / STAMP OR DIRECT FILL) --- */}
        {showApplyChoiceDialog && selectedPattern && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-[#102419] border border-[#102419] rounded-2xl p-6 max-w-md w-full text-slate-200 shadow-2xl relative space-y-4">
              <div className="flex items-center gap-2 border-b border-[#102419] pb-3">
                <Check className="w-5 h-5 text-[#C8A96A]" />
                <h4 className="text-sm font-bold text-white">{translate('patternsModal.insertMethodTitle', language as any, { name: getPatternName(selectedPattern) })}</h4>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {translate('patternsModal.insertMethodDesc', language as any)}
              </p>

              <div className="grid grid-cols-1 gap-3.5 pt-2">
                {/* Option 1: Direct Tile Fill */}
                <button
                  onClick={() => {
                    handleFillPatternDirect();
                    setShowApplyChoiceDialog(false);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-[#102419]/50 border border-[#102419] hover:border-[#C8A96A] hover:bg-[#102419] transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#102419] flex items-center justify-center text-[#C8A96A] font-bold shrink-0">
                      A
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white group-hover:text-[#C8A96A] transition-colors block">{translate('patternsModal.fillAllTitle', language as any)}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{translate('patternsModal.fillAllDesc', language as any, { target: selection.active ? translate('patternsModal.targetSelection', language as any) : translate('patternsModal.targetLayer', language as any) })}</span>
                    </div>
                  </div>
                </button>

                {/* Option 2: Stamp */}
                <button
                  onClick={() => {
                    if (onApplyPatternStamp) {
                      onApplyPatternStamp({
                        ...selectedPattern,
                        name: getPatternName(selectedPattern),
                      });
                    }
                    setShowApplyChoiceDialog(false);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-xl bg-[#102419]/50 border border-[#102419] hover:border-[#C8A96A] hover:bg-[#102419] transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#102419] flex items-center justify-center text-[#C8A96A] font-bold shrink-0">
                      B
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white group-hover:text-[#C8A96A] transition-colors block">{translate('patternsModal.stampInteractiveTitle', language as any)}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{translate('patternsModal.stampInteractiveDesc', language as any)}</span>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowApplyChoiceDialog(false)}
                  className="px-4 py-1.5 bg-[#102419] hover:bg-[#102419] rounded-lg text-[11px] font-semibold text-slate-300 transition"
                >
                  {translate('patternsModal.back', language as any)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- CUSTOM DELETE PATTERN CONFIRMATION DIALOG --- */}
        {deleteTargetId && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-[#102419] border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full text-slate-200 shadow-2xl relative space-y-4 col">
              <div className="flex items-center gap-2 border-b border-[#102419] pb-3">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <h4 className="text-sm font-bold text-white">{translate('patternsModal.deletePatternTitle', language as any)}</h4>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {translate('patternsModal.deletePatternDesc', language as any)}
              </p>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setDeleteTargetId(null)}
                  className="px-4 py-1.5 bg-[#102419] hover:bg-[#102419] rounded-lg text-[11px] font-semibold text-slate-300 transition"
                >
                  {translate('common.cancel', language as any)}
                </button>
                <button
                  onClick={confirmDeleteCustomPattern}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-[11px] font-bold text-white shadow-md shadow-rose-950/50 transition"
                >
                  {translate('patternsModal.confirmDelete', language as any)}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
