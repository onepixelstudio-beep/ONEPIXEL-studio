import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Clock,
  FolderOpen,
  AlertCircle,
  Trash2,
  Layers,
  Film,
  Calendar,
  Maximize2,
  FileWarning
} from 'lucide-react';
import { PixelProject } from '../types';
import { LocalPersistence } from '../utils/persistence/LocalPersistence';
import { translate, LanguageCode } from '../i18n';

export interface RecentItem {
  id: string;
  name: string;
  width: number;
  height: number;
  lastSaved: number;
  layersCount: number;
  framesCount: number;
  projectData?: PixelProject;
  isCorrupted?: boolean;
}

interface RecentProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProject: (project: PixelProject) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  language?: LanguageCode;
}

/**
 * Format relative / clean date string
 */
function formatRecentDate(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) return 'Reciente';
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const date = new Date(timestamp);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diffMin < 1) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHour < 24 && date.getDate() === new Date().getDate()) {
    return `Hoy, ${timeStr}`;
  }
  if (diffDay === 1 || (diffHour < 48 && date.getDate() === new Date(now - 86400000).getDate())) {
    return `Ayer, ${timeStr}`;
  }
  return `${date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })} ${timeStr}`;
}

/**
 * Validates whether a project structure is intact
 */
function isProjectValid(project: any): boolean {
  if (!project || typeof project !== 'object') return false;
  if (!project.width || !project.height || project.width < 1 || project.height < 1) return false;
  if (!project.pixels || typeof project.pixels !== 'object') return false;
  if (Object.keys(project.pixels).length === 0) return false;
  return true;
}

/**
 * Lightweight canvas preview of the pixel project
 */
const RecentPreviewCanvas: React.FC<{
  item: RecentItem | null;
  fullProject: PixelProject | null;
}> = ({ item, fullProject }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const projectToRender = fullProject || item?.projectData;
  const width = item?.width && item.width > 0 ? item.width : 32;
  const height = item?.height && item.height > 0 ? item.height : 32;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !item) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw dark checkerboard pattern for transparent canvas
    const checkSize = Math.max(1, Math.floor(Math.min(width, height) / 16));
    for (let y = 0; y < height; y += checkSize) {
      for (let x = 0; x < width; x += checkSize) {
        ctx.fillStyle = ((Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2 === 0)
          ? '#030408'
          : '#0a1611';
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }

    if (!projectToRender || !projectToRender.pixels) {
      return;
    }

    // Identify first frame and visible layers
    const frameId = projectToRender.frames?.[0]?.id || Object.keys(projectToRender.pixels)[0];
    const framePixels = frameId ? projectToRender.pixels[frameId] : null;

    if (!framePixels) return;

    const layers = projectToRender.layers || [];

    // Render layers from bottom to top
    layers.forEach((layer) => {
      if (layer.visible === false) return;
      const rawPixels = framePixels[layer.id];
      if (!rawPixels || !Array.isArray(rawPixels)) return;

      const layerOpacity = typeof layer.opacity === 'number' ? layer.opacity / 100 : 1;
      ctx.globalAlpha = Math.max(0, Math.min(1, layerOpacity));

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const hex = rawPixels[idx];
          if (hex && hex !== '' && hex !== 'transparent') {
            ctx.fillStyle = hex;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    ctx.globalAlpha = 1.0;
  }, [item, fullProject, width, height, projectToRender]);

  if (!item) {
    return (
      <div className="w-full h-40 rounded-xl border border-[#0F3D34] bg-[#030408] flex flex-col items-center justify-center text-slate-500 gap-2 p-4 text-center">
        <FolderOpen className="w-8 h-8 opacity-40 text-slate-400" />
        <span className="text-xs">Selecciona un proyecto para previsualizar</span>
      </div>
    );
  }

  const hasPixelData = !!(projectToRender?.pixels && Object.keys(projectToRender.pixels).length > 0);

  return (
    <div className="w-full rounded-xl border border-[#0F3D34] bg-[#030408] p-3 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
      {/* Visual Canvas Container */}
      <div className="relative w-36 h-36 max-w-full max-h-full flex items-center justify-center rounded-lg overflow-hidden border border-[#0F3D34]/80 bg-[#030408] shadow-md">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
          style={{
            imageRendering: 'pixelated',
            width: width >= height ? '100%' : 'auto',
            height: height >= width ? '100%' : 'auto',
          }}
        />

        {!hasPixelData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#030408]/90 p-2 text-center">
            <FileWarning className="w-7 h-7 text-[#C8A96A]/60 mb-1" />
            <span className="text-[10px] text-slate-400 font-mono">Sin vista previa disponible</span>
          </div>
        )}
      </div>

      {/* Dimension Badge */}
      <div className="mt-2.5 flex items-center gap-1.5 bg-[#102419] border border-[#0F3D34] px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-300">
        <Maximize2 className="w-3 h-3 text-[#C8A96A]" />
        <span>{item.width} × {item.height} px</span>
      </div>
    </div>
  );
};

export default function RecentProjectsModal({
  isOpen,
  onClose,
  onOpenProject,
  showToast,
  language = 'es'
}: RecentProjectsModalProps) {
  const [items, setItems] = useState<RecentItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFullProject, setSelectedFullProject] = useState<PixelProject | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load and consolidate recent projects
  const loadRecentItems = useCallback(() => {
    try {
      setErrorMessage(null);

      // 1. Get projects from LocalPersistence
      const localProjects = LocalPersistence.listProjects();

      // 2. Get projects index from localStorage
      let storedRecents: any[] = [];
      try {
        const raw = localStorage.getItem('pixel_art_recent_projects');
        if (raw) storedRecents = JSON.parse(raw);
      } catch (e) {
        storedRecents = [];
      }

      // 3. Map & deduplicate
      const map = new Map<string, RecentItem>();

      // Populate from localStorage recents (maintains recent open order)
      if (Array.isArray(storedRecents)) {
        storedRecents.forEach((r: any) => {
          if (!r || (!r.id && !r.name)) return;
          const id = r.id || `rec_${r.name}`;
          map.set(id, {
            id,
            name: r.name || translate('headerMenu.untitled', language as any) || 'Sin Título',
            width: r.width || 32,
            height: r.height || 32,
            lastSaved: r.timestamp || Date.now(),
            layersCount: r.projectData?.layers?.length || 1,
            framesCount: r.projectData?.frames?.length || 1,
            projectData: r.projectData
          });
        });
      }

      // Merge with all local stored projects
      localProjects.forEach((lp) => {
        if (!lp || !lp.id) return;
        const existing = map.get(lp.id);
        const layersCount = lp.layers?.length || 1;
        const framesCount = lp.frames?.length || 1;
        const lastSaved = lp.lastSaved || Date.now();

        if (existing) {
          map.set(lp.id, {
            ...existing,
            name: lp.name || existing.name,
            width: lp.width || existing.width,
            height: lp.height || existing.height,
            lastSaved: Math.max(existing.lastSaved, lastSaved),
            layersCount,
            framesCount,
            projectData: lp
          });
        } else {
          map.set(lp.id, {
            id: lp.id,
            name: lp.name || translate('headerMenu.untitled', language as any) || 'Sin Título',
            width: lp.width || 32,
            height: lp.height || 32,
            lastSaved,
            layersCount,
            framesCount,
            projectData: lp
          });
        }
      });

      const list = Array.from(map.values()).sort((a, b) => (b.lastSaved || 0) - (a.lastSaved || 0));
      setItems(list);

      // Auto-select first item if available
      if (list.length > 0) {
        setSelectedId(prev => (prev && list.some(i => i.id === prev) ? prev : list[0].id));
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      console.error('Error loading recent projects:', err);
      setErrorMessage('Error al cargar la lista de proyectos recientes.');
    }
  }, [language]);

  // Load list when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRecentItems();
    } else {
      setSelectedFullProject(null);
      setErrorMessage(null);
    }
  }, [isOpen, loadRecentItems]);

  // When selectedId changes, resolve full project details for high-fidelity preview
  useEffect(() => {
    if (!selectedId) {
      setSelectedFullProject(null);
      return;
    }

    const item = items.find(i => i.id === selectedId);
    if (!item) {
      setSelectedFullProject(null);
      return;
    }

    if (item.projectData && item.projectData.pixels && Object.keys(item.projectData.pixels).length > 0) {
      setSelectedFullProject(item.projectData);
      return;
    }

    // Try loading from LocalPersistence
    try {
      const full = LocalPersistence.loadProject(item.id);
      if (full && full.pixels && Object.keys(full.pixels).length > 0) {
        setSelectedFullProject(full);
      } else {
        setSelectedFullProject(item.projectData || null);
      }
    } catch (e) {
      setSelectedFullProject(item.projectData || null);
    }
  }, [selectedId, items]);

  const selectedItem = items.find(i => i.id === selectedId) || null;

  // Handle open selected project safely
  const handleOpenSelected = useCallback(() => {
    if (!selectedItem) return;

    setErrorMessage(null);

    try {
      // Try resolving full project
      let projectToOpen: PixelProject | null =
        selectedFullProject ||
        LocalPersistence.loadProject(selectedItem.id) ||
        selectedItem.projectData ||
        null;

      if (!projectToOpen || !projectToOpen.pixels || Object.keys(projectToOpen.pixels).length === 0) {
        const allLocal = LocalPersistence.listProjects();
        const match = allLocal.find(p => p.id === selectedItem.id || p.name === selectedItem.name);
        if (match && match.pixels && Object.keys(match.pixels).length > 0) {
          projectToOpen = match;
        }
      }

      if (projectToOpen && isProjectValid(projectToOpen)) {
        onOpenProject(projectToOpen);
        showToast?.(`Proyecto "${projectToOpen.name || selectedItem.name}" abierto exitosamente.`, 'success');
        onClose();
      } else {
        setErrorMessage(
          translate('headerMenu.recentNotFound', language as any) ||
          `El archivo "${selectedItem.name}" no se encuentra en el almacenamiento local o no contiene datos válidos.`
        );
      }
    } catch (err) {
      console.error('Error opening recent project:', err);
      setErrorMessage(`No se pudo abrir "${selectedItem.name}". Es posible que los datos estén corruptos.`);
    }
  }, [selectedItem, selectedFullProject, onOpenProject, showToast, onClose, language]);

  // Remove individual item from recents
  const handleRemoveItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      // Remove from localStorage recents
      const raw = localStorage.getItem('pixel_art_recent_projects');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((r: any) => r.id !== id && `rec_${r.name}` !== id);
          localStorage.setItem('pixel_art_recent_projects', JSON.stringify(filtered));
        }
      }

      setItems(prev => {
        const next = prev.filter(i => i.id !== id);
        if (selectedId === id) {
          setSelectedId(next.length > 0 ? next[0].id : null);
        }
        return next;
      });

      setErrorMessage(null);
      showToast?.('Proyecto quitado de la lista de recientes.', 'info');
    } catch (err) {
      console.error('Error removing recent item:', err);
    }
  };

  // Clear all recent history
  const handleClearAllRecents = () => {
    try {
      localStorage.removeItem('pixel_art_recent_projects');
      setItems([]);
      setSelectedId(null);
      setSelectedFullProject(null);
      setErrorMessage(null);
      showToast?.('Historial de recientes vaciado.', 'info');
    } catch (err) {
      console.error('Error clearing recents:', err);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setItems(currentItems => {
          if (currentItems.length === 0) return currentItems;
          const idx = currentItems.findIndex(i => i.id === selectedId);
          const nextIdx = idx < currentItems.length - 1 ? idx + 1 : 0;
          setSelectedId(currentItems[nextIdx].id);
          return currentItems;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setItems(currentItems => {
          if (currentItems.length === 0) return currentItems;
          const idx = currentItems.findIndex(i => i.id === selectedId);
          const prevIdx = idx > 0 ? idx - 1 : currentItems.length - 1;
          setSelectedId(currentItems[prevIdx].id);
          return currentItems;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleOpenSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedId, handleOpenSelected, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4"
      id="recent-projects-modal-backdrop"
    >
      {/* Dark Backdrop */}
      <div
        className="absolute inset-0 bg-[#030408]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Shell */}
      <div
        className="relative bg-[#102419] border border-[#0F3D34] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 font-sans max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        id="recent-projects-modal"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#0F3D34] flex justify-between items-center bg-[#0d1e15]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#0F3D34] border border-[#C8A96A]/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#C8A96A]" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                {translate('headerMenu.openRecent', language as any) || 'Abrir Recientes'}
              </h3>
              <p className="text-[10px] text-slate-400">
                Selecciona un proyecto reciente para ver su información y cargarlo en el lienzo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-[#0F3D34] text-slate-400 hover:text-white rounded-lg transition min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification banner if broken file */}
        {errorMessage && (
          <div className="px-4 sm:px-5 py-2.5 bg-red-950/60 border-b border-red-800/40 flex items-center justify-between text-xs text-red-200 gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {selectedId && (
              <button
                type="button"
                onClick={() => handleRemoveItem(selectedId)}
                className="px-2.5 py-1 bg-red-900 hover:bg-red-800 text-white rounded-lg text-[10px] font-semibold shrink-0 transition shadow"
              >
                Quitar de lista
              </button>
            )}
          </div>
        )}

        {/* Content Body: Two columns on desktop/tablet, stacked on mobile */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#0F3D34] min-h-[300px]">
          
          {/* Left Column: Recent Projects List */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0d1e15]">
            <div className="px-4 py-2 border-b border-[#0F3D34]/60 flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>Proyectos Recientes ({items.length})</span>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllRecents}
                  className="text-[10px] text-slate-400 hover:text-rose-400 transition"
                  title="Vaciar lista de recientes"
                >
                  Limpiar historial
                </button>
              )}
            </div>

            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[260px] md:max-h-[360px] scrollbar-thin"
            >
              {items.length === 0 ? (
                <div className="h-full py-12 flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
                  <div className="p-3 rounded-full bg-[#102419] border border-[#0F3D34]">
                    <Clock className="w-6 h-6 text-slate-400 opacity-60" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">
                    {translate('headerMenu.noRecentProjects', language as any) || 'No hay proyectos recientes'}
                  </span>
                  <p className="text-[10px] text-slate-500 max-w-[220px]">
                    Los proyectos que abras, crees o guardes en OnePixel Studio aparecerán automáticamente aquí.
                  </p>
                </div>
              ) : (
                items.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedId(item.id);
                        setErrorMessage(null);
                      }}
                      onDoubleClick={handleOpenSelected}
                      className={`group relative p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 min-h-[48px] ${
                        isSelected
                          ? 'bg-[#0F3D34] border-[#C8A96A] text-white shadow-md ring-1 ring-[#C8A96A]/40'
                          : 'bg-[#102419] hover:bg-[#0F3D34]/50 border-[#0F3D34] text-slate-300 hover:border-[#0F3D34]/90'
                      }`}
                    >
                      {/* Left Item Details */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-[#C8A96A]' : 'text-slate-200'
                            }`}
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          {isSelected && (
                            <span className="shrink-0 px-1.5 py-0.2 text-[8px] font-bold uppercase rounded bg-[#C8A96A]/20 text-[#C8A96A] border border-[#C8A96A]/40">
                              Seleccionado
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                          <span className="bg-[#030408] border border-[#0F3D34] px-1.5 py-0.5 rounded text-slate-300">
                            {item.width}×{item.height}
                          </span>
                          <span>•</span>
                          <span>{item.layersCount} {item.layersCount === 1 ? 'capa' : 'capas'}</span>
                          <span>•</span>
                          <span>{item.framesCount} {item.framesCount === 1 ? 'frame' : 'frames'}</span>
                        </div>

                        <div className="mt-1 text-[9px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-slate-500" />
                          <span>{formatRecentDate(item.lastSaved)}</span>
                        </div>
                      </div>

                      {/* Right Item Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleRemoveItem(item.id, e)}
                          className="opacity-60 sm:opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition min-w-[32px] min-h-[32px] flex items-center justify-center"
                          title="Quitar de recientes"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Preview & Detailed Meta */}
          <div className="w-full md:w-64 bg-[#102419] p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Vista Previa
              </span>

              {/* Canvas Preview Box */}
              <RecentPreviewCanvas
                item={selectedItem}
                fullProject={selectedFullProject}
              />

              {/* Project Meta Information Card */}
              {selectedItem ? (
                <div className="bg-[#0d1e15] border border-[#0F3D34] rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2 border-b border-[#0F3D34]/60 pb-2">
                    <span className="text-slate-400 text-[10px]">Proyecto</span>
                    <span className="font-bold text-white text-right truncate max-w-[130px]" title={selectedItem.name}>
                      {selectedItem.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Layers className="w-3 h-3 text-[#C8A96A]" />
                      <span>{selectedItem.layersCount} Capas</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Film className="w-3 h-3 text-[#C8A96A]" />
                      <span>{selectedItem.framesCount} Frames</span>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-400 border-t border-[#0F3D34]/60 pt-2 flex items-center justify-between">
                    <span>Guardado:</span>
                    <span className="font-mono text-slate-300">{formatRecentDate(selectedItem.lastSaved)}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-500">
                  Ningún archivo seleccionado
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleOpenSelected}
                disabled={!selectedItem}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg min-h-[44px] ${
                  selectedItem
                    ? 'bg-[#C8A96A] hover:bg-[#b59659] text-black cursor-pointer active:scale-[0.98]'
                    : 'bg-[#0F3D34]/40 text-slate-500 cursor-not-allowed border border-[#0F3D34]'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Abrir Proyecto</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#0F3D34]/40 transition text-center min-h-[36px]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Quick Shortcuts Tip */}
        <div className="px-4 sm:px-5 py-2 border-t border-[#0F3D34] bg-[#0d1e15] flex flex-wrap items-center justify-between text-[10px] text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-[#030408] border border-[#0F3D34] rounded text-[9px] text-slate-300 font-mono">↑ / ↓</kbd> Navegar</span>
            <span><kbd className="px-1.5 py-0.5 bg-[#030408] border border-[#0F3D34] rounded text-[9px] text-slate-300 font-mono">Enter</kbd> o Doble Clic para abrir</span>
          </div>
          <span><kbd className="px-1.5 py-0.5 bg-[#030408] border border-[#0F3D34] rounded text-[9px] text-slate-300 font-mono">Esc</kbd> Cerrar</span>
        </div>
      </div>
    </div>
  );
}

