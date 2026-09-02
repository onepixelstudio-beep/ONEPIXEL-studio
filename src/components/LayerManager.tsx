import React, { useState, useRef } from 'react';
import { 
  Eye, EyeOff, Lock, Unlock, Plus, Trash2, 
  Copy, ArrowUp, ArrowDown, Layers, Edit2, Check,
  Focus, Sliders, X, Pin
} from 'lucide-react';
import { Layer } from '../types';
import { translate, LanguageCode } from '../i18n';

interface LayerManagerProps {
  layers: Layer[];
  selectedLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onToggleStatic?: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onMergeDown: (id: string) => void;
  onReorderLayers?: (id: string, targetIdx: number) => void;
  onRenameLayer?: (id: string, newName: string) => void;
  onChangeBlendMode?: (id: string, blendMode: string) => void;
  language: LanguageCode;
}

const BLEND_MODES = [
  { id: 'normal', label: 'Normal' },
  { id: 'multiply', label: 'Multiplicar' },
  { id: 'screen', label: 'Trama' },
  { id: 'overlay', label: 'Superponer' },
  { id: 'darken', label: 'Oscurecer' },
  { id: 'lighten', label: 'Aclarar' },
  { id: 'color-dodge', label: 'Sobreexponer' }
];

function LayerManager({
  layers,
  selectedLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onToggleVisible,
  onToggleLocked,
  onToggleStatic,
  onChangeOpacity,
  onMoveLayer,
  onMergeDown,
  onReorderLayers,
  onRenameLayer,
  onChangeBlendMode,
  language
}: LayerManagerProps) {

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [soloLayerId, setSoloLayerId] = useState<string | null>(null);
  const prevVisibilityRef = useRef<Record<string, boolean>>({});

  const handleStartRename = (e: React.MouseEvent, layer: Layer, currentDisplayName: string) => {
    e.stopPropagation();
    setEditingLayerId(layer.id);
    setEditingName(currentDisplayName);
  };

  const handleSaveRename = (id: string) => {
    const trimmed = editingName.trim();
    if (trimmed && onRenameLayer) {
      onRenameLayer(id, trimmed);
    }
    setEditingLayerId(null);
  };

  const handleToggleSolo = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    if (soloLayerId === id) {
      // Desactivar aislamiento (Solo): restaurar visibilidad original de las capas
      const saved = prevVisibilityRef.current;
      layers.forEach(l => {
        const shouldBeVisible = saved[l.id] !== undefined ? saved[l.id] : true;
        if (l.visible !== shouldBeVisible) {
          onToggleVisible(l.id);
        }
      });
      prevVisibilityRef.current = {};
      setSoloLayerId(null);
    } else {
      // Activar aislamiento: guardar mapa de visibilidad si no había solo activo
      if (!soloLayerId) {
        const currentVis: Record<string, boolean> = {};
        layers.forEach(l => {
          currentVis[l.id] = l.visible;
        });
        prevVisibilityRef.current = currentVis;
      }
      
      // La capa destino pasa a visible y las demás a ocultas
      layers.forEach(l => {
        const shouldBeVisible = (l.id === id);
        if (l.visible !== shouldBeVisible) {
          onToggleVisible(l.id);
        }
      });
      setSoloLayerId(id);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLayerId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (!draggedLayerId || draggedLayerId === id) {
      setDragOverLayerId(null);
      setDropPosition(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const isTopHalf = relativeY < rect.height / 2;

    setDragOverLayerId(id);
    setDropPosition(isTopHalf ? 'before' : 'after');
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetId || !dropPosition) {
      resetDragState();
      return;
    }

    const fromIdx = layers.findIndex(l => l.id === draggedLayerId);
    let toIdx = layers.findIndex(l => l.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      resetDragState();
      return;
    }

    if (dropPosition === 'after') {
      toIdx = toIdx + 1;
    }

    if (fromIdx < toIdx) {
      toIdx = toIdx - 1;
    }

    if (fromIdx !== toIdx && onReorderLayers) {
      onReorderLayers(draggedLayerId, toIdx);
    }

    resetDragState();
  };

  const resetDragState = () => {
    setDraggedLayerId(null);
    setDragOverLayerId(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    resetDragState();
  };

  const getBlendModeLabel = (id: string) => {
    switch (id) {
      case 'normal': return translate('layers.blendNormal', language);
      case 'multiply': return translate('layers.blendMultiply', language);
      case 'screen': return translate('layers.blendScreen', language);
      case 'overlay': return translate('layers.blendOverlay', language);
      case 'darken': return translate('layers.blendDarken', language);
      case 'lighten': return translate('layers.blendLighten', language);
      case 'color-dodge': return translate('layers.blendColorDodge', language);
      default: return id.charAt(0).toUpperCase() + id.slice(1);
    }
  };

  return (
    <div className="bg-[#102419] border border-[#0F3D34] rounded-xl p-2 flex flex-col gap-2 text-slate-100 font-sans shadow-xl" id="layer-manager">
      
      {/* 1. Header with Title, Count & Add Layer */}
      <div className="flex justify-between items-center bg-[#030408] p-1.5 rounded-lg border border-[#0F3D34]">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#C8A96A]" />
          <span className="text-[11px] uppercase font-extrabold text-[#C8A96A] tracking-wider">
            {translate('layers.title', language)}
          </span>
          <span className="text-[10px] font-mono font-extrabold bg-[#0F3D34] text-[#C8A96A] px-1.5 py-0.5 rounded border border-[#C8A96A]/30">
            {layers.length}
          </span>
        </div>
        
        <button
          onClick={onAddLayer}
          className="flex items-center gap-1 px-2 py-1 bg-[#C8A96A] hover:bg-[#d8b97a] text-[#102419] rounded font-bold text-[11px] transition cursor-pointer shadow-md active:scale-95"
          title={translate('layers.addLayer', language)}
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>{translate('common.add', language)}</span>
        </button>
      </div>

      {/* 2. Layer List Container with Large Thumbnails & Inline Renaming */}
      <div 
        role="list"
        aria-label={translate('layers.title', language)}
        className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-0.5 scrollbar-thin"
        onDragLeave={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX >= rect.right ||
            e.clientY < rect.top ||
            e.clientY >= rect.bottom
          ) {
            setDragOverLayerId(null);
            setDropPosition(null);
          }
        }}
      >
        {layers.map((layer, index) => {
          const isSelected = layer.id === selectedLayerId;
          const isSoloed = soloLayerId === layer.id;
          const displayName = layer.name === 'Fondo' || layer.name === 'Background'
            ? translate('layers.background', language)
            : layer.name === 'Capa Base' || layer.name === 'Base Layer'
              ? translate('layers.baseLayer', language)
              : layer.name.startsWith('Capa') || layer.name.startsWith('Layer')
                ? translate('layers.defaultLayerName', language, { num: layer.name.replace(/\D/g, '') })
                : layer.name;

          const isDraggingThis = draggedLayerId === layer.id;
          const isDragOver = dragOverLayerId === layer.id;
          
          let dragOverBorderClass = '';
          if (isDragOver && dropPosition) {
            dragOverBorderClass = dropPosition === 'before'
              ? 'border-t-2 border-t-[#C8A96A]'
              : 'border-b-2 border-b-[#C8A96A]';
          }

          return (
            <div
              key={layer.id}
              role="listitem"
              aria-selected={isSelected}
              aria-label={`${translate('layers.title', language)} ${displayName}`}
              onClick={() => onSelectLayer(layer.id)}
              draggable={editingLayerId !== layer.id}
              onDragStart={(e) => handleDragStart(e, layer.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, layer.id)}
              onDrop={(e) => handleDrop(e, layer.id)}
              className={`flex items-center justify-between p-1.5 rounded-lg cursor-grab active:cursor-grabbing border transition-all ${
                isSelected 
                  ? 'bg-[#0F3D34] border-[#C8A96A] text-white shadow-md' 
                  : 'bg-[#030408]/60 border-[#0F3D34]/50 text-slate-300 hover:bg-[#0F3D34]/40 hover:text-white'
              } ${isDraggingThis ? 'opacity-30 border-dashed border-[#C8A96A]/60' : ''} ${dragOverBorderClass}`}
            >
              <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                {/* Index Badge */}
                <span className={`text-[9px] font-mono font-bold w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-[#C8A96A] text-black font-extrabold' : 'bg-white/10 text-slate-400'
                }`}>
                  {layers.length - index}
                </span>

                {/* Checkerboard Thumbnail Box */}
                <div 
                  className="w-8 h-8 rounded border border-white/20 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:6px_6px] bg-[#111] flex items-center justify-center shrink-0 shadow-inner relative overflow-hidden"
                  title={translate('layers.listTitle', language)}
                >
                  <Layers className={`w-4 h-4 ${isSelected ? 'text-[#C8A96A]' : 'text-slate-400'}`} />
                  {layer.blendMode && layer.blendMode !== 'normal' && (
                    <span className="absolute bottom-0 right-0 bg-black/80 text-[7px] text-[#C8A96A] font-mono px-0.5 leading-none font-bold">
                      {layer.blendMode.slice(0, 3).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Layer Name / Inline Edit */}
                {editingLayerId === layer.id ? (
                  <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveRename(layer.id);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setEditingLayerId(null);
                        }
                      }}
                      onBlur={() => handleSaveRename(layer.id)}
                      autoFocus
                      className="w-full bg-[#030408] border border-[#C8A96A] text-white px-1.5 py-0.5 rounded text-[11px] font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveRename(layer.id);
                      }}
                      className="p-1 text-emerald-400 hover:bg-emerald-950 rounded cursor-pointer"
                      title={translate('common.confirm', language)}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLayerId(null);
                      }}
                      className="p-1 text-rose-400 hover:bg-rose-950 rounded cursor-pointer"
                      title={translate('common.cancel', language)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="flex items-center gap-1.5 truncate flex-1 min-w-0 group cursor-pointer"
                    onDoubleClick={(e) => handleStartRename(e, layer, displayName)}
                  >
                    <span className="text-[11px] font-bold truncate leading-tight select-none">
                      {displayName}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleStartRename(e, layer, displayName)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-[#C8A96A] transition"
                      title={translate('common.edit', language)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Toggles (Visibility, Solo, Lock) */}
              <div 
                className="flex items-center gap-0.5 shrink-0 ml-1" 
                onClick={(e) => e.stopPropagation()}
                onDragStart={(e) => e.stopPropagation()}
                draggable={false}
              >
                {/* Solo button */}
                <button
                  onClick={(e) => handleToggleSolo(e, layer.id)}
                  className={`p-1 rounded transition cursor-pointer ${
                    isSoloed 
                      ? 'bg-[#C8A96A] text-[#102419] font-bold' 
                      : 'text-slate-500 hover:text-white hover:bg-white/10'
                  }`}
                  title={isSoloed ? translate('layers.showLayer', language) : translate('layers.hideLayer', language)}
                >
                  <Focus className="w-3.5 h-3.5" />
                </button>

                {/* Static (Fondo) button */}
                {onToggleStatic && (
                  <button
                    onClick={() => onToggleStatic(layer.id)}
                    className={`p-1 rounded transition cursor-pointer ${
                      layer.isStatic 
                        ? 'text-amber-400 bg-amber-400/20' 
                        : 'text-slate-600 hover:text-slate-300 hover:bg-white/10'
                    }`}
                    title={layer.isStatic ? translate('layers.staticLayer', language) : translate('layers.toggleStatic', language)}
                  >
                    <Pin className={`w-3.5 h-3.5 ${layer.isStatic ? 'rotate-45 fill-current' : ''}`} />
                  </button>
                )}

                {/* Visibility */}
                <button
                  onClick={() => onToggleVisible(layer.id)}
                  className={`p-1 rounded transition cursor-pointer ${
                    layer.visible 
                      ? 'text-[#C8A96A] hover:bg-[#C8A96A]/20' 
                      : 'text-slate-600 hover:bg-white/10'
                  }`}
                  title={layer.visible ? translate('layers.hideLayer', language) : translate('layers.showLayer', language)}
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                {/* Lock */}
                <button
                  onClick={() => onToggleLocked(layer.id)}
                  className={`p-1 rounded transition cursor-pointer ${
                    layer.locked 
                      ? 'text-rose-400 hover:bg-rose-500/20' 
                      : 'text-slate-600 hover:bg-white/10'
                  }`}
                  title={layer.locked ? translate('layers.unlockLayer', language) : translate('layers.lockLayer', language)}
                >
                  {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Selected Layer Detailed Controls (Blend Mode, Opacity & Action Bar) */}
      {selectedLayer && (
        <div className="p-2 bg-[#030408]/80 border border-[#0F3D34] rounded-lg flex flex-col gap-2">
          
          {/* Blend Mode & Opacity in one row */}
          <div className="grid grid-cols-2 gap-2">
            {/* Blend Mode */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase text-slate-400 font-bold font-mono">{translate('layers.blendMode', language)}</span>
              <select
                value={selectedLayer.blendMode || 'normal'}
                onChange={(e) => {
                  if (onChangeBlendMode) {
                    onChangeBlendMode(selectedLayer.id, e.target.value);
                  }
                }}
                className="bg-[#102419] border border-[#0F3D34] text-[#C8A96A] text-[10px] font-mono font-bold rounded px-1.5 py-1 focus:outline-none focus:border-[#C8A96A] cursor-pointer"
              >
                {BLEND_MODES.map(bm => (
                  <option key={bm.id} value={bm.id} className="bg-[#030408] text-white">
                    {getBlendModeLabel(bm.id)}
                  </option>
                ))}
              </select>
            </div>

            {/* Opacity */}
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                <span className="uppercase font-bold">{translate('layers.opacity', language)}</span>
                <span className="text-[#C8A96A] font-extrabold">{selectedLayer.opacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedLayer.opacity}
                onChange={(e) => onChangeOpacity(selectedLayer.id, Number(e.target.value))}
                className="w-full accent-[#C8A96A] h-2 bg-[#102419] rounded cursor-pointer mt-1"
              />
            </div>
          </div>

          {/* Quick Opacity Presets */}
          <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => onChangeOpacity(selectedLayer.id, pct)}
                className={`py-0.5 rounded border transition cursor-pointer ${
                  selectedLayer.opacity === pct 
                    ? 'bg-[#C8A96A] text-[#102419] font-bold border-[#C8A96A]' 
                    : 'bg-[#102419] border-[#0F3D34] text-slate-400 hover:text-white'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Productivity Action Buttons Bar */}
          <div className="grid grid-cols-5 gap-1 pt-1.5 border-t border-[#0F3D34]">
            {/* Move Up */}
            <button
              onClick={() => onMoveLayer(selectedLayer.id, 'up')}
              disabled={layers.indexOf(selectedLayer) === 0}
              className="p-1.5 bg-[#102419] hover:bg-[#0F3D34] border border-[#0F3D34] hover:border-[#C8A96A] rounded text-slate-200 hover:text-[#C8A96A] disabled:opacity-30 transition flex items-center justify-center cursor-pointer"
              title={translate('layers.moveUp', language)}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>

            {/* Move Down */}
            <button
              onClick={() => onMoveLayer(selectedLayer.id, 'down')}
              disabled={layers.indexOf(selectedLayer) === layers.length - 1}
              className="p-1.5 bg-[#102419] hover:bg-[#0F3D34] border border-[#0F3D34] hover:border-[#C8A96A] rounded text-slate-200 hover:text-[#C8A96A] disabled:opacity-30 transition flex items-center justify-center cursor-pointer"
              title={translate('layers.moveDown', language)}
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>

            {/* Duplicate */}
            <button
              onClick={() => onDuplicateLayer(selectedLayer.id)}
              className="p-1.5 bg-[#102419] hover:bg-[#0F3D34] border border-[#0F3D34] hover:border-[#C8A96A] rounded text-slate-200 hover:text-[#C8A96A] transition flex items-center justify-center cursor-pointer"
              title={translate('layers.duplicateLayer', language)}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Merge down */}
            <button
              onClick={() => onMergeDown(selectedLayer.id)}
              disabled={layers.indexOf(selectedLayer) === layers.length - 1}
              className="p-1.5 bg-[#102419] hover:bg-[#0F3D34] border border-[#0F3D34] hover:border-[#C8A96A] rounded text-slate-200 hover:text-[#C8A96A] disabled:opacity-30 transition flex items-center justify-center cursor-pointer"
              title={translate('layers.mergeDown', language)}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              onClick={() => onDeleteLayer(selectedLayer.id)}
              disabled={layers.length <= 1}
              className="p-1.5 bg-[#102419] hover:bg-rose-900/50 border border-[#0F3D34] hover:border-rose-500 rounded text-slate-200 hover:text-rose-400 disabled:opacity-30 transition flex items-center justify-center cursor-pointer"
              title={translate('layers.deleteLayer', language)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default React.memo(LayerManager);


