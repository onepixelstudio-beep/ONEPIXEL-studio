import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, ChevronDown, Calendar, Tag, Maximize2, Trash2, 
  Copy, Pencil, Plus, Database, Grid3X3, MoreVertical, Layers, 
  Settings, Clock, Sparkles, Box, History, User, Check, Scale
} from 'lucide-react';
import { translate, LanguageCode } from '../i18n';
import { LibraryService, AssetMetadata } from '../utils/resources/LibraryService';
import { StampResource, AssetType } from '../types';
import { AssetQueryService, SortCriteria } from '../utils/resources/AssetQueryService';
import { AssetSelectionService } from '../utils/resources/AssetSelectionService';
import GenericPromptModal from './GenericPromptModal';

// Simple cache to prevent redundant localStorage reads for visible thumbnail assets
const thumbnailPixelsCache = new Map<string, string[]>();

interface AssetThumbnailProps {
  id: string;
  width: number;
  height: number;
}

export function AssetThumbnail({ id, width, height }: AssetThumbnailProps) {
  const [pixels, setPixels] = useState<string[] | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (thumbnailPixelsCache.has(id)) {
      setPixels(thumbnailPixelsCache.get(id)!);
    } else {
      // Lazy load pixels from storage when card enters layout
      const stamp = LibraryService.getStamp(id);
      if (stamp && stamp.data && stamp.data.pixels) {
        thumbnailPixelsCache.set(id, stamp.data.pixels);
        setPixels(stamp.data.pixels);
      } else {
        setPixels([]);
      }
    }
  }, [id]);

  useEffect(() => {
    if (!pixels || !canvasRef.current || pixels.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const color = pixels[idx];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, [pixels, width, height]);

  if (!pixels) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#102419]/60 text-[10px] text-slate-500 font-mono animate-pulse">
        ...
      </div>
    );
  }

  if (pixels.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#102419]/60 text-[10px] text-slate-600 font-mono">
        Empty
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ imageRendering: 'pixelated' }}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}

interface AssetLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: LanguageCode;
  onApplyAsset: (asset: StampResource) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AssetLibraryModal({
  isOpen,
  onClose,
  language = 'es',
  onApplyAsset,
  showToast
}: AssetLibraryModalProps) {
  const [index, setIndex] = useState<AssetMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all'); // 'all', 'stamp', 'pattern', 'brush', etc.
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortCriteria>('createdAtDesc');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [activeContextMenuId, setActiveContextMenuId] = useState<string | null>(null);

  // Dialog state for contextual operations
  const [editingAsset, setEditingAsset] = useState<AssetMetadata | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingTags, setEditingTags] = useState('');
  const [activePrompt, setActivePrompt] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);
  
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  // Load index of metadata
  const loadIndex = useCallback(() => {
    const list = LibraryService.getStampsIndex();
    setIndex(list);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadIndex();
      setActiveContextMenuId(null);
      setEditingAsset(null);
    }
  }, [isOpen, loadIndex]);

  // Click outside listener for context menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setActiveContextMenuId(null);
      }
    }
    if (activeContextMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeContextMenuId]);

  // Retrieve selected asset detailed data (lazily)
  const selectedAsset = useMemo(() => {
    if (!selectedAssetId) return null;
    return LibraryService.getStamp(selectedAssetId);
  }, [selectedAssetId, index]); // Refresh if index changes (for renames/tags)

  // Collect all unique tags and counts using AssetQueryService
  const tagList = useMemo(() => {
    return AssetQueryService.getUniqueTags(index);
  }, [index]);

  // Count per type for badges using AssetQueryService
  const typeCounts = useMemo(() => {
    return AssetQueryService.getTypeCounts(index);
  }, [index]);

  // Filter & Search logic using AssetQueryService
  const filteredAssets = useMemo(() => {
    return AssetQueryService.query(index, {
      searchQuery,
      categoryFilter: activeFilter,
      tagFilter: activeTagFilter,
      sortBy
    });
  }, [index, searchQuery, activeFilter, activeTagFilter, sortBy]);

  // Keyboard navigation listener utilizing AssetSelectionService
  useEffect(() => {
    if (!isOpen || filteredAssets.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid navigating when typing in form controls
      const activeEl = document.activeElement;
      if (
        activeEl && 
        (activeEl.tagName === 'INPUT' || 
         activeEl.tagName === 'TEXTAREA' || 
         activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextId = AssetSelectionService.navigate(filteredAssets, selectedAssetId, 'next');
        if (nextId) setSelectedAssetId(nextId);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevId = AssetSelectionService.navigate(filteredAssets, selectedAssetId, 'prev');
        if (prevId) setSelectedAssetId(prevId);
      } else if (e.key === 'Home') {
        e.preventDefault();
        const firstId = AssetSelectionService.navigate(filteredAssets, selectedAssetId, 'first');
        if (firstId) setSelectedAssetId(firstId);
      } else if (e.key === 'End') {
        e.preventDefault();
        const lastId = AssetSelectionService.navigate(filteredAssets, selectedAssetId, 'last');
        if (lastId) setSelectedAssetId(lastId);
      } else if (e.key === 'Enter') {
        if (selectedAsset) {
          e.preventDefault();
          handleApply(selectedAsset);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, filteredAssets, selectedAssetId, selectedAsset]);

  // Actions
  const handleApply = (asset: StampResource) => {
    onApplyAsset(asset);
    onClose();
    if (showToast) {
      const msg = translate('assetLibrary.assetLoaded', language, { name: asset.name });
      showToast(msg, 'success');
    }
  };

  const handleDelete = (id: string, name: string) => {
    setActivePrompt({
      title: translate('assetLibrary.deleteAssetTitle', language),
      description: translate('assetLibrary.deleteAssetConfirm', language, { name }),
      onConfirm: () => {
        LibraryService.deleteStamp(id);
        thumbnailPixelsCache.delete(id);
        if (selectedAssetId === id) setSelectedAssetId(null);
        loadIndex();
        if (showToast) {
          showToast(translate('assetLibrary.assetDeletedSuccess', language), 'success');
        }
      }
    });
  };

  const handleDuplicate = (id: string) => {
    const source = LibraryService.getStamp(id);
    if (!source) return;

    const copySuffix = translate('assetLibrary.copySuffix', language);
    const copy: StampResource = {
      ...source,
      id: `stamp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: `${source.name} ${copySuffix}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    LibraryService.saveStamp(copy);
    loadIndex();
    if (showToast) {
      showToast(translate('assetLibrary.assetDuplicatedSuccess', language), 'success');
    }
  };

  const handleStartEdit = (asset: AssetMetadata) => {
    setEditingAsset(asset);
    setEditingName(asset.name);
    setEditingTags(asset.tags.join(', '));
    setActiveContextMenuId(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    const fullAsset = LibraryService.getStamp(editingAsset.id);
    if (!fullAsset) return;

    const tagsArray = editingTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const updated: StampResource = {
      ...fullAsset,
      name: editingName.trim() || editingAsset.name,
      tags: tagsArray,
      updatedAt: Date.now()
    };

    LibraryService.saveStamp(updated);
    loadIndex();
    setEditingAsset(null);
    if (showToast) {
      showToast(translate('assetLibrary.changesSavedSuccess', language), 'success');
    }
  };

  const formatDate = (ts: number) => {
    try {
      const d = new Date(ts);
      return new Intl.DateTimeFormat(language === 'zh-CN' ? 'zh-CN' : language, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(d);
    } catch {
      const d = new Date(ts);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-depth/80 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-6xl h-[85vh] bg-brand-petroleum border border-brand-turquoise/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-brand-petroleum border-b border-brand-turquoise/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-turquoise/10 text-brand-sand rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-sans">
                  {translate('assetLibrary.title', language)}
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {translate('assetLibrary.subtitle', language)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 rounded-lg transition"
              style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader / Search & Sort */}
          <div className="px-6 py-3 bg-brand-depth border-b border-brand-turquoise/30 flex flex-wrap items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[280px] max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder={translate('assetLibrary.searchPlaceholder', language)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-brand-depth border border-brand-turquoise/30 rounded-lg focus:outline-none focus:border-brand-sage text-slate-200 placeholder-slate-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{translate('assetLibrary.sort', language)}:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortCriteria)}
                  className="appearance-none bg-brand-depth border border-brand-turquoise/30 rounded-lg px-3 py-1.5 pr-8 text-xs text-slate-300 font-medium focus:outline-none focus:border-brand-sage cursor-pointer"
                >
                  <option value="createdAtDesc">{translate('assetLibrary.sortNewest', language)}</option>
                  <option value="createdAtAsc">{translate('assetLibrary.sortOldest', language)}</option>
                  <option value="updatedAtDesc">{translate('assetLibrary.sortRecentlyModified', language)}</option>
                  <option value="nameAsc">{translate('assetLibrary.sortNameAsc', language)}</option>
                  <option value="nameDesc">{translate('assetLibrary.sortNameDesc', language)}</option>
                  <option value="sizeDesc">{translate('assetLibrary.sortSizeDesc', language)}</option>
                  <option value="sizeAsc">{translate('assetLibrary.sortSizeAsc', language)}</option>
                  <option value="typeAsc">{translate('assetLibrary.sortResourceType', language)}</option>
                </select>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <ChevronDown className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Body content layout */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* 1. Left Filters Panel */}
            <div className="w-56 bg-brand-depth border-r border-brand-turquoise/20 p-4 flex flex-col gap-5 overflow-y-auto">
              
              {/* Categories */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">{translate('assetLibrary.categories', language)}</span>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'all', label: translate('assetLibrary.allAssets', language), icon: Box },
                    { id: 'stamp', label: translate('assetLibrary.stamps', language), icon: Grid3X3 },
                    { id: 'pattern', label: translate('assetLibrary.patterns', language), icon: Layers },
                    { id: 'brush', label: translate('assetLibrary.brushes', language), icon: Sparkles },
                    { id: 'tile', label: translate('assetLibrary.tiles', language), icon: Settings },
                    { id: 'selection', label: translate('assetLibrary.selections', language), icon: Maximize2 }
                  ].map(filter => {
                    const count = typeCounts[filter.id] || 0;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => {
                          setActiveFilter(filter.id);
                          setActiveTagFilter(null);
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition ${
                          activeFilter === filter.id && !activeTagFilter
                            ? 'bg-brand-sage/20 text-brand-sand border border-brand-sage/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-brand-turquoise/20'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <filter.icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{filter.label}</span>
                        </span>
                        <span className="text-[10px] bg-brand-petroleum text-slate-500 px-1.5 py-0.5 rounded-md font-mono font-bold border border-brand-turquoise/20 group-hover:text-slate-300">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags Filter */}
              {tagList.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">{translate('assetLibrary.tags', language)}</span>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {tagList.map(({ tag, count }) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setActiveTagFilter(activeTagFilter === tag ? null : tag);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1 transition ${
                          activeTagFilter === tag
                            ? 'bg-brand-sage text-slate-900 font-bold'
                            : 'bg-brand-depth hover:bg-brand-turquoise/20 text-slate-400 hover:text-slate-200 border border-brand-turquoise/20'
                        }`}
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>{tag}</span>
                        <span className="text-[8px] bg-slate-950/40 text-slate-400 px-1 rounded">
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Grid Cards Panel */}
            <div className="flex-1 p-6 overflow-y-auto bg-brand-petroleum">
              {filteredAssets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="p-4 rounded-full bg-slate-800/20 border border-brand-turquoise/20 mb-3 text-slate-500">
                    <Database className="w-8 h-8" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-300">
                    {translate('assetLibrary.noAssetsFound', language)}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-normal">
                    {translate('assetLibrary.noAssetsFoundDesc', language)}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
                  {filteredAssets.map(item => {
                    const isSelected = AssetSelectionService.isSelected(selectedAssetId, item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedAssetId(item.id)}
                        className={`relative group bg-brand-depth/75 hover:bg-brand-depth border rounded-xl overflow-hidden cursor-pointer flex flex-col transition duration-200 shadow-md ${
                          isSelected 
                            ? 'border-brand-sage ring-1 ring-brand-sage/25' 
                            : 'border-brand-turquoise/30 hover:border-slate-500/50'
                        }`}
                      >
                        {/* Thumbnail Viewport (Lazy Loads inside) */}
                        <div className="h-28 bg-brand-depth border-b border-brand-turquoise/20 flex items-center justify-center relative overflow-hidden group-hover:bg-brand-depth/80 transition">
                          <AssetThumbnail id={item.id} width={item.width} height={item.height} />
                          
                          {/* Type Label Badge */}
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide bg-brand-petroleum/60 text-brand-sand backdrop-blur-xs border border-brand-turquoise/20">
                            {item.type || 'stamp'}
                          </span>

                          {/* Dimensions Indicator */}
                          <span className="absolute bottom-2 right-2 px-1 py-0.5 rounded text-[8px] font-mono text-slate-400 bg-slate-950/40 backdrop-blur-xs">
                            {item.width} x {item.height} px
                          </span>
                        </div>

                        {/* Card Info */}
                        <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
                          <div>
                            <div className="flex items-start justify-between gap-1.5">
                              <h4 className="text-xs font-bold text-slate-100 truncate group-hover:text-brand-sand transition-colors">
                                {item.name}
                              </h4>
                              
                              {/* Context Menu Button */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveContextMenuId(activeContextMenuId === item.id ? null : item.id);
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition"
                                  style={{ minWidth: '24px', minHeight: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {/* Simple contextual popup menu */}
                                {activeContextMenuId === item.id && (
                                  <div 
                                    ref={contextMenuRef}
                                    className="absolute right-0 mt-1 w-36 bg-brand-depth border border-brand-turquoise/30 rounded-lg shadow-xl z-50 py-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => handleStartEdit(item)}
                                      className="w-full px-3 py-1.5 text-left text-[11px] text-slate-300 hover:bg-brand-turquoise hover:text-white flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Pencil className="w-3 h-3 text-brand-sand" />
                                      {translate('assetLibrary.edit', language)}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveContextMenuId(null);
                                        handleDuplicate(item.id);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Copy className="w-3 h-3 text-emerald-400" />
                                      {translate('assetLibrary.duplicate', language)}
                                    </button>
                                    <hr className="border-[#102419] my-1" />
                                    <button
                                      onClick={() => {
                                        setActiveContextMenuId(null);
                                        handleDelete(item.id, item.name);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-[11px] text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3 text-rose-500" />
                                      {translate('assetLibrary.delete', language)}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Metadata text */}
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3 text-slate-600" />
                              {formatDate(item.createdAt)}
                            </span>
                          </div>

                          {/* Tags Pills */}
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 overflow-hidden max-h-5">
                              {item.tags.slice(0, 2).map((t, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#21233d] text-slate-400 border border-[#102419]/30 truncate max-w-[80px]">
                                  {t}
                                </span>
                              ))}
                              {item.tags.length > 2 && (
                                <span className="text-[8px] text-slate-500 self-center">
                                  +{item.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Enlarged Right Preview Detail Panel */}
            <div className="w-72 bg-brand-depth border-l border-brand-turquoise/20 p-5 flex flex-col justify-between overflow-y-auto">
              {selectedAsset ? (
                <div className="flex-1 flex flex-col justify-between h-full">
                  <div className="space-y-5">
                    {/* Visual Stamp Grid Checkerboard */}
                    <div className="aspect-square bg-brand-depth border border-brand-turquoise/30 rounded-xl flex items-center justify-center relative overflow-hidden pattern-grid-check p-3">
                      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(45deg,#808080_25%,transparent_25%),linear-gradient(-45deg,#808080_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#808080_75%),linear-gradient(-45deg,transparent_75%,#808080_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0]" />
                      <AssetThumbnail id={selectedAsset.id} width={selectedAsset.width} height={selectedAsset.height} />
                    </div>

                    {/* Metadata Specs */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide bg-brand-sage/20 text-brand-sand border border-brand-sage/30">
                            {selectedAsset.type}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">v{selectedAsset.version}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white leading-tight">{selectedAsset.name}</h3>
                        {selectedAsset.description && (
                          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{selectedAsset.description}</p>
                        )}
                      </div>

                      <div className="space-y-2.5 border-t border-brand-turquoise/20 pt-3">
                        {/* Dim */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-slate-600" /> {translate('assetLibrary.dimensions', language)}
                          </span>
                          <span className="font-mono text-slate-300 font-bold">{selectedAsset.width} × {selectedAsset.height} px</span>
                        </div>
                        {/* Origin */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <Maximize2 className="w-3.5 h-3.5 text-slate-600" /> {translate('assetLibrary.originBox', language)}
                          </span>
                          <span className="font-mono text-slate-400">({selectedAsset.origin.x}, {selectedAsset.origin.y})</span>
                        </div>
                        {/* Author */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-600" /> {translate('assetLibrary.author', language)}
                          </span>
                          <span className="text-slate-300 font-medium truncate max-w-[120px]">{selectedAsset.author || 'User'}</span>
                        </div>
                        {/* Created At */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-600" /> {translate('assetLibrary.created', language)}
                          </span>
                          <span className="text-slate-400">{formatDate(selectedAsset.createdAt)}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {selectedAsset.tags.length > 0 && (
                        <div className="border-t border-brand-turquoise/20 pt-3 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{translate('assetLibrary.tags', language)}</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedAsset.tags.map((t, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded text-[9px] font-semibold bg-brand-petroleum text-slate-300 border border-brand-turquoise/20 flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5 text-slate-500" />
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="mt-6 pt-4 border-t border-brand-turquoise/30">
                    <button
                      onClick={() => handleApply(selectedAsset)}
                      className="w-full h-11 rounded-xl bg-brand-sage hover:bg-brand-sage/85 text-xs font-bold text-slate-900 shadow-lg shadow-brand-depth/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      {translate('assetLibrary.loadAsStamp', language)}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <Maximize2 className="w-7 h-7 text-slate-700 animate-pulse mb-2.5" />
                  <span className="text-[10px] text-slate-500 leading-normal max-w-[160px]">
                    {translate('assetLibrary.selectAssetPrompt', language)}
                  </span>
                </div>
              )}
            </div>

          </div>
        </motion.div>

        {/* 4. MODAL/DIALOG OVERLAY FOR EDITING NAME & TAGS */}
        {editingAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-depth/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-brand-petroleum border border-brand-turquoise/30 rounded-2xl shadow-2xl p-5 text-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-4 flex items-center gap-2">
                <Pencil className="w-3.5 h-3.5 text-brand-sand" />
                {translate('assetLibrary.editAssetInfo', language)}
              </h3>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {translate('assetLibrary.assetName', language)}
                  </label>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-brand-depth border border-brand-turquoise/30 rounded-lg focus:outline-none focus:border-brand-sage text-slate-200"
                    placeholder="e.g. My Stamp"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {translate('assetLibrary.tagsPlaceholder', language)}
                  </label>
                  <input
                    type="text"
                    value={editingTags}
                    onChange={(e) => setEditingTags(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-brand-depth border border-brand-turquoise/30 rounded-lg focus:outline-none focus:border-brand-sage text-slate-200"
                    placeholder="e.g. retro, player, block"
                  />
                </div>

                <div className="flex gap-2.5 pt-3 self-end justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingAsset(null)}
                    className="px-3.5 py-2 rounded-lg bg-brand-turquoise/20 hover:bg-brand-turquoise/30 text-xs font-bold transition cursor-pointer"
                  >
                    {translate('assetLibrary.cancel', language)}
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-brand-sage hover:bg-brand-sage/80 text-xs font-bold text-slate-900 shadow-md transition cursor-pointer"
                  >
                    {translate('assetLibrary.saveChanges', language)}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {activePrompt && (
          <GenericPromptModal
            isOpen={activePrompt !== null}
            onClose={() => setActivePrompt(null)}
            title={activePrompt.title}
            description={activePrompt.description}
            fields={[]}
            confirmText={translate('assetLibrary.confirmDelete', language)}
            cancelText={translate('assetLibrary.cancel', language)}
            onConfirm={() => {
              activePrompt.onConfirm();
            }}
          />
        )}

      </div>
    </AnimatePresence>
  );
}
