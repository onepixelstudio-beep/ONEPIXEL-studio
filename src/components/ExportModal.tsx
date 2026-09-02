import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  FileImage,
  Video,
  Layers,
  Palette,
  Grid,
  FileJson,
  FileCode,
  Sliders,
  Sparkles,
  Settings2,
  Play,
  Pause,
  Info,
  AlertTriangle,
  Check,
  RefreshCw,
  UploadCloud,
  Globe,
  Cpu,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { PixelProject, Frame } from '../types';
import { exportPluginRegistry } from '../utils/export/ExportPluginRegistry';
import { ExportPlugin, RenderResult, RenderedFrame, ExportProgress } from '../utils/export/ExportTypes';
import { ExportPipeline } from '../utils/export/ExportPipeline';
import { FileSaveService } from '../utils/export/FileSaveService';
import { ExportError, CancelError } from '../utils/export/ExportErrors';
import { telemetry } from '../utils/telemetry';
import { CoreRenderProcessor } from '../utils/canvas/CoreRenderProcessor';
import { ColorBlendUtils } from '../utils/canvas/ColorBlendUtils';
import { translate, LanguageCode } from '../i18n';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: PixelProject | null;
  selectedFrameId?: string;
  onExportProjectJson?: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialPluginId?: string;
  initialOptions?: Record<string, any>;
  language?: LanguageCode;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  FileImage,
  Video,
  Layers,
  Palette,
  Grid,
  FileJson,
  FileCode,
  Sparkles,
  Sliders
};

type TabCategory = 'image' | 'animation' | 'game' | 'palette';

// Helper to load current user preferences language
const getLanguage = (): LanguageCode => {
  try {
    const saved = localStorage.getItem('onepixel_preferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.language || 'es';
    }
  } catch (e) {}
  return 'es';
};

export default function ExportModal({
  isOpen,
  onClose,
  project,
  selectedFrameId,
  showToast,
  initialPluginId,
  initialOptions,
  language
}: ExportModalProps) {
  const lang: LanguageCode = language || getLanguage();
  const tr = (key: string, defaultVal?: string) => {
    const fullKey = key.includes('.') ? key : `exportModal.${key}`;
    const res = translate(fullKey, lang);
    return (res && res !== fullKey) ? res : (defaultVal || key);
  };

  const tabsList: { id: TabCategory; label: string; icon: React.ComponentType<any>; desc: string }[] = [
    { id: 'image', label: tr('tabImage', 'Imagen'), icon: FileImage, desc: tr('tabImageDesc', 'Formatos estáticos de fotograma único.') },
    { id: 'animation', label: tr('tabAnimation', 'Animación'), icon: Video, desc: tr('tabAnimationDesc', 'Loops orientados al artista y secuencias.') },
    { id: 'game', label: tr('tabGame', 'Game Export'), icon: Grid, desc: tr('tabGameDesc', 'Secuencias y hojas de sprites para motores 2D.') },
    { id: 'palette', label: tr('tabPalette', 'Paleta'), icon: Palette, desc: tr('tabPaletteDesc', 'Muestras indexadas y tablas de color.') }
  ];
  const t = {
    title: tr('title', 'Exportación Profesional de Activos'),
    subtitle: tr('subtitle', 'Infraestructura desacoplada y previsualización interactiva'),
    selectFormat: tr('selectFormat', 'Seleccionar Formato'),
    configParams: tr('configParams', 'Parámetros de Configuración'),
    livePreview: tr('livePreview', 'Previsualización Interactiva'),
    play: tr('play', 'Reproducir'),
    pause: tr('pause', 'Pausar'),
    speed: tr('speed', 'Velocidad'),
    frame: tr('frame', 'Fotograma'),
    estimates: tr('estimates', 'Métricas y Estimaciones de Salida'),
    resolution: tr('resolution', 'Resolución Final'),
    frameCount: tr('frameCount', 'Total de Cuadros'),
    fileSize: tr('fileSize', 'Tamaño de Archivo Estimado'),
    renderTime: tr('renderTime', 'Tiempo de Composición'),
    cacheStatus: tr('cacheStatus', 'Estado de Renderizado'),
    cacheHit: tr('cacheHit', '⚡ Cache Hit (Instantáneo)'),
    cacheMiss: tr('cacheMiss', '⚙️ Composición Dinámica'),
    download: tr('download', 'Exportar Activo'),
    cancel: tr('cancel', 'Cancelar'),
    errorTitle: tr('errorTitle', 'Error de Validación'),
    filenameRequired: tr('filenameRequired', 'El nombre de archivo no puede estar vacío.'),
    filenameInvalid: tr('filenameInvalid', 'El nombre contiene caracteres no permitidos (\\/:*?"<>|).'),
    scaleInvalid: tr('scaleInvalid', 'La escala debe ser un múltiplo entero entre 1x y 10x.'),
    qualityInvalid: tr('qualityInvalid', 'La calidad debe estar entre 1% y 100%.'),
    starting: tr('starting', 'Iniciando pipeline...'),
    advancedSettings: tr('advancedSettings', 'Configuraciones Avanzadas (Sandbox)'),
    preset: tr('preset', 'Preset de Exportación'),
    batchExport: tr('batchExport', 'Exportación en Lote'),
    cloudUpload: tr('cloudUpload', 'Subir a la Nube'),
    steamWorkshop: tr('steamWorkshop', 'Publicar en Steam Workshop'),
    presetsHelp: tr('presetsHelp', 'Pre-configura parámetros optimizados para entornos de desarrollo comunes.'),
    futureFeature: tr('futureFeature', 'Próximamente / Sandbox interactivo'),
    original: tr('original', 'Original'),
    previewScale: tr('previewScale', 'Escala de Previsualización'),
    singleFrame: tr('singleFrame', 'Fotograma Único'),
    frames: tr('frames', 'Fotogramas'),
    transparent: tr('transparent', 'Transparente'),
    solidBackground: tr('solidBackground', 'Fondo Sólido'),
    unsupportedPreview: tr('unsupportedPreview', 'La previsualización no está disponible para formatos de paleta de colores.')
  };

  const [activeTab, setActiveTab] = useState<TabCategory>('image');
  const [selectedPluginId, setSelectedPluginId] = useState<string>('png');
  const [options, setOptions] = useState<Record<string, any>>({});
  const [exportProgress, setExportProgress] = useState<{ step: string; percentage: number } | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Real-time Preview States
  const [previewResult, setPreviewResult] = useState<RenderResult | null>(null);
  const [currentPreviewFrameIndex, setCurrentPreviewFrameIndex] = useState<number>(0);
  const [isPlayPreview, setIsPlayPreview] = useState<boolean>(true);
  const [previewSpeedMultiplier, setPreviewSpeedMultiplier] = useState<number>(1);
  const [cacheHit, setCacheHit] = useState<boolean>(false);
  const [renderTime, setRenderTime] = useState<number>(0);

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Advanced Sandbox States
  const [selectedPreset, setSelectedPreset] = useState<string>('default');
  const [isBatchExport, setIsBatchExport] = useState<boolean>(false);
  const [isCloudUpload, setIsCloudUpload] = useState<boolean>(false);
  const [isSteamUpload, setIsSteamUpload] = useState<boolean>(false);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle initial plugin and options for re-exporting
  useEffect(() => {
    if (isOpen && initialPluginId) {
      const plugin = exportPluginRegistry.get(initialPluginId);
      if (plugin) {
        setActiveTab(plugin.category);
        setSelectedPluginId(initialPluginId);
        if (initialOptions) {
          setOptions(initialOptions);
        }
      }
    }
  }, [isOpen, initialPluginId]);

  // Auto-select first plugin of the active category on tab change
  useEffect(() => {
    if (!isOpen) return;
    if (initialPluginId) return;
    const plugins = exportPluginRegistry.getByCategory(activeTab);
    if (plugins.length > 0) {
      setSelectedPluginId(plugins[0].id);
    }
  }, [activeTab, isOpen, initialPluginId]);

  // Reset progress and abort controller when modal closes/opens
  useEffect(() => {
    if (!isOpen) {
      setExportProgress(null);
      setAbortController(null);
      setPreviewResult(null);
      setIsPlayPreview(true);
      setCurrentPreviewFrameIndex(0);
    }
  }, [isOpen]);

  const activePlugin = exportPluginRegistry.get(selectedPluginId);

  // Initialize options state when active plugin changes
  useEffect(() => {
    if (!activePlugin || !project) return;

    if (initialPluginId === selectedPluginId && initialOptions) {
      setOptions(initialOptions);
      return;
    }

    const initialOpts: Record<string, any> = {};
    activePlugin.getOptionsSchema().forEach((field) => {
      initialOpts[field.id] = field.defaultValue;
    });

    const hasFilenameField = activePlugin.getOptionsSchema().some(f => f.id === 'filename');
    if (hasFilenameField) {
      const activeFrameIndex = project.frames ? project.frames.findIndex(f => f.id === selectedFrameId) : -1;
      const frameNumber = activeFrameIndex >= 0 ? activeFrameIndex + 1 : 1;
      const zeroPaddedFrameIndex = String(frameNumber).padStart(4, '0');
      const projName = project.name || 'untitled';
      initialOpts['filename'] = `${projName.toLowerCase().replace(/\s+/g, '_')}_frame_${zeroPaddedFrameIndex}`;
    }

    initialOpts['frameId'] = selectedFrameId || (project.frames ? project.frames[0]?.id : undefined);

    setOptions(initialOpts);
  }, [selectedPluginId, activePlugin, selectedFrameId, project?.name]);

  // 1. Reactive Preview Calculation (Uses RenderCache to avoid redundant calculations)
  useEffect(() => {
    if (!isOpen || !activePlugin || !project) return;

    let isMounted = true;
    const calculatePreview = async () => {
      try {
        const start = performance.now();
        // Construct minimum sufficient render settings for preview
        const renderSettings = {
          scale: 1, // Render at 1x scale for maximum performance, then upscale in DOM/Canvas
          bgColor: options.transparent === false ? (options.bgColor || '#ffffff') : undefined,
          selectedFramesOnly: options.range === 'first' && project.frames && project.frames.length > 0
            ? [project.frames[0].id]
            : undefined,
        };

        const result = await CoreRenderProcessor.render(project, renderSettings);

        if (isMounted) {
          setPreviewResult(result);
          setCacheHit(result.statistics.cacheHit);
          setRenderTime(performance.now() - start);

          // Force frame index bounds sanitization
          if (currentPreviewFrameIndex >= result.frames.length) {
            setCurrentPreviewFrameIndex(0);
          }
        }
      } catch (err) {
        console.error('[Preview calculation error]', err);
      }
    };

    calculatePreview();

    return () => {
      isMounted = false;
    };
  }, [isOpen, project, selectedPluginId, options.transparent, options.bgColor, options.range]);

  // 2. Playback simulation Loop for animations
  useEffect(() => {
    if (!isPlayPreview || !previewResult || previewResult.frames.length <= 1) return;

    let timeoutId: any;
    const tick = () => {
      setCurrentPreviewFrameIndex((prev) => (prev + 1) % previewResult.frames.length);
    };

    const currentFrame = previewResult.frames[currentPreviewFrameIndex] || previewResult.frames[0];
    const duration = (currentFrame?.durationMs || 100) / previewSpeedMultiplier;
    timeoutId = setTimeout(tick, duration);

    return () => clearTimeout(timeoutId);
  }, [isPlayPreview, previewResult, currentPreviewFrameIndex, previewSpeedMultiplier]);

  // 3. Render pixel art onto standard canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !previewResult) return;

    const currentFrame = previewResult.frames[currentPreviewFrameIndex] || previewResult.frames[0];
    if (!currentFrame) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = currentFrame.width;
    canvas.height = currentFrame.height;
    ctx.clearRect(0, 0, currentFrame.width, currentFrame.height);

    const imgData = ctx.createImageData(currentFrame.width, currentFrame.height);
    const data = imgData.data;

    for (let i = 0; i < currentFrame.pixels.length; i++) {
      const color = currentFrame.pixels[i];
      const rgba = ColorBlendUtils.parseColor(color);
      const idx = i * 4;
      data[idx] = rgba.r;
      data[idx + 1] = rgba.g;
      data[idx + 2] = rgba.b;
      data[idx + 3] = Math.round(rgba.a * 255);
    }

    ctx.putImageData(imgData, 0, 0);
  }, [previewResult, currentPreviewFrameIndex]);

  // 4. Dynamic Live Validations
  useEffect(() => {
    if (!activePlugin) return;

    // Check filename
    if (activePlugin.getOptionsSchema().some(f => f.id === 'filename')) {
      const fn = options.filename;
      if (fn !== undefined && typeof fn === 'string') {
        if (!fn.trim()) {
          setValidationError(t.filenameRequired);
          return;
        }
        if (/[\\/:*?"<>|]/.test(fn)) {
          setValidationError(t.filenameInvalid);
          return;
        }
      }
    }

    // Check scale
    if (activePlugin.getOptionsSchema().some(f => f.id === 'scale')) {
      const sc = options.scale;
      if (sc !== undefined) {
        const parsed = parseInt(sc, 10);
        if (isNaN(parsed) || parsed < 1 || parsed > 10) {
          setValidationError(t.scaleInvalid);
          return;
        }
      }
    }

    // Check quality
    if (activePlugin.getOptionsSchema().some(f => f.id === 'quality')) {
      const q = options.quality;
      if (q !== undefined) {
        const parsed = parseInt(q, 10);
        if (isNaN(parsed) || parsed < 1 || parsed > 100) {
          setValidationError(t.qualityInvalid);
          return;
        }
      }
    }

    setValidationError(null);
  }, [options, activePlugin, t]);

  if (!isOpen || !project) return null;

  const pluginsToRender = exportPluginRegistry.getByCategory(activeTab);

  const handleOptionChange = (fieldId: string, value: any) => {
    setOptions((prev) => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleScaleInputChange = (vStr: string) => {
    if (vStr === '') {
      handleOptionChange('scale', '');
      return;
    }
    const valClean = vStr.replace(/[^0-9]/g, '');
    if (valClean === '') {
      handleOptionChange('scale', '');
      return;
    }
    const v = parseInt(valClean, 10);
    if (!isNaN(v)) {
      handleOptionChange('scale', Math.max(1, Math.min(10, v)));
    }
  };

  const handleScaleInputBlur = () => {
    const val = options.scale;
    if (val === '' || val === undefined) {
      handleOptionChange('scale', 1);
      return;
    }
    const v = parseInt(val, 10);
    if (isNaN(v) || v < 1) {
      handleOptionChange('scale', 1);
    } else if (v > 10) {
      handleOptionChange('scale', 10);
    } else {
      handleOptionChange('scale', v);
    }
  };

  const handleQualityInputChange = (vStr: string) => {
    if (vStr === '') {
      handleOptionChange('quality', '');
      return;
    }
    const valClean = vStr.replace(/[^0-9]/g, '');
    if (valClean === '') {
      handleOptionChange('quality', '');
      return;
    }
    const v = parseInt(valClean, 10);
    if (!isNaN(v)) {
      handleOptionChange('quality', Math.max(1, Math.min(100, v)));
    }
  };

  const handleQualityInputBlur = () => {
    const val = options.quality;
    if (val === '' || val === undefined) {
      handleOptionChange('quality', 90);
      return;
    }
    const v = parseInt(val, 10);
    if (isNaN(v) || v < 1) {
      handleOptionChange('quality', 1);
    } else if (v > 100) {
      handleOptionChange('quality', 100);
    } else {
      handleOptionChange('quality', v);
    }
  };

  const getQualityLabel = (vAny: any) => {
    const v = parseInt(vAny, 10) || 90;
    if (v <= 40) return lang === 'es' ? 'Baja' : lang === 'en' ? 'Low' : 'Baixa';
    if (v <= 75) return lang === 'es' ? 'Media' : lang === 'en' ? 'Medium' : 'Média';
    if (v <= 95) return lang === 'es' ? 'Alta' : lang === 'en' ? 'High' : 'Alta';
    return lang === 'es' ? 'Máxima' : lang === 'en' ? 'Maximum' : 'Máxima';
  };

  // 5. Dynamic File Size Heuristics Estimator
  const estimateFileSize = (): string => {
    if (!activePlugin) return 'Unknown';
    const originalPixels = project.width * project.height;
    const numFrames = options.range === 'first' ? 1 : project.frames.length;
    const finalScale = typeof options.scale === 'number' ? options.scale : 4;
    const outputPixelsCount = originalPixels * finalScale * finalScale * numFrames;

    if (activePlugin.category === 'palette') {
      const colorsCount = previewResult?.palette?.length || 16;
      const bytes = colorsCount * 3 + 120;
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    // Compression heuristics for flat pixel art colors
    let compressionFactor = 0.05; // 95% compression for PNG flat designs
    if (activePlugin.id === 'jpeg') compressionFactor = 0.08;
    if (activePlugin.id === 'bmp') compressionFactor = 1.0; // BMP has no compression
    if (activePlugin.id === 'gif') compressionFactor = 0.06;
    if (activePlugin.id === 'apng') compressionFactor = 0.04;
    if (activePlugin.id.includes('sprite')) compressionFactor = 0.035;

    const uncompressedBytes = outputPixelsCount * 4;
    const estimatedBytes = uncompressedBytes * compressionFactor;

    if (estimatedBytes < 1024) {
      return `${Math.round(estimatedBytes)} B`;
    }
    return `${(estimatedBytes / 1024).toFixed(1)} KB`;
  };

  // Preset Selection Action (Sandbox)
  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    if (!activePlugin) return;

    if (presetId === 'unity') {
      handleOptionChange('scale', 1); // standard asset import
      handleOptionChange('transparent', true);
      showToast?.('Preset "Unity Sprite Sheet" aplicado con éxito.', 'info');
    } else if (presetId === 'godot') {
      handleOptionChange('scale', 1);
      handleOptionChange('transparent', true);
      showToast?.('Preset "Godot Frame Strip" aplicado con éxito.', 'info');
    } else if (presetId === 'web_high') {
      handleOptionChange('scale', 8); // upscale for high dpi
      handleOptionChange('transparent', true);
      showToast?.('Preset "Web High-Res" aplicado con éxito.', 'info');
    } else {
      handleOptionChange('scale', 4);
      showToast?.('Preset por defecto restaurado.', 'info');
    }
  };

  const handleExecuteExport = async () => {
    if (!activePlugin || validationError) return;

    // Direct User Gesture: Prompt native file picker immediately while gesture is active
    let preSelectedHandle: any = null;
    try {
      const ext = activePlugin.extension || activePlugin.id.toLowerCase();
      preSelectedHandle = await FileSaveService.promptSaveHandle(project.name || 'Sprite', ext);
    } catch (err: any) {
      if (err instanceof CancelError || err.name === 'AbortError') {
        // User cancelled native location selection dialog
        console.log('[ExportModal] Exportación cancelada por el usuario en el selector.');
        return;
      }
      showToast?.(err.message || (lang === 'es' ? 'Error al abrir el selector de archivos.' : 'Error opening file picker.'), 'error');
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setExportProgress({ step: t.starting, percentage: 2 });

    const exportStartTime = performance.now();
    try {
      const scale = typeof options.scale === 'number' 
        ? options.scale 
        : (typeof options.scale === 'string' ? parseInt(options.scale, 10) || 1 : 1);

      // Delegate full execution of Render, Encode, and Save to ExportPipeline
      const pipelineResult = await ExportPipeline.execute({
        project,
        pluginId: activePlugin.id,
        scale,
        options,
        fileHandle: preSelectedHandle,
        signal: controller.signal,
        onProgress: (progress) => {
          setExportProgress({
            step: progress.message,
            percentage: progress.percentage
          });
        }
      });

      showToast?.(lang === 'es' ? 'Exportación realizada con éxito.' : 'Export completed successfully.', 'success');

      // Log to Export History
      try {
        const historyStr = localStorage.getItem('onepixel_export_history') || '[]';
        let history: any[] = [];
        try {
          history = JSON.parse(historyStr);
        } catch (e) {
          history = [];
        }
        
        const newExportItem = {
          id: `export-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          projectId: project.id,
          projectName: project.name || 'Proyecto Sin Nombre',
          pluginId: activePlugin.id,
          pluginName: activePlugin.name,
          scale: scale,
          width: project.width,
          height: project.height,
          timestamp: Date.now(),
          options: { ...options }
        };
        
        // Keep last 50 entries
        history = [newExportItem, ...history].slice(0, 50);
        localStorage.setItem('onepixel_export_history', JSON.stringify(history));
      } catch (err) {
        console.warn('Failed to save export history:', err);
      }

      const elapsed = performance.now() - exportStartTime;
      const id = activePlugin.id.toLowerCase();
      let category = 'PNG';
      if (id === 'gif') category = 'GIF';
      else if (id === 'apng') category = 'APNG';
      else if (id.includes('sprite') || id.includes('atlas')) category = 'SpriteSheet';

      telemetry.recordExport(category, elapsed);
    } catch (err) {
      if (err instanceof CancelError) {
        console.log('Export process aborted by user.');
        showToast?.(lang === 'es' ? 'Proceso de exportación cancelado.' : 'Export process canceled.', 'info');
      } else {
        console.error('Export failed: ', err);
        const errMsg = err instanceof ExportError ? err.message : (lang === 'es' ? 'La exportación falló debido a un error interno.' : 'Export failed due to internal error.');
        showToast?.(errMsg, 'error');
      }
    } finally {
      setExportProgress(null);
      setAbortController(null);
    }
  };

  const handleCancelExport = () => {
    if (abortController) {
      abortController.abort();
      showToast?.(lang === 'es' ? 'Proceso de exportación cancelado.' : 'Export process canceled.', 'info');
    }
  };

  const handleCloseModal = () => {
    if (abortController) {
      abortController.abort();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans text-slate-100 animate-in fade-in duration-200"
      id="export-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="relative bg-[#0F101E] border border-[#23253F] rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Progress Overlay */}
        {exportProgress && (
          <div className="absolute inset-0 bg-[#102419]/95 flex flex-col items-center justify-center p-6 z-50 animate-in fade-in duration-200">
            <div className="w-full max-w-md space-y-6 text-center">
              <div className="space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#0F3D34] flex items-center justify-center border border-[#C8A96A]/25">
                  <RefreshCw className="w-5 h-5 text-[#C8A96A] animate-spin" />
                </div>
                <h4 className="font-bold text-base text-white" id="export-progress-title">
                  Exportando {activePlugin?.name}
                </h4>
                <p className="text-xs text-slate-400">Por favor, no cierres la ventana. Procesamiento asíncrono robusto.</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>{exportProgress.step}</span>
                  <span className="font-mono text-[#C8A96A]">{exportProgress.percentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#171829] rounded-full overflow-hidden border border-[#2D2F4F]">
                  <div
                    className="h-full bg-gradient-to-r from-[#0F3D34] to-[#C8A96A] rounded-full transition-all duration-150 shadow-[0_0_12px_rgba(200,169,106,0.3)]"
                    style={{ width: `${exportProgress.percentage}%` }}
                    role="progressbar"
                    aria-valuenow={exportProgress.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>

              <button
                onClick={handleCancelExport}
                className="px-5 py-2.5 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 border border-rose-900/30 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 mx-auto focus:ring-2 focus:ring-rose-500 outline-none"
              >
                <X className="w-4 h-4" />
                Cancelar Proceso
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-4 border-b border-[#23253F] flex items-center justify-between bg-[#0B0C15]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C8A96A]/10 border border-[#C8A96A]/25 rounded-xl">
              <Download className="text-[#C8A96A] w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight" id="export-modal-title">{t.title}</h3>
              <p className="text-xs text-slate-400">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1C1D30] transition focus:ring-2 focus:ring-[#C8A96A] outline-none"
            aria-label={t.cancel || translate('common.close', language)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tab Selector */}
        <div className="flex border-b border-[#23253F] bg-[#0E0F1A] p-1.5 gap-1.5">
          {tabsList.map((tab) => {
            const Icon = tab.icon || FileImage;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-semibold transition focus:ring-2 focus:ring-[#C8A96A] outline-none ${
                  isActive
                    ? 'bg-[#C8A96A]/20 text-[#C8A96A] border border-[#C8A96A]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                    : 'text-slate-400 hover:text-white hover:bg-[#16172B]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Workspace Panels */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          
          {/* Left Column: Formats List & Custom Options */}
          <div className="w-1/2 p-5 overflow-y-auto border-r border-[#23253F]/60 space-y-5 max-h-[58vh] scrollbar-thin">
            
            {/* Formats Selection */}
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-bold tracking-wider uppercase block">
                {t.selectFormat}
              </span>
              <div className="grid grid-cols-1 gap-2">
                {pluginsToRender.map((plugin) => {
                  const Icon = iconMap[plugin.icon] || FileImage;
                  const isSelected = selectedPluginId === plugin.id;
                  const pluginName = tr(`plugin_${plugin.id}_name`, plugin.name);
                  const pluginDesc = tr(`plugin_${plugin.id}_desc`, plugin.desc);
                  return (
                    <button
                      key={plugin.id}
                      onClick={() => setSelectedPluginId(plugin.id)}
                      className={`p-3 rounded-xl border text-left transition flex items-start gap-3 w-full focus:ring-2 focus:ring-[#C8A96A] outline-none ${
                        isSelected
                          ? 'bg-[#C8A96A]/10 border-[#C8A96A] text-[#C8A96A] ring-1 ring-[#C8A96A]/30 shadow-md'
                          : 'bg-[#141526]/60 border-[#23253F] hover:border-[#33355F] text-slate-400'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isSelected ? 'bg-[#C8A96A]/20 text-[#C8A96A]' : 'bg-[#0E0F1A] text-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 truncate">{pluginName}</span>
                          <span className="text-[10px] bg-[#1B1D33] border border-[#2E3054] px-1.5 py-0.5 rounded font-mono font-bold text-[#C8A96A] uppercase">
                            .{plugin.extension}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug mt-1">{pluginDesc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Custom parameters mapped from OptionSchema */}
            <div className="space-y-3 pt-2">
              <span className="text-xs text-slate-400 font-bold tracking-wider uppercase block">
                {t.configParams}
              </span>

              {activePlugin && activePlugin.getOptionsSchema().length > 0 ? (
                <div className="space-y-4">
                  {activePlugin.getOptionsSchema().map((field) => {
                    // Declarative visibility guard
                    if (field.visible && !field.visible(options)) {
                      return null;
                    }

                    const val = options[field.id] !== undefined ? options[field.id] : field.defaultValue;
                    const fieldLabel = tr(`field_${field.id}_label`, field.label);
                    const fieldDesc = tr(`field_${field.id}_desc`, field.desc);

                    return (
                      <div
                        key={field.id}
                        className="bg-[#0C0D18] border border-[#23253F] p-4 rounded-xl flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-150"
                      >
                        <div className="flex justify-between items-center">
                          <label htmlFor={`field-${field.id}`} className="text-xs font-bold text-slate-200 flex items-center gap-2">
                            <Settings2 className="w-4 h-4 text-[#C8A96A]" />
                            {fieldLabel}
                          </label>
                          {field.id === 'scale' && (
                            <span className="text-[#C8A96A] font-mono font-bold bg-[#C8A96A]/15 py-0.5 px-2 rounded text-xs border border-[#C8A96A]/20 shadow-sm">
                              {val ? `${val}x` : '1x'}
                            </span>
                          )}
                          {field.id === 'quality' && (
                            <span className="text-[#C8A96A] font-mono font-bold bg-[#C8A96A]/15 py-0.5 px-2 rounded text-xs border border-[#C8A96A]/20 shadow-sm flex items-center gap-1.5">
                              <span>{getQualityLabel(val)}</span>
                              <span className="text-[10px] text-slate-400">({((Number(val) || 90) / 100).toFixed(2)})</span>
                            </span>
                          )}
                        </div>

                        {/* File Name Hex Field */}
                        {field.id === 'filename' ? (
                          <div className="relative">
                            <input
                              type="text"
                              id={`field-${field.id}`}
                              value={val}
                              placeholder={(t as any).fileNamePlaceholder || translate('saveModal.fileName', language) || "File Name"}
                              onChange={(e) => handleOptionChange(field.id, e.target.value)}
                              className="bg-[#141526] border border-[#23253F] rounded-lg pl-3 pr-14 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#C8A96A] focus:ring-1 focus:ring-[#C8A96A] w-full font-mono transition"
                            />
                            <span className="absolute right-3 top-2.5 text-[11px] text-slate-500 font-bold font-mono pointer-events-none uppercase">
                              .{activePlugin?.extension}
                            </span>
                          </div>
                        ) : field.id === 'scale' ? (
                          /* Range Slider & Preset Upscalers */
                          <div className="space-y-3">
                            <div className="bg-[#07080E] p-2.5 border border-[#171829] rounded-lg text-xs text-slate-400 font-medium flex flex-wrap justify-between items-center gap-2">
                              <span>{t.original}: <strong className="text-slate-200 font-mono">{project.width} × {project.height} px</strong></span>
                              <span className="text-slate-600 font-bold">|</span>
                              <span>{t.resolution}: <strong className="text-emerald-400 font-mono">{(project.width * (parseInt(val, 10) || 1))} × {(project.height * (parseInt(val, 10) || 1))} px</strong></span>
                            </div>

                            {/* Preset pills (1x to 10x integer multiples) */}
                            <div className="flex flex-wrap gap-1">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => handleOptionChange('scale', preset)}
                                  className={`py-1 px-2 text-[10px] rounded font-mono font-bold transition border focus:ring-1 focus:ring-[#C8A96A] outline-none ${
                                    Number(val) === preset
                                      ? 'bg-[#C8A96A] border-[#C8A96A] text-white shadow-md'
                                      : 'bg-[#141526] border-[#23253F] text-slate-400 hover:text-white hover:bg-[#1C1D32]'
                                  }`}
                                >
                                  {preset}x
                                </button>
                              ))}
                            </div>

                            {/* Range slider bar with manual value sync */}
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min={1}
                                max={10}
                                step={1}
                                value={parseInt(val, 10) || 1}
                                onChange={(e) => handleOptionChange('scale', Number(e.target.value))}
                                className="flex-1 accent-[#C8A96A] bg-[#141526] h-1.5 rounded-lg appearance-none cursor-pointer"
                              />
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => handleScaleInputChange(e.target.value)}
                                onBlur={handleScaleInputBlur}
                                className="w-14 text-center bg-[#141526] border border-[#23253F] rounded-lg py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#C8A96A] font-mono"
                              />
                            </div>
                          </div>
                        ) : field.id === 'quality' ? (
                          /* Quality scale synced layout */
                          <div className="space-y-3">
                            <div className="bg-[#07080E] p-2.5 border border-[#171829] rounded-lg text-xs text-slate-400 font-medium flex justify-between items-center">
                              <span>Nivel: <strong className="text-[#C8A96A] font-bold">{getQualityLabel(val)}</strong></span>
                              <span>Valor: <strong className="text-slate-200 font-mono">{val || 90}%</strong></span>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {[20, 50, 75, 90, 100].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => handleOptionChange('quality', preset)}
                                  className={`py-1 px-2.5 text-[10px] rounded font-mono font-bold transition border focus:ring-1 focus:ring-[#C8A96A] outline-none ${
                                    Number(val) === preset
                                      ? 'bg-[#0F3D34] border-[#C8A96A] text-[#C8A96A] shadow-md'
                                      : 'bg-[#141526] border-[#23253F] text-slate-400 hover:text-white hover:bg-[#1C1D32]'
                                  }`}
                                >
                                  {preset}%
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min={1}
                                max={100}
                                step={1}
                                value={parseInt(val, 10) || 90}
                                onChange={(e) => handleOptionChange('quality', Number(e.target.value))}
                                className="flex-1 accent-[#C8A96A] bg-[#141526] h-1.5 rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="relative shrink-0 flex items-center">
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => handleQualityInputChange(e.target.value)}
                                  onBlur={handleQualityInputBlur}
                                  className="w-14 text-center bg-[#141526] border border-[#23253F] rounded-lg py-1.5 pr-4 text-xs text-slate-200 focus:outline-none focus:border-[#C8A96A] font-mono"
                                />
                                <span className="absolute right-1.5 text-[9px] text-slate-500 font-bold font-mono pointer-events-none">%</span>
                              </div>
                            </div>
                          </div>
                        ) : field.id === 'bgColor' ? (
                          /* Color picker with hexadecimal code */
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#23253F] shrink-0 bg-[#141526]">
                              <input
                                type="color"
                                value={val.startsWith('#') && val.length === 7 ? val : '#ffffff'}
                                onChange={(e) => handleOptionChange(field.id, e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                              />
                              <div
                                className="w-full h-full border-2 border-transparent rounded-xl"
                                style={{ backgroundColor: val }}
                              />
                            </div>
                            <input
                              type="text"
                              id={`field-${field.id}`}
                              value={val}
                              placeholder="#ffffff"
                              onChange={(e) => handleOptionChange(field.id, e.target.value)}
                              className="bg-[#141526] border border-[#23253F] rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-[#C8A96A] font-mono w-full transition"
                            />
                          </div>
                        ) : field.type === 'boolean' ? (
                          /* Boolean checkbox switch toggle */
                          <label className="relative flex items-center gap-3 cursor-pointer mt-1">
                            <input
                              type="checkbox"
                              id={`field-${field.id}`}
                              checked={!!val}
                              onChange={(e) => handleOptionChange(field.id, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[#141526] rounded-full peer peer-focus:ring-2 peer-focus:ring-[#C8A96A] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C8A96A]"></div>
                            <span className="text-xs text-slate-300 font-medium">Habilitado</span>
                          </label>
                        ) : field.type === 'select' ? (
                          /* Standard custom dropdown select */
                          <select
                            id={`field-${field.id}`}
                            value={val}
                            onChange={(e) => handleOptionChange(field.id, e.target.value)}
                            className="bg-[#141526] border border-[#23253F] rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-[#C8A96A] focus:ring-1 focus:ring-[#C8A96A] w-full transition"
                          >
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          /* Standard default text field */
                          <input
                            type="text"
                            id={`field-${field.id}`}
                            value={val}
                            onChange={(e) => handleOptionChange(field.id, e.target.value)}
                            className="bg-[#141526] border border-[#23253F] rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-[#C8A96A] w-full transition"
                          />
                        )}

                        {field.desc && (
                          <p className="text-[11px] text-slate-500 leading-normal">{field.desc}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-28 flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#23253F] rounded-xl text-slate-500">
                  <Sliders className="w-5 h-5 text-slate-600 mb-1.5 animate-pulse" />
                  <span className="text-[11px] font-medium">{t.unsupportedPreview}</span>
                </div>
              )}
            </div>

            {/* Validation Errors Real-time Area */}
            {validationError && (
              <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 flex items-start gap-3 text-xs text-rose-300 animate-in shake-in duration-150">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <h5 className="font-bold text-rose-200">{t.errorTitle}</h5>
                  <p className="leading-snug text-[11px] mt-0.5">{validationError}</p>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Interactive Live Work Preview, Stats, Sandbox */}
          <div className="w-1/2 p-5 bg-[#102419] overflow-y-auto space-y-5 max-h-[58vh] scrollbar-thin flex flex-col justify-between">
            
            {/* Live Preview Monitor Panel */}
            <div className="bg-[#102419] border border-[#102419] rounded-2xl p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300 font-bold tracking-wider uppercase flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#C8A96A]" />
                  {t.livePreview}
                </span>
                
                {previewResult && previewResult.frames.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-[#102419] px-2.5 py-1 rounded-full border border-[#102419] shadow-sm text-[10px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96A] animate-pulse" />
                    <span className="font-bold text-slate-200">ANIMATION</span>
                  </div>
                )}
              </div>

              {/* Render Canvas Wrapper Screen */}
              {activePlugin?.category === 'palette' ? (
                <div className="h-44 bg-[#102419] border border-[#102419] rounded-xl flex flex-col items-center justify-center p-4 text-center">
                  <Palette className="w-8 h-8 text-[#C8A96A] mb-2 animate-bounce" />
                  <p className="text-xs text-slate-400 max-w-xs">{t.unsupportedPreview}</p>
                  
                  {/* Dynamic Palette Swatch Grid display if available */}
                  {previewResult && (
                    <div className="flex flex-wrap gap-1 mt-3 max-w-xs justify-center max-h-16 overflow-y-auto">
                      {previewResult.palette.slice(0, 48).map((color, idx) => (
                        <div
                          key={`${color}-${idx}`}
                          className="w-4 h-4 rounded-sm border border-[#102419] shrink-0 shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div
                    className="h-48 bg-[#102419] border border-[#102419] rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner"
                    style={{
                      backgroundImage: 'conic-gradient(#102419 0.25turn, #0F3D34 0.25turn 0.5turn, #102419 0.5turn 0.75turn, #0F3D34 0.75turn)',
                      backgroundSize: '16px 16px'
                    }}
                  >
                    <canvas
                      ref={previewCanvasRef}
                      className="max-h-full max-w-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>

                  {/* Playback & Scrubbing controls */}
                  {previewResult && previewResult.frames.length > 1 && (
                    <div className="space-y-2.5 bg-[#102419] border border-[#102419] p-3 rounded-xl animate-in fade-in duration-200">
                      
                      {/* Timeline Slider Scrubber */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
                          <span>Timeline</span>
                          <span className="text-slate-200">
                            Frame {currentPreviewFrameIndex + 1} / {previewResult.frames.length} ({previewResult.frames[currentPreviewFrameIndex]?.durationMs || 100}ms)
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={previewResult.frames.length - 1}
                          value={currentPreviewFrameIndex}
                          onChange={(e) => {
                            setIsPlayPreview(false); // Stop loop on scrubbing
                            setCurrentPreviewFrameIndex(Number(e.target.value));
                          }}
                          className="w-full accent-[#C8A96A] bg-[#102419] h-1 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Control buttons bar */}
                      <div className="flex justify-between items-center pt-1.5">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setIsPlayPreview(!isPlayPreview)}
                            className={`p-1.5 rounded-lg border transition flex items-center gap-1.5 text-xs font-bold ${
                              isPlayPreview
                                ? 'bg-[#102419] border-[#C8A96A] text-[#C8A96A]'
                                : 'bg-[#102419] border-[#102419] text-slate-300 hover:text-white'
                            }`}
                          >
                            {isPlayPreview ? (
                              <>
                                <Pause className="w-3.5 h-3.5 fill-current" />
                                <span>{t.pause}</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>{t.play}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Speed scale selection multiplier */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.speed}</span>
                          <div className="flex bg-[#102419] border border-[#102419] p-0.5 rounded-lg">
                            {[0.5, 1, 1.5, 2].map((sp) => (
                              <button
                                key={sp}
                                type="button"
                                onClick={() => setPreviewSpeedMultiplier(sp)}
                                className={`px-2 py-1 text-[9px] font-mono font-extrabold rounded-md transition ${
                                  previewSpeedMultiplier === sp
                                    ? 'bg-[#102419] text-white'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {sp}x
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Estimates Metrics Grid */}
            <div className="bg-[#102419]/50 border border-[#102419] rounded-2xl p-4 space-y-3.5">
              <span className="text-xs text-slate-300 font-bold tracking-wider uppercase flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#C8A96A]" />
                {t.estimates}
              </span>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-[#102419] border border-[#102419] p-3 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t.resolution}</span>
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-1">
                    <span>
                      {(project.width * (parseInt(options.scale, 10) || 4))} × {(project.height * (parseInt(options.scale, 10) || 4))} px
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({t.original}: {project.width}x{project.height})
                    </span>
                  </span>
                </div>

                <div className="bg-[#102419] border border-[#102419] p-3 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t.frameCount}</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {options.range === 'first' || activePlugin?.capabilities?.supportsAnimation === false
                      ? `1 (${t.singleFrame})`
                      : `${project.frames.length} (${t.frames})`}
                  </span>
                </div>

                <div className="bg-[#102419] border border-[#102419] p-3 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t.fileSize}</span>
                  <span className="text-xs font-bold text-[#C8A96A] font-mono">
                    ~{estimateFileSize()}
                  </span>
                </div>

                <div className="bg-[#102419] border border-[#102419] p-3 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t.renderTime}</span>
                  <span className="text-xs font-bold text-white font-mono">
                    ~{Math.round(renderTime)} ms
                  </span>
                </div>
              </div>

              {/* Cache status tag */}
              <div className="pt-1 flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">{t.cacheStatus}:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                  cacheHit
                    ? 'bg-[#C8A96A]/20 border-[#C8A96A]/40 text-[#C8A96A]'
                    : 'bg-[#102419]/30 border-[#102419] text-[#C8A96A]'
                }`}>
                  {cacheHit ? t.cacheHit : t.cacheMiss}
                </span>
              </div>
            </div>

            {/* Advanced sandbox: Presets & Future capabilities expansion */}
            <div className="bg-[#102419]/60 border border-[#102419] rounded-2xl p-4 space-y-3 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  {t.advancedSettings}
                </span>
                <span className="text-[9px] bg-[#102419] border border-[#102419] px-1.5 py-0.5 rounded-full text-slate-300 font-bold font-mono">
                  PROTOTYPE
                </span>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                {/* 1. Presets Selection Row */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Info className="w-3 h-3 text-[#C8A96A]" />
                    {t.preset}
                  </span>
                  <select
                    value={selectedPreset}
                    onChange={(e) => handlePresetSelect(e.target.value)}
                    className="bg-[#102419] border border-[#102419] rounded-lg p-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-[#C8A96A] outline-none w-full"
                  >
                    <option value="default">Default Web Preview</option>
                    <option value="unity">Unity Sprite Sheet (1x)</option>
                    <option value="godot">Godot Frame Strip (1x)</option>
                    <option value="web_high">Web High-Res Display (8x)</option>
                  </select>
                </div>

                {/* 2. Toggle sandbox settings layout */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBatchExport(!isBatchExport);
                      showToast?.('Exportación en lote pre-activada para el pipeline futuro.', 'info');
                    }}
                    className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 font-semibold ${
                      isBatchExport
                        ? 'bg-[#102419] border-[#C8A96A] text-[#C8A96A]'
                        : 'bg-[#102419] border-[#102419] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{t.batchExport}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCloudUpload(!isCloudUpload);
                      showToast?.('Sincronización de activos en la nube pre-activada.', 'info');
                    }}
                    className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 font-semibold ${
                      isCloudUpload
                        ? 'bg-[#102419] border-[#C8A96A] text-[#C8A96A]'
                        : 'bg-[#102419] border-[#102419] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{t.cloudUpload}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSteamUpload(!isSteamUpload);
                      showToast?.('Integración de Steam Workshop habilitada de prueba.', 'info');
                    }}
                    className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 font-semibold ${
                      isSteamUpload
                        ? 'bg-[#102419] border-[#C8A96A] text-[#C8A96A]'
                        : 'bg-[#102419] border-[#102419] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Steam</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#102419] bg-[#102419] flex gap-3.5">
          <button
            onClick={handleCloseModal}
            className="flex-1 py-3 bg-[#102419] hover:bg-[#102419] rounded-xl text-xs font-semibold text-slate-200 border border-[#102419] transition outline-none"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleExecuteExport}
            disabled={!!validationError}
            className={`flex-1 py-3 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition outline-none ${
              validationError
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] text-white shadow-lg active:scale-[0.99]'
            }`}
          >
            <Download className="w-4 h-4 animate-bounce" />
            {t.download} {activePlugin ? activePlugin.name.split(' ')[0] : 'Activo'}
          </button>
        </div>

      </div>
    </div>
  );
}
