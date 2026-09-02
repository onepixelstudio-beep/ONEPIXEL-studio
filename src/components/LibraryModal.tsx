import React, { useState, useEffect, useRef } from 'react';
import { Folder, Tag, Plus, Trash2, Share2, FileJson, X, Search, Check, FolderOpen, Download, Upload, Database, FileUp, FileDown, Copy, Pencil, Star } from 'lucide-react';
import { LibraryResource, LibraryFolder, ResourceType } from '../types';
import { translate, LanguageCode } from '../i18n';
import { ProjectLibraryService } from '../utils/ProjectLibraryService';
import { parsePaletteFile, convertToCanonical } from '../utils/paletteParser';
import GenericPromptModal from './GenericPromptModal';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (projectData: any) => void;
  onLoadPalette: (colors: string[]) => void;
  onLoadBrush?: (brushData: any) => void;
  onLoadTexture?: (textureData: any) => void;
  currentProjectData?: any; // To allow saving current project to library
  currentPaletteColors?: string[]; // To allow saving current palette
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  language?: LanguageCode;
}

function LibraryResourceThumbnail({ resource }: { resource: LibraryResource }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (resource.type === 'palette') return;

    const data = resource.data || {};
    const pixels = data.pixels;

    if (resource.type === 'brush' && pixels) {
      const size = data.size || (Array.isArray(pixels) ? pixels.length : 3);
      canvas.width = size;
      canvas.height = size;
      ctx.clearRect(0, 0, size, size);
      
      if (Array.isArray(pixels)) {
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const row = pixels[r];
            const val = Array.isArray(row) ? row[c] : (pixels as any)[r * size + c];
            if (val) {
              ctx.fillStyle = '#C8A96A';
              ctx.fillRect(c, r, 1, 1);
            }
          }
        }
      }
      return;
    }

    if (!pixels || !Array.isArray(pixels) || pixels.length === 0) {
      canvas.width = 16;
      canvas.height = 16;
      ctx.fillStyle = '#0F3D34';
      ctx.fillRect(0, 0, 16, 16);
      return;
    }

    let w = data.width || data.size || 8;
    let h = data.height || data.size || 8;
    const is2D = Array.isArray(pixels[0]);

    if (is2D) {
      h = pixels.length;
      w = (pixels[0] as any[]).length;
    } else if (pixels.length > 0 && !data.width && !data.height) {
      const side = Math.sqrt(pixels.length);
      if (Number.isInteger(side)) {
        w = side;
        h = side;
      }
    }

    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    if (is2D) {
      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          const val = pixels[r][c];
          if (typeof val === 'string' && val) {
            ctx.fillStyle = val;
            ctx.fillRect(c, r, 1, 1);
          } else if (typeof val === 'boolean' && val) {
            ctx.fillStyle = '#C8A96A';
            ctx.fillRect(c, r, 1, 1);
          }
        }
      }
    } else {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const val = pixels[idx];
          if (typeof val === 'string' && val) {
            ctx.fillStyle = val;
            ctx.fillRect(x, y, 1, 1);
          } else if (typeof val === 'boolean' && val) {
            ctx.fillStyle = '#C8A96A';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }
  }, [resource]);

  if (resource.type === 'palette') {
    const colors = resource.data?.colors || [];
    return (
      <div className="flex flex-wrap gap-1 p-2 justify-center items-center max-h-full overflow-hidden">
        {colors.slice(0, 12).map((col: string, idx: number) => (
          <span
            key={idx}
            className="w-3.5 h-3.5 rounded-xs border border-black/30 shrink-0 shadow-xs"
            style={{ backgroundColor: col }}
          />
        ))}
        {colors.length > 12 && (
          <span className="text-[9px] text-slate-400 font-mono">+{colors.length - 12}</span>
        )}
      </div>
    );
  }

  const projectPreview = resource.data?.preview || (resource as any).preview;
  if (resource.type === 'project' && projectPreview) {
    return (
      <img
        src={projectPreview}
        alt={resource.name}
        className="max-w-full max-h-full object-contain rounded-xs"
        style={{ imageRendering: 'pixelated' }}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <canvas
        ref={canvasRef}
        style={{ imageRendering: 'pixelated' }}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}

export default function LibraryModal({
  isOpen,
  onClose,
  onLoadProject,
  onLoadPalette,
  onLoadBrush,
  onLoadTexture,
  currentProjectData,
  currentPaletteColors,
  showToast,
  language = 'es',
}: LibraryModalProps) {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [activeTab, setActiveTab] = useState<ResourceType>('project');
  
  // Folder & tagging
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Creation dialogs
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSavingResource, setIsSavingResource] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveTags, setSaveTags] = useState('');
  const [saveFolderId, setSaveFolderId] = useState('');

  // Advanced features (Favorites, sorting, recent items)
  const [libraryFavorites, setLibraryFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'name'>('newest');

  const [activePrompt, setActivePrompt] = useState<{
    title: string;
    description?: string;
    fields: Array<{ key: string; label: string; type: 'text' | 'select'; defaultValue?: string; options?: Array<{ value: string; label: string }>; placeholder?: string }>;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (values: Record<string, string>) => void;
  } | null>(null);

  // Local Import State
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LOCAL PALETTE PARSERS ---

  const extractColorsFromImage = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 128;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve([]);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const colorSet = new Set<string>();
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          const a = data[i+3];
          if (a >= 128) {
            const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            colorSet.add(hex.toLowerCase());
          }
        }
        URL.revokeObjectURL(objectUrl);
        resolve(Array.from(colorSet).slice(0, 256));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Error al cargar la imagen'));
      };
      img.src = objectUrl;
    });
  };

  const createAndSavePaletteResource = async (name: string, colors: string[]) => {
    const canonical = convertToCanonical({ name, colors }, true);
    const newRes: LibraryResource = {
      id: canonical.id,
      name: canonical.name,
      type: 'palette',
      data: canonical,
      tags: ['Importado', 'Paleta'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await ProjectLibraryService.saveResource(newRes);
    loadData();
    showToast?.('¡Paleta de colores importada correctamente!', 'success');
  };

  const handleLocalImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (activeTab === 'palette') {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      
      if (['png', 'jpeg', 'jpg'].includes(ext)) {
        try {
          const colors = await extractColorsFromImage(file);
          if (colors.length > 0) {
            await createAndSavePaletteResource(file.name.split('.')[0], colors);
          } else {
            showToast?.('No se pudieron extraer colores de la imagen.', 'error');
          }
        } catch (err) {
          showToast?.('Error al procesar la imagen.', 'error');
        }
        e.target.value = '';
        return;
      }

      try {
        const parsed = await parsePaletteFile(file);
        if (parsed.colors.length > 0) {
          await createAndSavePaletteResource(parsed.name, parsed.colors);
        } else {
          showToast?.('No se encontraron códigos de color válidos en el archivo.', 'error');
        }
      } catch (err) {
        showToast?.('Error al procesar el archivo.', 'error');
      }
      e.target.value = '';
      return;
    } else if (activeTab === 'brush') {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            if (parsed.pixels && Array.isArray(parsed.pixels)) {
              const newRes: LibraryResource = {
                id: `brush-imported-${Date.now()}`,
                name: parsed.name || file.name.replace('.json', ''),
                type: 'brush',
                data: {
                  size: parsed.size || parsed.pixels.length,
                  pixels: parsed.pixels
                },
                tags: ['Importado', 'Pincel'],
                createdAt: Date.now(),
                updatedAt: Date.now()
              };
              await ProjectLibraryService.saveResource(newRes);
              loadData();
              showToast?.('¡Pincel importado correctamente!', 'success');
            } else {
              showToast?.('Formato de pincel JSON inválido.', 'error');
            }
          } catch (err) {
            showToast?.('Error al parsear el pincel.', 'error');
          }
        };
        reader.readAsText(file);
      } else if (file.type.startsWith('image/')) {
        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        img.onload = async () => {
          const size = Math.min(32, Math.max(3, img.width));
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, size, size);
            const imgData = ctx.getImageData(0, 0, size, size);
            const pixels: boolean[][] = [];
            for (let y = 0; y < size; y++) {
              const row: boolean[] = [];
              for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;
                const alpha = imgData.data[idx + 3];
                const r = imgData.data[idx];
                const g = imgData.data[idx + 1];
                const b = imgData.data[idx + 2];
                row.push(alpha > 50 && !(r > 240 && g > 240 && b > 240));
              }
              pixels.push(row);
            }
            const newRes: LibraryResource = {
              id: `brush-imported-${Date.now()}`,
              name: file.name.split('.')[0],
              type: 'brush',
              data: { size, pixels },
              tags: ['Imagen', 'Pincel'],
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            await ProjectLibraryService.saveResource(newRes);
            loadData();
            showToast?.('¡Pincel creado desde imagen correctamente!', 'success');
          }
        };
      }
    } else if (activeTab === 'texture') {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            if (parsed.pixels && Array.isArray(parsed.pixels)) {
              const newRes: LibraryResource = {
                id: `texture-imported-${Date.now()}`,
                name: parsed.name || file.name.replace('.json', ''),
                type: 'texture',
                data: parsed,
                tags: ['Importado', 'Textura'],
                createdAt: Date.now(),
                updatedAt: Date.now()
              };
              await ProjectLibraryService.saveResource(newRes);
              loadData();
              showToast?.('¡Textura importada correctamente!', 'success');
            }
          } catch (err) {
            showToast?.('Error al importar textura.', 'error');
          }
        };
        reader.readAsText(file);
      } else if (file.type.startsWith('image/')) {
        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        img.onload = async () => {
          const sizeW = img.width > 128 ? 32 : img.width;
          const sizeH = img.height > 128 ? 32 : img.height;
          const canvas = document.createElement('canvas');
          canvas.width = sizeW;
          canvas.height = sizeH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, sizeW, sizeH);
            const imgData = ctx.getImageData(0, 0, sizeW, sizeH);
            const pixels: string[] = [];
            for (let i = 0; i < imgData.data.length; i += 4) {
              const r = imgData.data[i];
              const g = imgData.data[i + 1];
              const b = imgData.data[i + 2];
              const a = imgData.data[i + 3];
              if (a < 10) {
                pixels.push('');
              } else {
                const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
                pixels.push(hex);
              }
            }
            const newRes: LibraryResource = {
              id: `texture-imported-${Date.now()}`,
              name: file.name.split('.')[0],
              type: 'texture',
              data: { pixels, width: sizeW, height: sizeH },
              tags: ['Imagen', 'Textura'],
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            await ProjectLibraryService.saveResource(newRes);
            loadData();
            showToast?.('¡Textura creada desde imagen correctamente!', 'success');
          }
        };
      }
    }
    e.target.value = '';
  };

  const proceedWithDownload = (content: string, mimeType: string, filename: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportResourceLocal = (res: LibraryResource) => {
    let filename = `${res.name.replace(/\s+/g, '_')}`;

    if (res.type === 'palette') {
      setActivePrompt({
        title: 'Exportar Paleta',
        description: 'Elige el formato en el que deseas exportar esta paleta de colores:',
        fields: [
          {
            key: 'format',
            label: 'Formato de Exportación',
            type: 'select',
            defaultValue: 'gpl',
            options: [
              { value: 'gpl', label: 'Formato GPL (compatible con Aseprite/Photoshop)' },
              { value: 'json', label: 'Formato JSON nativo' }
            ]
          }
        ],
        confirmText: 'Exportar',
        onConfirm: (values) => {
          const format = values.format;
          let content = '';
          let mimeType = 'application/json';
          let localFilename = filename;

          if (format === 'gpl') {
            content = `GIMP Palette\nName: ${res.name}\nColumns: 8\n#\n`;
            const colors = res.data?.colors || [];
            colors.forEach((hex: string) => {
              let r = parseInt(hex.slice(1, 3), 16) || 0;
              let g = parseInt(hex.slice(3, 5), 16) || 0;
              let b = parseInt(hex.slice(5, 7), 16) || 0;
              content += `${r} ${g} ${b} ${hex}\n`;
            });
            mimeType = 'text/plain';
            localFilename += '.gpl';
          } else {
            content = JSON.stringify(res.data, null, 2);
            localFilename += '.json';
          }

          proceedWithDownload(content, mimeType, localFilename);
        }
      });
    } else {
      const content = JSON.stringify(res.data, null, 2);
      filename += '.json';
      proceedWithDownload(content, 'application/json', filename);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      try {
        const favsStr = localStorage.getItem('onepixel_library_favorites') || '[]';
        setLibraryFavorites(JSON.parse(favsStr));
      } catch (e) {
        setLibraryFavorites([]);
      }
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const loadedResources = await ProjectLibraryService.loadResources();
      const loadedFolders = await ProjectLibraryService.loadFolders();
      setResources(loadedResources);
      setFolders(loadedFolders);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await ProjectLibraryService.createFolder(newFolderName, activeTab);
      setNewFolderName('');
      setIsCreatingFolder(false);
      loadData();
    } catch (err) {
      showToast?.('Error al crear carpeta', 'error');
    }
  };

  const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePrompt({
      title: 'Eliminar Carpeta',
      description: '¿Estás seguro de eliminar esta carpeta? Sus elementos no se borrarán, se moverán a la raíz.',
      fields: [],
      confirmText: 'Sí, Eliminar',
      onConfirm: async () => {
        try {
          await ProjectLibraryService.deleteFolder(id, resources);
          if (selectedFolderId === id) setSelectedFolderId('all');
          loadData();
        } catch (err) {
          console.warn("Could not delete folder:", err);
        }
      }
    });
  };

  const handleRenameFolder = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePrompt({
      title: 'Renombrar Carpeta',
      description: `Introduce el nuevo nombre para la carpeta "${currentName}":`,
      fields: [
        {
          key: 'newName',
          label: 'Nuevo Nombre',
          type: 'text',
          defaultValue: currentName,
          placeholder: 'Nombre de la carpeta'
        }
      ],
      confirmText: 'Guardar',
      onConfirm: async (values) => {
        const newName = values.newName ? values.newName.trim() : '';
        if (!newName) {
          showToast?.('El nombre de la carpeta no puede estar vacío.', 'error');
          return;
        }
        try {
          await ProjectLibraryService.renameFolder(id, newName);
          showToast?.('¡Carpeta renombrada correctamente!', 'success');
          loadData();
        } catch (err: any) {
          showToast?.(`Error al renombrar carpeta: ${err.message || err}`, 'error');
        }
      }
    });
  };

  const handleSaveCurrentToLibrary = async () => {
    if (!saveName.trim()) return;
    try {
      await ProjectLibraryService.saveActiveToLibrary(
        saveName,
        activeTab,
        currentProjectData,
        currentPaletteColors,
        saveFolderId || undefined,
        saveTags
      );
      setSaveName('');
      setSaveTags('');
      setSaveFolderId('');
      setIsSavingResource(false);
      loadData();
    } catch (err: any) {
      showToast?.('Error al guardar: ' + err.message, 'error');
    }
  };

  const deleteLibraryItem = async (id: string) => {
    setResources(prev => prev.filter(r => r.id !== id));
    try {
      await ProjectLibraryService.deleteResource(id);
    } catch (err) {
      console.warn("Could not delete resource:", err);
    }
    await loadData();
  };

  const handleDeleteResource = (id: string) => {
    setActivePrompt({
      title: 'Eliminar Recurso',
      description: '¿Estás seguro de que deseas eliminar este recurso de tu biblioteca?',
      fields: [],
      confirmText: 'Sí, Eliminar',
      onConfirm: async () => {
        await deleteLibraryItem(id);
      }
    });
  };

  const handleDuplicateResource = async (res: LibraryResource) => {
    try {
      await ProjectLibraryService.duplicateResource(res, language);
      showToast?.(language === 'es' ? '¡Recurso duplicado correctamente!' : language === 'pt' ? '¡Recurso duplicado com sucesso!' : 'Resource duplicated successfully!', 'success');
      loadData();
    } catch (err: any) {
      showToast?.(language === 'es' ? `Error al duplicar: ${err.message || err}` : `Error duplicating: ${err.message || err}`, 'error');
    }
  };

  const handleRenameResource = (res: LibraryResource) => {
    setActivePrompt({
      title: language === 'es' ? 'Renombrar Recurso' : language === 'pt' ? 'Renomear Recurso' : 'Rename Resource',
      description: language === 'es' ? `Introduce el nuevo nombre para "${res.name}":` : `Enter new name for "${res.name}":`,
      fields: [
        {
          key: 'newName',
          label: language === 'es' ? 'Nuevo Nombre' : 'New Name',
          type: 'text',
          defaultValue: res.name,
          placeholder: language === 'es' ? 'Introduce el nuevo nombre' : 'Enter new name'
        }
      ],
      confirmText: language === 'es' ? 'Guardar' : 'Save',
      onConfirm: async (values) => {
        const newName = values.newName ? values.newName.trim() : '';
        if (!newName) {
          showToast?.(language === 'es' ? 'El nombre no puede estar vacío.' : 'Name cannot be empty.', 'error');
          return;
        }
        try {
          await ProjectLibraryService.renameResource(res, newName);
          showToast?.(language === 'es' ? '¡Nombre actualizado correctamente!' : 'Name updated successfully!', 'success');
          loadData();
        } catch (err: any) {
          showToast?.(language === 'es' ? `Error al renombrar: ${err.message || err}` : `Error renaming: ${err.message || err}`, 'error');
        }
      }
    });
  };

  const handleShareResource = async (res: LibraryResource) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(JSON.stringify(res, null, 2));
        showToast?.(language === 'es' ? '¡Recurso copiado al portapapeles en formato JSON!' : 'Resource JSON copied to clipboard!', 'success');
      }
    } catch (e) {
      showToast?.(language === 'es' ? 'Error al copiar al portapapeles.' : 'Failed to copy to clipboard.', 'error');
    }
  };

  const toggleLibraryFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated = [...libraryFavorites];
    if (updated.includes(id)) {
      updated = updated.filter(x => x !== id);
      showToast?.('Recurso quitado de favoritos.', 'info');
    } else {
      updated.push(id);
      showToast?.('¡Recurso marcado como favorito! ⭐', 'success');
    }
    setLibraryFavorites(updated);
    localStorage.setItem('onepixel_library_favorites', JSON.stringify(updated));
  };

  // Filter lists
  const allTags = Array.from(
    new Set(resources.filter(r => r.type === activeTab).flatMap(r => r.tags))
  );

  const filteredResources = resources.filter(r => {
    if (r.type !== activeTab) return false;
    if (selectedFolderId !== 'all' && r.folderId !== selectedFolderId) return false;
    if (selectedTag && !r.tags.includes(selectedTag)) return false;
    if (showFavoritesOnly && !libraryFavorites.includes(r.id)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const sortedResources = [...filteredResources].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const activeFolders = folders.filter(f => f.type === activeTab || f.type === 'all');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans text-slate-100" id="library-modal">
      <div className="bg-[#102419] border border-[#102419] rounded-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-[#102419] flex items-center justify-between bg-[#102419]">
          <div className="flex items-center gap-3">
            <FolderOpen className="text-[#C8A96A] w-6 h-6" />
            <h2 className="text-lg font-bold tracking-wide text-slate-100">{translate('libraryModal.title', language as any)}</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories / Tabs */}
        <div className="flex bg-[#102419]/90 border-b border-[#102419] px-4">
          {(['project', 'palette', 'brush', 'texture'] as ResourceType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedFolderId('all');
                setSelectedTag(null);
              }}
              className={`px-5 py-3 text-xs font-semibold border-b-2 transition capitalize ${
                activeTab === tab 
                  ? 'border-[#C8A96A] text-[#C8A96A] bg-[#102419]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#102419]/40'
              }`}
            >
              {tab === 'project' ? translate('libraryModal.tabProject', language as any) : 
               tab === 'palette' ? translate('libraryModal.tabPalette', language as any) : 
               tab === 'brush' ? translate('libraryModal.tabBrush', language as any) : translate('libraryModal.tabTexture', language as any)}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar (Folders & Tags) */}
          <div className="w-64 bg-[#102419] border-r border-[#102419] p-4 flex flex-col gap-5 overflow-y-auto">
            
            {/* Folder list */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5" /> {translate('libraryModal.folders', language as any)}
                </span>
                <button 
                  onClick={() => setIsCreatingFolder(true)}
                  className="p-1 text-slate-400 hover:text-[#C8A96A] rounded hover:bg-[#102419] transition"
                  title={translate('libraryModal.newFolder', language as any)}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {isCreatingFolder && (
                <div className="mb-3 p-2 bg-[#102419] border border-[#102419] rounded-lg flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Nombre carpeta..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full bg-[#102419] text-xs px-2 py-1 rounded border border-[#102419] focus:outline-none focus:border-[#C8A96A]"
                  />
                  <div className="flex gap-1.5 self-end">
                    <button 
                      onClick={() => setIsCreatingFolder(false)}
                      className="text-[10px] px-2 py-1 rounded bg-slate-700 hover:bg-slate-600"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleCreateFolder}
                      className="text-[10px] px-2 py-1 rounded bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34]"
                    >
                      Crear
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setSelectedFolderId('all')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition ${
                    selectedFolderId === 'all' ? 'bg-[#102419]/30 text-[#C8A96A] border border-[#102419]' : 'text-slate-400 hover:bg-[#102419]'
                  }`}
                >
                  <Folder className="w-4 h-4" /> Todos los recursos
                </button>

                {activeFolders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition ${
                      selectedFolderId === folder.id 
                        ? 'bg-[#102419]/30 text-[#C8A96A] border border-[#102419]' 
                        : 'text-slate-400 hover:bg-[#102419]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className="w-4 h-4 text-slate-500 group-hover:text-[#C8A96A]" />
                      <span className="truncate">{folder.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-40 sm:opacity-0 group-hover:opacity-100 transition shrink-0">
                      <button 
                        onClick={(e) => handleRenameFolder(folder.id, folder.name, e)}
                        className="p-0.5 text-slate-400 hover:text-[#C8A96A] rounded transition"
                        title={language === 'es' ? 'Renombrar' : 'Rename'}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteFolder(folder.id, e)}
                        className="p-0.5 text-slate-400 hover:text-rose-400 rounded transition"
                        title={language === 'es' ? 'Eliminar' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags section */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                <Tag className="w-3.5 h-3.5" /> Etiquetas
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`text-[10px] px-2.5 py-1 rounded-full transition border ${
                    selectedTag === null 
                      ? 'bg-[#102419] text-[#C8A96A] border-[#C8A96A] font-semibold' 
                      : 'bg-[#102419] text-slate-400 border-[#102419] hover:text-slate-200'
                  }`}
                >
                  Todas
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`text-[10px] px-2.5 py-1 rounded-full transition border ${
                      selectedTag === tag 
                        ? 'bg-[#102419] text-[#C8A96A] border-[#C8A96A] font-semibold' 
                        : 'bg-[#102419] text-slate-400 border-[#102419] hover:text-slate-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Main Grid area */}
          <div className="flex-1 bg-[#102419] p-5 flex flex-col gap-4 overflow-hidden">
            
            {/* Search and Save actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar en la biblioteca..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#102419] border border-[#102419] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#C8A96A] transition"
                />
              </div>

              <div className="flex gap-2 shrink-0">
                {/* Favorites filter toggle */}
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition border ${
                    showFavoritesOnly 
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' 
                      : 'bg-[#102419] border-[#102419] text-slate-400 hover:text-slate-200'
                  }`}
                  title="Mostrar solo favoritos"
                >
                  <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                  <span>Favoritos</span>
                </button>

                {/* Sorting Selection Dropdown */}
                <div className="flex items-center gap-1.5 bg-[#102419] border border-[#102419] rounded-lg px-2 text-slate-300">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Orden:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs text-slate-300 focus:outline-none pr-1 py-1"
                  >
                    <option value="newest" className="bg-[#102419]">Recientes</option>
                    <option value="name" className="bg-[#102419]">Nombre</option>
                  </select>
                </div>

                {/* Save current active element button */}
                <button
                  onClick={() => setIsSavingResource(true)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 transition px-3 py-2 rounded-lg text-xs font-semibold border border-emerald-500/30 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Guardar Activo
                </button>
              </div>
            </div>

            {/* Import / Export Controls based on activeTab */}
            {activeTab !== 'project' && (
              <div className="flex flex-wrap gap-3 p-3 bg-[#102419] border border-[#102419] rounded-lg items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#C8A96A]" />
                  <span className="text-xs font-semibold text-slate-300">
                    Biblioteca de {activeTab === 'palette' ? 'Paletas' : activeTab === 'brush' ? 'Pinceles' : 'Texturas'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {/* Local Import Button */}
                  <button
                    onClick={handleLocalImportClick}
                    className="flex items-center gap-1.5 bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] text-white transition px-3 py-1.5 rounded-md text-[11px] font-semibold"
                    title={language === 'es' ? `Importar ${activeTab === 'palette' ? 'paleta' : activeTab === 'brush' ? 'pincel' : 'textura'} desde archivo local` : language === 'pt' ? `Importar ${activeTab === 'palette' ? 'paleta' : activeTab === 'brush' ? 'pincel' : 'textura'} de arquivo local` : `Import ${activeTab === 'palette' ? 'palette' : activeTab === 'brush' ? 'brush' : 'texture'} from local file`}
                  >
                    <FileUp className="w-3.5 h-3.5" /> {language === 'es' ? 'Importar Local' : language === 'pt' ? 'Importar Local' : 'Import Local'}
                  </button>

                  {/* Hidden file input for local imports */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={activeTab === 'palette' ? '.gpl,.pal,.act,.aco,.ase,.hex,.json,.txt,.csv,.xml,.kpl,.cpl,image/*,.png,.jpg,.jpeg' : '.json,image/*'}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Save active resource popup modal inside library */}
            {isSavingResource && (
              <div className="bg-[#102419] border border-[#102419] p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-[#C8A96A]">
                    Guardar {activeTab === 'project' ? 'Proyecto Pixel Art' : activeTab === 'palette' ? 'Paleta de colores' : 'Pincel/Textura'}
                  </h3>
                  <button onClick={() => setIsSavingResource(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-300">Nombre</label>
                    <input
                      type="text"
                      placeholder="Ej. Mi Sprite Héroe"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      className="bg-[#102419] border border-[#102419] rounded p-2 text-xs text-slate-100 focus:outline-none focus:border-[#C8A96A]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-300">Carpeta destino</label>
                    <select
                      value={saveFolderId}
                      onChange={(e) => setSaveFolderId(e.target.value)}
                      className="bg-[#102419] border border-[#102419] rounded p-2 text-xs text-slate-100 focus:outline-none focus:border-[#C8A96A]"
                    >
                      <option value="">Raíz (Ninguna)</option>
                      {activeFolders.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-300">Etiquetas (separadas por comas)</label>
                  <input
                    type="text"
                    placeholder="Ej. retro, personaje, animado"
                    value={saveTags}
                    onChange={(e) => setSaveTags(e.target.value)}
                    className="bg-[#102419] border border-[#102419] rounded p-2 text-xs text-slate-100 focus:outline-none focus:border-[#C8A96A]"
                  />
                </div>
                <button
                  onClick={handleSaveCurrentToLibrary}
                  className="bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] text-xs py-2 rounded font-semibold transition text-white"
                >
                  Guardar en Biblioteca
                </button>
              </div>
            )}

            {/* Resources list grid */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              {sortedResources.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500 py-10">
                  <FileJson className="w-10 h-10 stroke-1 text-slate-600 animate-pulse" />
                  <p className="text-xs font-semibold">No se encontraron recursos.</p>
                  <p className="text-[10px] text-slate-600">Prueba ajustando tus filtros o agregando nuevos elementos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {sortedResources.map((res) => (
                    <div 
                      key={res.id} 
                      className="bg-[#102419] border border-[#102419] hover:border-[#C8A96A]/60 rounded-lg p-3 flex flex-col justify-between group hover:shadow-lg transition relative overflow-hidden"
                    >
                      {/* Favorite indicator background corner badge if favorite */}
                      {libraryFavorites.includes(res.id) && (
                        <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 rounded-bl-full flex items-start justify-end p-1 pointer-events-none">
                          <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        </div>
                      )}

                      <div>
                        {/* Resource Preview */}
                        <div className="h-20 bg-[#102419]/60 rounded border border-[#102419] mb-2.5 flex items-center justify-center overflow-hidden relative">
                          <LibraryResourceThumbnail resource={res} />
                        </div>

                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className="text-xs font-bold text-slate-200 truncate pr-1" title={res.name}>{res.name}</h4>
                          <div className="flex items-center gap-1 shrink-0">
                            {res.isShared && (
                              <span className="text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1 py-0.5 rounded">
                                Compartido
                              </span>
                            )}
                            <button
                              onClick={(e) => toggleLibraryFavorite(res.id, e)}
                              className={`p-1 rounded hover:bg-slate-800 transition ${
                                libraryFavorites.includes(res.id) 
                                  ? 'text-amber-400 hover:text-amber-300' 
                                  : 'text-slate-500 hover:text-amber-400'
                              }`}
                              title={libraryFavorites.includes(res.id) ? "Quitar de favoritos" : "Marcar como favorito"}
                            >
                              <Star className={`w-3.5 h-3.5 ${libraryFavorites.includes(res.id) ? 'fill-amber-400' : ''}`} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {res.tags.slice(0, 3).map((t, idx) => (
                            <span key={idx} className="text-[9px] text-slate-300 bg-[#102419] px-1.5 py-0.5 rounded border border-[#102419]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="mt-3 pt-2.5 border-t border-[#102419] flex items-center justify-between">
                        <button
                          onClick={() => {
                            if (res.type === 'project') onLoadProject(res.data);
                            if (res.type === 'palette') onLoadPalette(res.data.colors);
                            if (res.type === 'brush' && onLoadBrush) onLoadBrush(res.data);
                            if (res.type === 'texture' && onLoadTexture) onLoadTexture(res.data);
                            onClose();
                          }}
                          className="bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] text-white text-[10px] font-bold px-3 py-1 rounded transition"
                        >
                          {language === 'es' ? 'Cargar' : language === 'pt' ? 'Carregar' : 'Load'}
                        </button>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleDuplicateResource(res)}
                            className="p-1 text-slate-400 hover:text-[#C8A96A] hover:bg-slate-800 rounded transition"
                            title={language === 'es' ? 'Duplicar' : language === 'pt' ? 'Duplicar' : 'Duplicate'}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {(!res.id.startsWith('preset-') && !res.id.startsWith('seed-')) && (
                            <button
                              onClick={() => handleRenameResource(res)}
                              className="p-1 text-slate-400 hover:text-[#C8A96A] hover:bg-slate-800 rounded transition"
                              title={language === 'es' ? 'Renombrar' : language === 'pt' ? 'Renomear' : 'Rename'}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleExportResourceLocal(res)}
                            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition"
                            title={language === 'es' ? 'Exportar archivo local' : language === 'pt' ? 'Exportar arquivo local' : 'Export local file'}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleShareResource(res)}
                            className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition"
                            title={language === 'es' ? 'Copiar recurso' : language === 'pt' ? 'Copiar recurso' : 'Copy resource'}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteResource(res.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                            title={language === 'es' ? 'Eliminar' : language === 'pt' ? 'Excluir' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {activePrompt && (
        <GenericPromptModal
          isOpen={true}
          onClose={() => setActivePrompt(null)}
          title={activePrompt.title}
          description={activePrompt.description}
          fields={activePrompt.fields}
          confirmText={activePrompt.confirmText}
          cancelText={activePrompt.cancelText}
          onConfirm={(values) => {
            activePrompt.onConfirm(values);
            setActivePrompt(null);
          }}
        />
      )}
    </div>
  );
}
