import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Plus, FolderOpen, FileCode, Trash2, Copy, Edit3, Star, Layout, 
  Download, Upload, Heart, Coffee, BookOpen, Keyboard, History, Sliders, 
  Check, ExternalLink, ChevronRight, Search, Image, Video, Layers, Settings,
  AlertTriangle, RefreshCw, X, HelpCircle, LogIn, LogOut, CheckSquare, Grid, Maximize2
} from 'lucide-react';
import { PixelProject, ToolType, SymmetrySettings, OnionSkinSettings } from '../types';
import { useAWE } from '../hooks/useAWE';
import { PersistenceService } from '../utils/persistence/PersistenceService';
import { WindowSystem } from '../utils/architecture/WindowSystem';
import { translate, LanguageCode } from '../i18n';
import { DONATION_CONFIG } from '../config/DonationConfig';
import { OnePixelIcon, OnePixelLogo, OnePixelStartupAnimation } from '../branding';

// Local storage keys
const FAVORITES_KEY = 'onepixel_favorite_projects';
const CUSTOM_TEMPLATES_KEY = 'onepixel_custom_templates';
const CUSTOM_PRESETS_KEY = 'onepixel_custom_workspace_presets';
const EXPORT_HISTORY_KEY = 'onepixel_export_history';

interface WelcomeScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (project: PixelProject) => void;
  onNewProject: (width: number, height: number, bgFillColor?: string) => void;
  onOpenPreferences: () => void;
  onOpenHelp: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  currentProject: PixelProject | null;
  // Callback to capture and set workspace settings from loaded presets
  onApplyPreset?: (preset: WorkspacePreset) => void;
  // Callback to trigger re-export with custom params
  onTriggerReExport?: (pluginId: string, options: Record<string, any>) => void;
  language?: LanguageCode;
  initialNewProjectModal?: boolean;
}

export interface WorkspacePreset {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean;
  settings: {
    tool?: ToolType;
    brushSize?: number;
    symmetry?: SymmetrySettings;
    onionSkin?: boolean;
    gridVisible?: boolean;
    sidebarVisible?: boolean;
    colorsVisible?: boolean;
    timelineVisible?: boolean;
    paletteName?: string;
  };
}

export default function WelcomeScreen({
  isOpen,
  onClose,
  onLoadProject,
  onNewProject,
  onOpenPreferences,
  onOpenHelp,
  showToast,
  currentProject,
  onApplyPreset,
  onTriggerReExport,
  language = 'es',
  initialNewProjectModal = false
}: WelcomeScreenProps) {
  const awe = useAWE();
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const header = document.getElementById('header-menu-container');
    if (!header) return;
    
    const updateHeight = () => {
      const rect = header.getBoundingClientRect();
      setHeaderHeight(rect.height);
    };
    
    updateHeight();
    
    // Proactive tracking with ResizeObserver
    const observer = new ResizeObserver(() => {
      updateHeight();
    });
    observer.observe(header);
    
    window.addEventListener('resize', updateHeight);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [isOpen]);

  const [activeTab, setActiveTab] = useState<'inicio' | 'proyectos' | 'plantillas' | 'presets' | 'historial' | 'manual' | 'apoyar'>('inicio');
  const [recentProjects, setRecentProjects] = useState<PixelProject[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [customPresets, setCustomPresets] = useState<WorkspacePreset[]>([]);
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  
  // Search and filters
  const [projectSearch, setProjectSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<'all' | 'favorites'>('all');
  
  // Modals inside welcome
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newWidth, setNewWidth] = useState(32);
  const [newHeight, setNewHeight] = useState(32);
  const [bgType, setBgType] = useState<'transparent' | 'white' | 'color'>('transparent');
  const [customBgColor, setCustomBgColor] = useState('#6366f1');

  // Donation selection state
  const [selectedDonationTier, setSelectedDonationTier] = useState<string | null>(null);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [donatorName, setDonatorName] = useState('');
  const [customDonationAmount, setCustomDonationAmount] = useState('10');

  // Splash screen state
  const [showSplash, setShowSplash] = useState(true);

  // Hidden template input ref
  const templateInputRef = React.useRef<HTMLInputElement>(null);

  // Helper to calculate project card size display
  const getProjectSizeString = (p: PixelProject) => {
    try {
      const layerCount = p.layers?.length || 1;
      const frameCount = p.frames?.length || 1;
      const pixelDataLength = Object.keys(p.pixels || {}).length;
      const totalBytes = 1200 + (pixelDataLength * 12) + (layerCount * 110) + (frameCount * 140);
      if (totalBytes < 1024) return `${totalBytes} B`;
      if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
      return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch (e) {
      return '1.5 KB';
    }
  };

  // Keep activePrompt as legacy state for compatibility in render transitions
  const [activePrompt, setActivePrompt] = useState<any>(null);

  // Load files triggers
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Tips of the day
  const tips = [
    translate('welcome.tip1', language),
    translate('welcome.tip2', language),
    translate('welcome.tip3', language),
    translate('welcome.tip4', language),
    translate('welcome.tip5', language)
  ];
  const [currentTip, setCurrentTip] = useState(tips[0]);

  useEffect(() => {
    if (isOpen) {
      loadAllData();
      setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
      if (initialNewProjectModal) {
        setShowSplash(false);
        setIsNewProjectModalOpen(true);
      } else {
        setShowSplash(true);
      }
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1200);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, initialNewProjectModal]);

  const loadAllData = async () => {
    // 1. Projects listing
    const list = await PersistenceService.listProjects();
    setRecentProjects(list);

    // 2. Favorites
    const favsStr = localStorage.getItem(FAVORITES_KEY) || '[]';
    try {
      setFavorites(JSON.parse(favsStr));
    } catch (e) {
      setFavorites([]);
    }

    // 3. Custom templates
    const templatesStr = localStorage.getItem(CUSTOM_TEMPLATES_KEY) || '[]';
    try {
      setCustomTemplates(JSON.parse(templatesStr));
    } catch (e) {
      setCustomTemplates([]);
    }

    // 4. Custom presets
    const presetsStr = localStorage.getItem(CUSTOM_PRESETS_KEY) || '[]';
    try {
      setCustomPresets(JSON.parse(presetsStr));
    } catch (e) {
      setCustomPresets([]);
    }

    // 5. Export history
    const historyStr = localStorage.getItem(EXPORT_HISTORY_KEY) || '[]';
    try {
      setExportHistory(JSON.parse(historyStr));
    } catch (e) {
      setExportHistory([]);
    }
  };

  // --- ACTIONS ---

  const handleOpenLocalProject = (proj: PixelProject) => {
    onLoadProject(proj);
    onClose();
    showToast(translate('welcome.projectOpenedToast', language, { name: proj.name }), 'success');
  };

  const toggleFavorite = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let newFavs = [...favorites];
    if (newFavs.includes(projectId)) {
      newFavs = newFavs.filter(id => id !== projectId);
      showToast(translate('welcome.favRemovedToast', language), 'info');
    } else {
      newFavs.push(projectId);
      showToast(translate('welcome.favAddedToast', language), 'success');
    }
    setFavorites(newFavs);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
  };

  const handleDuplicateProject = async (proj: PixelProject, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const copy = {
        ...proj,
        id: `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: `${proj.name} - ${translate('common.duplicate', language) || 'Copia'}`,
        lastSaved: Date.now()
      };
      await PersistenceService.saveProject(copy);
      showToast(translate('welcome.projectDuplicatedToast', language), 'success');
      loadAllData();
    } catch (err) {
      showToast(translate('welcome.projectDuplicateError', language), 'error');
    }
  };

  const handleRenameProject = (proj: PixelProject, e: React.MouseEvent) => {
    e.stopPropagation();
    const windowSystem = WindowSystem.getInstance();
    windowSystem.prompt(
      translate('welcome.renameProjectTitle', language),
      translate('welcome.renameProjectDesc', language, { name: proj.name }),
      proj.name,
      translate('welcome.newProject', language),
      translate('colors.save', language),
      translate('common.cancel', language)
    ).then(async (newName) => {
      if (newName === null) return;
      const trimmed = newName.trim();
      if (!trimmed) {
        showToast(translate('exportModal.filenameRequired', language), 'error');
        return;
      }
      try {
        const updated = {
          ...proj,
          name: trimmed,
          lastSaved: Date.now()
        };
        await PersistenceService.saveProject(updated);
        showToast(translate('toasts.savedSuccess', language), 'success');
        loadAllData();
      } catch (err) {
        showToast(translate('toasts.saveError', language), 'error');
      }
    });
  };

  const handleDeleteProject = (proj: PixelProject, e: React.MouseEvent) => {
    e.stopPropagation();
    const windowSystem = WindowSystem.getInstance();
    windowSystem.confirm(
      translate('welcome.deleteProjectTitle', language),
      translate('welcome.deleteProjectDesc', language, { name: proj.name }),
      translate('welcome.deleteConfirmButton', language),
      translate('common.cancel', language)
    ).then(async (confirmed) => {
      if (!confirmed) return;
      try {
        await PersistenceService.deleteProject(proj.id);
        showToast(translate('toasts.layerDeleted', language), 'success');
        loadAllData();
      } catch (err) {
        showToast(translate('toasts.saveError', language), 'error');
      }
    });
  };

  const triggerLocalFileLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.id && parsed.width && parsed.layers && parsed.pixels) {
          onLoadProject(parsed as PixelProject);
          onClose();
          showToast(translate('welcome.projectOpenedToast', language, { name: parsed.name }), 'success');
        } else {
          showToast(translate('welcome.invalidProjectFormat', language), 'error');
        }
      } catch (err) {
        showToast(translate('welcome.jsonParseError', language), 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // --- PRESET TEMPLATES ---

  const presetTemplates = [
    {
      id: 'template-p-1',
      name: translate('welcome.templateIconTitle', language),
      width: 16,
      height: 16,
      description: translate('welcome.templateIconDesc', language),
      category: translate('welcome.catPixelArt', language),
      icon: Image
    },
    {
      id: 'template-p-2',
      name: translate('welcome.templateCharacterTitle', language),
      width: 32,
      height: 32,
      description: translate('welcome.templateCharacterDesc', language),
      category: translate('welcome.catSprites', language),
      icon: Maximize2
    },
    {
      id: 'template-p-3',
      name: translate('welcome.templateDetailedTitle', language),
      width: 64,
      height: 64,
      description: translate('welcome.templateDetailedDesc', language),
      category: translate('welcome.catPixelArt', language),
      icon: SmileIcon
    },
    {
      id: 'template-p-4',
      name: translate('welcome.templateTilesetTitle', language),
      width: 128,
      height: 128,
      description: translate('welcome.templateTilesetDesc', language),
      category: translate('welcome.catTilesets', language),
      icon: Grid
    },
    {
      id: 'template-p-5',
      name: translate('welcome.templateWalkTitle', language),
      width: 32,
      height: 32,
      description: translate('welcome.templateWalkDesc', language),
      category: translate('welcome.catAnimations', language),
      framesCount: 4,
      icon: Video
    },
    {
      id: 'template-p-6',
      name: translate('welcome.templateUiTitle', language),
      width: 64,
      height: 32,
      description: translate('welcome.templateUiDesc', language),
      category: translate('welcome.catUi', language),
      icon: Layout
    },
    {
      id: 'template-p-7',
      name: translate('welcome.templateCoinTitle', language),
      width: 16,
      height: 16,
      description: translate('welcome.templateCoinDesc', language),
      category: translate('welcome.catAnimations', language),
      framesCount: 6,
      icon: RefreshCw
    }
  ];

  const handleLoadTemplate = (tpl: typeof presetTemplates[0]) => {
    // Create project structure based on template rules
    let emptyProj = createEmptyProjectTemplate(tpl.name, tpl.width, tpl.height);
    
    // Add additional frames if requested
    if (tpl.framesCount && tpl.framesCount > 1) {
      const updatedFrames = [...emptyProj.frames];
      const updatedPixels = { ...emptyProj.pixels };
      const layerId = emptyProj.layers[0].id;

      for (let i = 1; i < tpl.framesCount; i++) {
        const frameId = `frame-tpl-${Date.now()}-${i}`;
        updatedFrames.push({
          id: frameId,
          name: `${translate('timeline.frame', language)} ${i + 1}`
        });
        updatedPixels[frameId] = {
          [layerId]: new Array(tpl.width * tpl.height).fill('')
        };
      }
      emptyProj.frames = updatedFrames;
      emptyProj.pixels = updatedPixels;
    }

    onLoadProject(emptyProj);
    onClose();
    showToast(translate('welcome.templateCreatedSuccess', language, { name: tpl.name }), 'success');
  };

  const createEmptyProjectTemplate = (name: string, w: number, h: number): PixelProject => {
    const frameId = `frame-${Date.now()}-0`;
    const layerId = `layer-${Date.now()}-0`;
    return {
      id: `proj-${Date.now()}`,
      name,
      width: w,
      height: h,
      fps: 8,
      tags: [],
      lastSaved: Date.now(),
      layers: [{
        id: layerId,
        name: translate('layers.baseLayer', language) || 'Capa Base',
        opacity: 100,
        visible: true,
        locked: false
      }],
      frames: [{
        id: frameId,
        name: `${translate('timeline.frame', language)} 1`
      }],
      pixels: {
        [frameId]: {
          [layerId]: new Array(w * h).fill('')
        }
      }
    };
  };

  const handleSaveAsCustomTemplate = () => {
    if (!currentProject) {
      showToast(translate('welcome.noActiveProjectForTemplate', language), 'error');
      return;
    }

    const windowSystem = WindowSystem.getInstance();
    windowSystem.prompt(
      translate('welcome.saveCustomTemplateTitle', language),
      translate('welcome.saveCustomTemplateDesc', language),
      `${currentProject.name} (${translate('welcome.presetTag', language)})`,
      translate('welcome.templateNamePlaceholder', language),
      translate('welcome.saveTemplateBtn', language),
      translate('common.cancel', language)
    ).then((tplName) => {
      if (tplName === null) return;
      const trimmed = tplName.trim();
      if (!trimmed) {
        showToast(translate('welcome.templateNameEmpty', language), 'error');
        return;
      }

      const newTemplate = {
        id: `tpl-custom-${Date.now()}`,
        name: trimmed,
        width: currentProject.width,
        height: currentProject.height,
        description: translate('welcome.templateCreatedByYou', language, {
          w: currentProject.width,
          h: currentProject.height,
          layers: currentProject.layers.length,
          frames: currentProject.frames.length
        }),
        projectData: currentProject,
        createdAt: Date.now()
      };

      const list = [...customTemplates, newTemplate];
      setCustomTemplates(list);
      localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(list));
      showToast(translate('welcome.templateSavedSuccess', language), 'success');
    });
  };

  const handleDeleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(updated));
    showToast(translate('welcome.templateDeletedToast', language), 'info');
  };

  const handleExportCustomTemplate = (tpl: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const dataStr = JSON.stringify(tpl, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tpl.name.replace(/\s+/g, '_')}_template.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(translate('welcome.templateExportedToast', language, { name: tpl.name }), 'success');
    } catch (err) {
      showToast(translate('welcome.templateExportError', language), 'error');
    }
  };

  const handleImportCustomTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (!parsed.name || !parsed.width || !parsed.height) {
          showToast(translate('welcome.invalidTemplateFile', language), 'error');
          return;
        }

        if (parsed.width > 600 || parsed.height > 600 || parsed.width < 4 || parsed.height < 4) {
          showToast(translate('welcome.templateExceedsLimit', language, { w: parsed.width, h: parsed.height }), 'error');
          return;
        }

        const newTemplate = {
          id: parsed.id || `tpl-custom-${Date.now()}`,
          name: parsed.name,
          width: parsed.width,
          height: parsed.height,
          description: parsed.description || `${translate('welcome.dimensionsLabel', language, { w: parsed.width, h: parsed.height })}`,
          projectData: parsed.projectData || parsed,
          createdAt: parsed.createdAt || Date.now()
        };

        const list = [...customTemplates, newTemplate];
        setCustomTemplates(list);
        localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(list));
        showToast(translate('welcome.templateImportedSuccess', language), 'success');
        
        if (e.target) e.target.value = '';
      } catch (err) {
        showToast(translate('welcome.templateImportError', language), 'error');
      }
    };
    reader.readAsText(file);
  };

  // --- WORKSPACE PRESETS ---

  const defaultPresets: WorkspacePreset[] = [
    {
      id: 'p-default-animator',
      name: translate('welcome.presetAnimator', language),
      description: translate('welcome.presetAnimatorDesc', language),
      settings: {
        tool: 'pen',
        brushSize: 1,
        onionSkin: true,
        gridVisible: true,
        sidebarVisible: true,
        timelineVisible: true,
        colorsVisible: true
      }
    },
    {
      id: 'p-default-tileset',
      name: translate('welcome.presetTileset', language),
      description: translate('welcome.presetTilesetDesc', language),
      settings: {
        tool: 'pen',
        brushSize: 1,
        onionSkin: false,
        gridVisible: true,
        sidebarVisible: true,
        timelineVisible: false,
        colorsVisible: true
      }
    },
    {
      id: 'p-default-illustrator',
      name: translate('welcome.presetIllustrator', language),
      description: translate('welcome.presetIllustratorDesc', language),
      settings: {
        tool: 'pen',
        brushSize: 2,
        onionSkin: false,
        gridVisible: false,
        sidebarVisible: true,
        timelineVisible: false,
        colorsVisible: true
      }
    }
  ];

  const handleApplyPreset = (preset: WorkspacePreset) => {
    if (onApplyPreset) {
      onApplyPreset(preset);
      showToast(translate('welcome.presetAppliedToast', language, { name: preset.name }), 'success');
      onClose();
    } else {
      showToast(translate('welcome.presetCannotApply', language), 'error');
    }
  };

  const handleSaveActiveAsPreset = () => {
    const windowSystem = WindowSystem.getInstance();
    windowSystem.prompt(
      translate('welcome.createPresetTitle', language),
      translate('welcome.createPresetDesc', language),
      translate('welcome.myCustomSpace', language),
      translate('welcome.presetNamePlaceholder', language),
      translate('welcome.savePresetBtn', language),
      translate('common.cancel', language)
    ).then((presetName) => {
      if (presetName === null) return;
      const trimmed = presetName.trim();
      if (!trimmed) {
        showToast(translate('welcome.presetNameEmpty', language), 'error');
        return;
      }

      const newPreset: WorkspacePreset = {
        id: `preset-custom-${Date.now()}`,
        name: trimmed,
        description: translate('welcome.presetSavedDate', language, { date: new Date().toLocaleDateString() }),
        isCustom: true,
        settings: {
          tool: 'pen',
          brushSize: 1,
          onionSkin: true,
          gridVisible: true,
          sidebarVisible: true,
          colorsVisible: true,
          timelineVisible: true
        }
      };

      const list = [...customPresets, newPreset];
      setCustomPresets(list);
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(list));
      showToast(translate('welcome.presetSavedSuccess', language), 'success');
    });
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(updated));
    showToast(translate('welcome.presetDeletedToast', language), 'info');
  };

  // --- RE-EXPORT ---

  const handleRepeatExport = (item: any) => {
    if (onTriggerReExport) {
      onTriggerReExport(item.pluginId, item.options);
      onClose();
      showToast(translate('welcome.reexportingToast', language, { name: item.projectName }), 'info');
    } else {
      showToast(translate('welcome.reexportOpenProjectFirst', language), 'error');
    }
  };

  // --- DONATIONS ---

  const donationTiers = [
    {
      id: 'tier-2usd',
      name: translate('welcome.tier2usdName', language),
      amount: '$2 USD',
      perk: translate('welcome.tier2usdPerk', language),
      desc: translate('welcome.tier2usdDesc', language),
      icon: Coffee,
      color: 'from-amber-600 to-amber-700',
      textColor: 'text-amber-200'
    },
    {
      id: 'tier-5usd',
      name: translate('welcome.tier5usdName', language),
      amount: '$5 USD',
      perk: translate('welcome.tier5usdPerk', language),
      desc: translate('welcome.tier5usdDesc', language),
      icon: Sparkles,
      color: 'from-slate-400 to-slate-500',
      textColor: 'text-slate-200'
    },
    {
      id: 'tier-free',
      name: translate('welcome.tierFreeName', language),
      amount: translate('welcome.tierFreeDesc', language) ? 'USD' : 'Libre',
      perk: translate('welcome.tierFreePerk', language),
      desc: translate('welcome.tierFreeDesc', language),
      icon: Heart,
      color: 'from-[#0F3D34] to-[#C8A96A]',
      textColor: 'text-emerald-100'
    }
  ];

  const handleConfirmDonation = () => {
    if (!donatorName.trim()) {
      showToast(translate('welcome.enterDonorNameError', language), 'error');
      return;
    }
    if (selectedDonationTier === 'tier-free') {
      const amt = parseFloat(customDonationAmount);
      if (isNaN(amt) || amt <= 0) {
        showToast(translate('welcome.enterValidAmountError', language), 'error');
        return;
      }
    }
    setDonationSuccess(true);
    
    const dest = DONATION_CONFIG.activeDestination;
    if (DONATION_CONFIG.allowRealRedirect && dest.gateway !== 'simulated' && dest.url) {
      showToast(translate('welcome.donationInitiated', language, { gateway: dest.gateway }), 'success');
      setTimeout(() => {
        try {
          window.open(dest.url, '_blank', 'noopener,noreferrer');
        } catch (err) {
          console.warn('Iframe restriction prevented window.open, opening standard notice.');
        }
      }, 1500);
    } else {
      showToast(translate('welcome.donationSimulatedSuccess', language, { recipient: dest.recipientName }), 'success');
    }
  };

  const handleNewProjectSubmit = () => {
    if (newWidth < 4 || newWidth > 600 || newHeight < 4 || newHeight > 600) {
      showToast(translate('welcome.canvasResLimit', language), 'error');
      return;
    }
    const bgFillColor = bgType === 'transparent' ? undefined : (bgType === 'white' ? '#ffffff' : customBgColor);
    onNewProject(newWidth, newHeight, bgFillColor);
    setIsNewProjectModalOpen(false);
    onClose();
  };

  // Filtered lists
  const filteredProjects = recentProjects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(projectSearch.toLowerCase());
    
    if (projectFilter === 'favorites') {
      return matchesSearch && favorites.includes(p.id);
    }
    
    return matchesSearch;
  });

  if (!isOpen) return null;

  const getContainerStyles = () => {
    const gapY = awe.isMobile ? 16 : awe.isTablet ? 24 : 32;
    const totalReduction = headerHeight + 2 * gapY;
    
    if (awe.isMobile) {
      return { 
        height: `calc(100vh - ${totalReduction}px)`, 
        minHeight: '440px', 
        maxHeight: `calc(100vh - ${totalReduction}px)` 
      };
    }
    if (awe.isTablet) {
      return { 
        height: `calc(100vh - ${totalReduction}px)`, 
        minHeight: '520px', 
        maxHeight: `calc(100vh - ${totalReduction}px)` 
      };
    }
    return { 
      height: `min(820px, calc(100vh - ${totalReduction}px))`, 
      minHeight: '580px', 
      maxHeight: `calc(100vh - ${totalReduction}px)` 
    };
  };

  const gapY = awe.isMobile ? 16 : awe.isTablet ? 24 : 32;

  if (initialNewProjectModal) {
    if (!isNewProjectModalOpen) return null;

    const handleCloseModal = () => {
      setIsNewProjectModalOpen(false);
      onClose();
    };

    return (
      <div 
        className="fixed inset-0 bg-black/75 z-[120] flex items-center justify-center p-4 backdrop-blur-xs font-sans text-slate-100"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseModal();
          }
        }}
      >
        <div className="bg-[#102419] border border-[#0F3D34] p-6 rounded-2xl w-full max-w-md space-y-5 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center border-b border-[#0F3D34] pb-2">
            <h4 className="font-extrabold text-xs text-[#C8A96A] uppercase tracking-wider">{translate('welcome.newCanvasTitle', language)}</h4>
            <button onClick={handleCloseModal} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{translate('welcome.widthPx', language)}</label>
                <input
                  type="number"
                  min="4"
                  max="600"
                  value={newWidth}
                  onChange={(e) => setNewWidth(Math.max(4, Math.min(600, parseInt(e.target.value) || 32)))}
                  className="w-full bg-[#102419] border border-[#0F3D34] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#C8A96A]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{translate('welcome.heightPx', language)}</label>
                <input
                  type="number"
                  min="4"
                  max="600"
                  value={newHeight}
                  onChange={(e) => setNewHeight(Math.max(4, Math.min(600, parseInt(e.target.value) || 32)))}
                  className="w-full bg-[#102419] border border-[#0F3D34] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#C8A96A]"
                />
              </div>
            </div>

            {/* Fast size selections */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">{translate('welcome.quickResolutions', language)}</label>
              <div className="flex flex-wrap gap-1.5">
                {[16, 32, 48, 64, 128, 256, 512].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => { setNewWidth(size); setNewHeight(size); }}
                    className={`text-xs px-2.5 py-1 rounded transition border cursor-pointer ${
                      newWidth === size && newHeight === size
                        ? 'bg-[#0F3D34] border-[#C8A96A] text-[#C8A96A] font-bold'
                        : 'bg-[#102419] border-[#0F3D34] text-slate-200 hover:bg-[#0F3D34]'
                    }`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
            </div>

            {/* Background fill color options */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{translate('welcome.initialBg', language)}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBgType('transparent')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    bgType === 'transparent' ? 'bg-[#0F3D34] border-[#C8A96A] text-[#C8A96A]' : 'bg-[#102419] border-[#0F3D34] text-slate-400'
                  }`}
                >
                  {translate('welcome.transparent', language)}
                </button>
                <button
                  type="button"
                  onClick={() => setBgType('white')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    bgType === 'white' ? 'bg-[#0F3D34] border-[#C8A96A] text-[#C8A96A]' : 'bg-[#102419] border-[#0F3D34] text-slate-400'
                  }`}
                >
                  {translate('welcome.whiteSolid', language)}
                </button>
                <button
                  type="button"
                  onClick={() => setBgType('color')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    bgType === 'color' ? 'bg-[#0F3D34] border-[#C8A96A] text-[#C8A96A]' : 'bg-[#102419] border-[#0F3D34] text-slate-400'
                  }`}
                >
                  {translate('welcome.colorFilled', language)}
                </button>
              </div>

              {bgType === 'color' && (
                <div className="flex gap-2 items-center pt-1.5">
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-8 h-8 rounded border border-[#0F3D34] bg-transparent cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-full bg-[#102419] border border-[#0F3D34] px-3 py-1.5 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-[#0F3D34]">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#102419] hover:bg-[#0F3D34] text-slate-300 transition cursor-pointer"
            >
              {translate('common.cancel', language)}
            </button>
            <button
              type="button"
              onClick={handleNewProjectSubmit}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0F3D34] hover:bg-[#C8A96A] hover:text-[#0F3D34] text-white transition shadow-lg cursor-pointer"
            >
              {translate('welcome.createCanvas', language)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/75 z-50 overflow-y-auto backdrop-blur-md font-sans text-slate-100" 
      id="welcome-screen-container"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="min-h-full w-full flex items-start justify-center px-2 sm:px-4 pointer-events-none"
        style={{
          paddingTop: `${headerHeight + gapY}px`,
          paddingBottom: `${gapY}px`
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          className="bg-[#102419] border border-[#0F3D34] rounded-2xl w-full max-w-5xl flex overflow-hidden shadow-2xl relative pointer-events-auto"
          style={getContainerStyles()}
        >
        
        {/* Immersive Brand Splash Screen */}
        <AnimatePresence>
          {showSplash && (
            <motion.div 
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-[#102419] flex flex-col items-center justify-start sm:justify-center z-50 text-center p-4 sm:p-8 select-none overflow-y-auto scrollbar-thin"
            >
              {/* Ambient glows */}
              <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#102419]/20 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#C8A96A]/20 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F3D34_1px,transparent_1px),linear-gradient(to_bottom,#0F3D34_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />

              <div className="space-y-4 sm:space-y-6 max-w-md relative z-10 my-auto py-4">
                {/* Official Logo with high-presence brand header */}
                <div className="py-3 flex flex-col items-center justify-center space-y-2">
                  <div className="p-4 bg-[#0F3D34] border border-[#0F3D34] rounded-2xl inline-flex items-center justify-center shadow-2xl max-w-full">
                    <OnePixelLogo height={32} />
                  </div>
                </div>

                {/* Dynamic Tip display */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="bg-[#102419]/90 border border-[#102419] rounded-xl p-4 text-[11px] text-slate-300 leading-relaxed font-mono max-w-sm mx-auto shadow-inner"
                >
                  <Sparkles className="w-4 h-4 text-[#C8A96A] mx-auto mb-2 animate-pulse" />
                  {currentTip}
                </motion.div>

                {/* Indeterminate loader */}
                <div className="w-48 h-1 bg-[#102419] rounded-full mx-auto overflow-hidden relative">
                  <motion.div 
                    initial={{ left: "-100%" }}
                    animate={{ left: "100%" }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    className="absolute top-0 bottom-0 w-2/3 bg-gradient-to-r from-[#102419] to-[#C8A96A] rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F3D34_1px,transparent_1px),linear-gradient(to_bottom,#0F3D34_1px,transparent_1px)] bg-[size:32px_32px] opacity-15 pointer-events-none" />

        {/* Left Drawer Navigation */}
        <div className="w-16 md:w-64 bg-[#102419] border-r border-[#0F3D34] p-2 md:p-4 flex flex-col justify-between relative z-10 shrink-0 overflow-y-auto no-scrollbar">
          <div className="space-y-6">
            
            {/* Header Brand */}
            <div className="px-1 overflow-hidden">
              <div className="flex items-center justify-center md:justify-start">
                <OnePixelLogo height={18} className="shrink-0" />
              </div>
            </div>

            {/* Menu Items */}
            <nav className="space-y-1">
              {[
                { id: 'inicio', label: translate('welcome.tabWelcome', language) || 'Inicio', icon: Layout },
                { id: 'proyectos', label: translate('welcome.tabProjects', language) || 'Proyectos', icon: FolderOpen },
                { id: 'plantillas', label: translate('welcome.tabTemplates', language) || 'Plantillas', icon: Image },
                { id: 'presets', label: translate('welcome.tabPresets', language) || 'Presets', icon: Sliders },
                { id: 'historial', label: translate('welcome.tabExports', language) || 'Exportaciones', icon: History },
                { id: 'manual', label: translate('welcome.tabManual', language) || 'Manual', icon: BookOpen },
                { id: 'apoyar', label: translate('welcome.tabDonate', language) || 'Donaciones', icon: Heart, badge: translate('welcome.badgeSupport', language) || 'Soporte' }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex flex-col md:flex-row items-center gap-1 md:gap-2.5 px-1 md:px-3 py-2 md:py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive 
                        ? 'bg-[#102419] text-white shadow-lg' 
                        : 'text-slate-400 hover:bg-[#102419] hover:text-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#C8A96A]' : 'text-slate-400'}`} />
                    <span className="text-[8px] md:text-xs scale-90 md:scale-100 font-medium md:font-semibold text-center md:text-left leading-none tracking-tight block max-w-full truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className={`hidden md:inline-block text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        isActive ? 'bg-[#102419] text-[#C8A96A]' : 'bg-[#102419]/50 text-amber-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Actions Footer inside Sidebar */}
          <div className="space-y-2 border-t border-[#0F3D34] pt-4">
            <button
              onClick={onClose}
              className="w-full bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] border border-[#0F3D34] text-white px-1 md:px-3 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-bold transition flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 cursor-pointer"
              title={currentProject ? translate('welcome.backToCanvas', language) : translate('welcome.closeWelcome', language)}
            >
              <ChevronRight className="w-3.5 h-3.5 md:order-last md:block" />
              <span className="hidden md:inline">{currentProject ? translate('welcome.backToCanvas', language) : translate('welcome.closeWelcome', language)}</span>
              <span className="md:hidden text-[9px] uppercase font-bold text-white leading-none">{currentProject ? translate('welcome.returnLabel', language) : translate('welcome.close', language)}</span>
            </button>
            <div className="flex flex-col md:flex-row items-center justify-between px-1 text-[8px] md:text-[10px] text-slate-400 font-mono gap-1">
              <span>{translate('welcome.version', language) || 'v1.2.0'}</span>
              <button onClick={onOpenPreferences} className="hover:text-slate-200 flex items-center gap-0.5">
                <Settings className="w-3 h-3" /> <span className="hidden md:inline">{translate('welcome.settings', language)}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Main Panel Content */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden relative z-10 bg-[#102419]">
          
          {/* Main Top Header */}
          <div className="px-3 md:px-6 py-2.5 md:py-4 border-b border-[#0F3D34] bg-[#102419] flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-sm md:text-base font-bold tracking-wide capitalize leading-none mb-1 text-slate-100">
                {activeTab === 'inicio' ? translate('welcome.headerWelcomeCenter', language) : 
                 activeTab === 'proyectos' ? translate('welcome.headerProjectsManager', language) :
                 activeTab === 'plantillas' ? translate('welcome.headerTemplatesLib', language) :
                 activeTab === 'presets' ? translate('welcome.headerPresets', language) :
                 activeTab === 'historial' ? translate('welcome.headerExportHistory', language) :
                 activeTab === 'manual' ? translate('welcome.headerManual', language) : translate('welcome.headerDonate', language)}
              </h2>
              <p className="text-[10px] md:text-[11px] text-slate-400 leading-tight">
                {activeTab === 'inicio' && translate('welcome.subWelcomeCenter', language)}
                {activeTab === 'proyectos' && translate('welcome.subProjectsManager', language)}
                {activeTab === 'plantillas' && translate('welcome.subTemplatesLib', language)}
                {activeTab === 'presets' && translate('welcome.subPresets', language)}
                {activeTab === 'historial' && translate('welcome.subExportHistory', language)}
                {activeTab === 'manual' && translate('welcome.subManual', language)}
                {activeTab === 'apoyar' && translate('welcome.subDonate', language)}
              </p>
            </div>

            <button 
              onClick={onClose} 
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#0F3D34] transition shrink-0 cursor-pointer"
              title={translate('welcome.close', language) || 'Cerrar'}
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {/* Core Body Container scrollable */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6 min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                
                {/* --- INICIO TAB --- */}
                {activeTab === 'inicio' && (
                  <div className="space-y-4 md:space-y-6">
                    
                    {/* Welcome Banner Card */}
                    <div className="bg-[#102419] border border-[#102419] rounded-2xl p-4 md:p-6 relative overflow-hidden shadow-lg">
                      <div className="relative z-10 space-y-2">
                        <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-white">
                          {translate('welcome.welcomeBannerTitle', language)}
                        </h3>
                        <p className="text-[11px] md:text-xs text-slate-200 max-w-xl leading-relaxed">
                          {translate('welcome.welcomeBannerDesc', language)}
                        </p>
                      </div>
                      
                      {/* Decorative glowing orb */}
                      <div className="absolute right-0 bottom-0 w-32 h-32 bg-[#102419]/20 rounded-full blur-2xl" />
                    </div>

                    {/* Quick Start Buttons */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{translate('welcome.quickActions', language)}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <button
                          onClick={() => setIsNewProjectModalOpen(true)}
                          className="bg-[#102419] hover:bg-[#102419] border border-[#0F3D34] hover:border-[#C8A96A]/50 p-4 rounded-xl text-left transition group space-y-2.5"
                        >
                          <div className="w-9 h-9 rounded-lg bg-[#C8A96A]/20 flex items-center justify-center text-[#C8A96A] border border-[#C8A96A]/30 group-hover:scale-110 transition-transform">
                            <Plus className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-200">{translate('welcome.createProject', language)}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{translate('welcome.createProjectDesc', language)}</p>
                          </div>
                        </button>

                        <button
                          onClick={triggerLocalFileLoad}
                          className="bg-[#102419] hover:bg-[#102419] border border-[#0F3D34] hover:border-[#102419] p-4 rounded-xl text-left transition group space-y-2.5"
                        >
                          <div className="w-9 h-9 rounded-lg bg-[#102419]/20 flex items-center justify-center text-[#C8A96A] border border-[#102419]/30 group-hover:scale-110 transition-transform">
                            <FolderOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-200">{translate('welcome.openFile', language) || 'Abrir Archivo'}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{translate('welcome.openFileDesc', language)}</p>
                          </div>
                        </button>

                        <button
                          onClick={() => { setActiveTab('plantillas'); }}
                          className="bg-[#102419] hover:bg-[#102419] border border-[#0F3D34] hover:border-[#102419] p-4 rounded-xl text-left transition group space-y-2.5"
                        >
                          <div className="w-9 h-9 rounded-lg bg-[#102419] flex items-center justify-center text-[#C8A96A] border border-[#102419] group-hover:scale-110 transition-transform">
                            <Image className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-200">{translate('welcome.loadTemplate', language)}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{translate('welcome.loadTemplateDesc', language)}</p>
                          </div>
                        </button>

                        <button
                          onClick={() => { setActiveTab('manual'); }}
                          className="bg-[#102419] hover:bg-[#102419] border border-[#0F3D34] hover:border-[#102419] p-4 rounded-xl text-left transition group space-y-2.5"
                        >
                          <div className="w-9 h-9 rounded-lg bg-[#102419] flex items-center justify-center text-amber-300 border border-[#102419] group-hover:scale-110 transition-transform">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-200">{translate('welcome.shortcutsGuide', language)}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{translate('welcome.shortcutsGuideDesc', language)}</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Tip Bar & Storage Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Tip box */}
                      <div className="bg-[#102419] border border-[#0F3D34] rounded-xl p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#102419] border border-[#102419] flex items-center justify-center text-[#C8A96A] shrink-0 mt-0.5">
                          <Sliders className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-200">{translate('welcome.didYouKnow', language)}</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{currentTip}</p>
                        </div>
                      </div>

                      {/* Storage and backup tip */}
                      <div className="bg-[#102419] border border-[#0F3D34] rounded-xl p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#102419] border border-[#102419] flex items-center justify-center text-[#C8A96A] shrink-0 mt-0.5">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-200">{translate('welcome.storageInfoTitle', language)}</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {translate('welcome.storageInfoDesc', language)}
                          </p>
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* --- MIS PROYECTOS TAB --- */}
                {activeTab === 'proyectos' && (
                  <div className="space-y-4 h-full flex flex-col justify-between">
                    
                    {/* Filter and search bars */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder={translate('welcome.searchProjectPlaceholder', language)}
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          className="w-full bg-[#102419] border border-[#0F3D34] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#C8A96A] transition"
                        />
                      </div>
                      
                      <div className="flex bg-[#102419] border border-[#0F3D34] rounded-lg p-0.5 shrink-0">
                        {[
                          { id: 'all', label: translate('welcome.filterAll', language) },
                          { id: 'favorites', label: translate('welcome.filterFavorites', language) }
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            onClick={() => setProjectFilter(btn.id as any)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition uppercase tracking-wider ${
                              projectFilter === btn.id 
                                ? 'bg-[#102419] text-white' 
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Projects Listing Area Grid */}
                    <div className="flex-1 overflow-y-auto mt-2 min-h-0">
                      {filteredProjects.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2 border border-[#0F3D34] border-dashed rounded-xl">
                          <FolderOpen className="w-8 h-8 text-slate-500" />
                          <p className="text-xs">{translate('welcome.noSavedProjects', language)}</p>
                          <p className="text-[10px] text-slate-500">{translate('welcome.noSavedProjectsDesc', language)}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                          {filteredProjects.map((p) => {
                            const isFav = favorites.includes(p.id);
                            const lastSavedDate = new Date(p.lastSaved).toLocaleDateString();
                            return (
                              <div
                                key={p.id}
                                onClick={() => handleOpenLocalProject(p)}
                                className="bg-[#102419] hover:bg-[#102419] border border-[#0F3D34] hover:border-[#C8A96A]/40 rounded-xl p-4 flex items-start gap-4 cursor-pointer transition relative group shadow-md"
                              >
                                {/* Thumbnail preview placeholder with pixel grid icon */}
                                <div className="w-16 h-16 bg-[#102419] border border-[#0F3D34] rounded-lg flex flex-col items-center justify-center text-slate-400 p-2 select-none shrink-0 relative overflow-hidden group-hover:border-[#C8A96A]/50 transition-colors">
                                  <svg viewBox="0 0 16 16" className="w-full h-full select-none text-slate-400 group-hover:text-[#C8A96A] transition-colors" style={{ imageRendering: 'pixelated' }}>
                                    <rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" />
                                    <rect x="4" y="4" width="3" height="3" fill="currentColor" />
                                    <rect x="9" y="8" width="4" height="4" fill="currentColor" />
                                    <rect x="5" y="10" width="2" height="2" fill="currentColor" />
                                  </svg>
                                  <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-center text-slate-300 font-mono py-0.5 border-t border-[#0F3D34]">
                                    {p.width}x{p.height}
                                  </div>
                                </div>

                                {/* Metadata and information */}
                                <div className="flex-1 min-w-0 space-y-1 pr-6">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-200 truncate block group-hover:text-[#C8A96A] transition-colors" title={p.name}>
                                      {p.name}
                                    </span>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-slate-400 font-mono">
                                    <span>{translate('welcome.layersCount', language, { count: p.layers?.length || 1 })}</span>
                                    <span>•</span>
                                    <span>{translate('welcome.framesCount', language, { count: p.frames?.length || 1 })}</span>
                                    <span>•</span>
                                    <span>{getProjectSizeString(p)}</span>
                                    <span>•</span>
                                    <span>{lastSavedDate}</span>
                                  </div>

                                  {p.tags && p.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {p.tags.map((t, idx) => (
                                        <span key={idx} className="text-[8px] bg-[#102419] text-slate-300 px-1 py-0.5 rounded border border-[#0F3D34]">
                                          #{t}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Favorite Star Toggle */}
                                <button
                                  onClick={(e) => toggleFavorite(p.id, e)}
                                  className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
                                    isFav ? 'text-[#C8A96A] hover:bg-[#102419]' : 'text-slate-500 hover:text-slate-300 hover:bg-[#102419]'
                                  }`}
                                  title={isFav ? (translate('welcome.removeFromFavs', language) || 'Quitar de favoritos') : (translate('welcome.addToFavs', language) || 'Agregar a favoritos')}
                                >
                                  <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-[#C8A96A]' : ''}`} />
                                </button>

                                {/* Hover action buttons for management */}
                                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                  <button
                                    onClick={(e) => handleRenameProject(p, e)}
                                    className="p-1.5 rounded bg-[#102419] text-slate-300 hover:text-white hover:bg-[#102419] transition"
                                    title={translate('welcome.rename', language) || 'Renombrar'}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDuplicateProject(p, e)}
                                    className="p-1.5 rounded bg-[#102419] text-slate-300 hover:text-white hover:bg-[#102419] transition"
                                    title={translate('welcome.duplicate', language) || 'Duplicar'}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteProject(p, e)}
                                    className="p-1.5 rounded bg-[#102419] text-rose-400 hover:text-white hover:bg-rose-600 transition"
                                    title={translate('welcome.delete', language) || 'Eliminar'}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* --- PLANTILLAS TAB --- */}
                {activeTab === 'plantillas' && (
                  <div className="space-y-6">
                    
                    {/* Header bar and save custom as template */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#102419] p-4 border border-[#0F3D34] rounded-xl">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-200">{translate('welcome.reusableProjectPrompt', language)}</h4>
                        <p className="text-[10px] text-slate-400">{translate('welcome.reusableProjectDesc', language)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={templateInputRef}
                          onChange={handleImportCustomTemplate}
                          accept=".json"
                          className="hidden"
                        />
                        <button
                          onClick={() => templateInputRef.current?.click()}
                          className="bg-[#102419] hover:bg-[#102419] text-slate-200 border border-[#0F3D34] px-3 py-2 rounded-lg text-xs font-bold tracking-wide transition flex items-center gap-1.5 shrink-0"
                        >
                          <Upload className="w-4 h-4" /> {translate('welcome.importTemplateBtn', language)}
                        </button>
                        <button
                          onClick={handleSaveAsCustomTemplate}
                          disabled={!currentProject}
                          className="bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] disabled:opacity-40 px-3 py-2 rounded-lg text-xs font-bold tracking-wide transition flex items-center gap-1.5 text-white shadow-lg shrink-0"
                        >
                          <Plus className="w-4 h-4" /> {translate('welcome.saveActiveAsTemplateBtn', language)}
                        </button>
                      </div>
                    </div>

                    {/* Official Templates List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{translate('welcome.officialTemplates', language)}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {presetTemplates.map((tpl) => {
                          const Icon = tpl.icon;
                          return (
                            <div
                              key={tpl.id}
                              onClick={() => handleLoadTemplate(tpl)}
                              className="bg-[#102419] hover:bg-[#102419] border border-[#0F3D34] hover:border-[#C8A96A]/40 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition h-40 shadow-sm group"
                            >
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <div className="w-8 h-8 rounded-lg bg-[#102419] border border-[#102419] flex items-center justify-center text-[#C8A96A]">
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <span className="text-[8px] bg-[#102419] text-slate-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-[#0F3D34]">
                                    {tpl.category}
                                  </span>
                                </div>
                                <h5 className="font-bold text-xs text-slate-200 group-hover:text-[#C8A96A] transition-colors">{tpl.name}</h5>
                                <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{tpl.description}</p>
                              </div>
                              <div className="border-t border-[#0F3D34] pt-2 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                <span>{translate('welcome.dimensionsLabel', language, { w: tpl.width, h: tpl.height })}</span>
                                {tpl.framesCount && <span>{translate('welcome.framesCountLabel', language, { count: tpl.framesCount })}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom templates list */}
                    {customTemplates.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{translate('welcome.myCustomTemplates', language)}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {customTemplates.map((tpl) => (
                            <div
                              key={tpl.id}
                              onClick={() => handleOpenLocalProject(tpl.projectData)}
                              className="bg-[#102419] hover:bg-[#102419] border border-[#0F3D34] hover:border-[#C8A96A]/40 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition h-40 shadow-sm relative group"
                            >
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <div className="w-8 h-8 rounded-lg bg-[#102419] border border-[#102419] flex items-center justify-center text-[#C8A96A]">
                                    <Layout className="w-4 h-4" />
                                  </div>
                                  <span className="text-[8px] bg-[#102419] text-[#C8A96A] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-[#0F3D34]">
                                    {translate('welcome.userTag', language)}
                                  </span>
                                </div>
                                <h5 className="font-bold text-xs text-slate-200 group-hover:text-[#C8A96A] transition-colors">{tpl.name}</h5>
                                <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{tpl.description}</p>
                              </div>
                              
                              <div className="absolute bottom-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => handleExportCustomTemplate(tpl, e)}
                                  className="p-1.5 rounded bg-[#102419] text-slate-300 hover:text-white hover:bg-[#102419] transition"
                                  title={translate('welcome.exportTemplateJsonTooltip', language)}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteCustomTemplate(tpl.id, e)}
                                  className="p-1.5 rounded bg-[#102419] text-rose-400 hover:text-white hover:bg-rose-600 transition"
                                  title={translate('welcome.deleteTemplateTooltip', language)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="border-t border-[#0F3D34] pt-2 text-[9px] text-slate-400 font-mono">
                                {translate('welcome.canvasDim', language, { w: tpl.width, h: tpl.height })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* --- MIS WORKSPACE PRESETS TAB --- */}
                {activeTab === 'presets' && (
                  <div className="space-y-6">
                    
                    {/* Active preset save banner */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#102419] p-4 border border-[#0F3D34] rounded-xl">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-200">{translate('welcome.loveCurrentConfig', language)}</h4>
                        <p className="text-[10px] text-slate-400">{translate('welcome.loveCurrentConfigDesc', language)}</p>
                      </div>
                      <button
                        onClick={handleSaveActiveAsPreset}
                        className="bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] px-3 py-2 rounded-lg text-xs font-bold tracking-wide transition flex items-center gap-1.5 text-white shadow-lg shrink-0"
                      >
                        <Plus className="w-4 h-4" /> {translate('welcome.saveCurrentSpace', language)}
                      </button>
                    </div>

                    {/* Official Workspace Presets */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{translate('welcome.officialPresets', language)}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {defaultPresets.map((pr) => (
                          <div
                            key={pr.id}
                            onClick={() => handleApplyPreset(pr)}
                            className="bg-[#102419] hover:bg-[#102419] border border-[#0F3D34] hover:border-[#C8A96A]/40 rounded-xl p-5 cursor-pointer transition shadow-sm flex items-start gap-4 group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-[#102419] border border-[#102419] flex items-center justify-center text-[#C8A96A] group-hover:scale-105 transition-transform shrink-0">
                              <Sliders className="w-5 h-5" />
                            </div>
                            <div className="space-y-1.5 min-w-0">
                              <h5 className="font-bold text-xs text-slate-200 group-hover:text-[#C8A96A] transition-colors">{pr.name}</h5>
                              <p className="text-[10px] text-slate-400 leading-relaxed">{pr.description}</p>
                              
                              {/* Small badges showing configs to apply */}
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {pr.settings.onionSkin && (
                                  <span className="text-[8px] bg-[#102419] text-slate-300 px-1.5 py-0.5 rounded border border-[#0F3D34]">{translate('welcome.onionBadge', language)}</span>
                                )}
                                {pr.settings.gridVisible && (
                                  <span className="text-[8px] bg-[#102419] text-slate-300 px-1.5 py-0.5 rounded border border-[#0F3D34]">{translate('welcome.gridBadge', language)}</span>
                                )}
                                {pr.settings.timelineVisible && (
                                  <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{translate('welcome.timelineBadge', language)}</span>
                                )}
                                {pr.settings.brushSize && pr.settings.brushSize > 1 && (
                                  <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{translate('welcome.brushBadge', language, { size: pr.settings.brushSize })}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Custom presets */}
                    {customPresets.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{translate('welcome.mySavedPresets', language)}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {customPresets.map((pr) => (
                            <div
                              key={pr.id}
                              onClick={() => handleApplyPreset(pr)}
                              className="bg-[#102419] hover:bg-[#102419] border border-[#0F3D34] hover:border-[#C8A96A]/40 rounded-xl p-5 cursor-pointer transition shadow-sm flex items-start gap-4 relative group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-[#102419]/20 border border-[#102419]/40 flex items-center justify-center text-[#C8A96A] shrink-0">
                                <Sliders className="w-5 h-5" />
                              </div>
                              <div className="space-y-1.5 min-w-0 pr-6">
                                <h5 className="font-bold text-xs text-slate-200 group-hover:text-[#C8A96A] transition-colors">{pr.name}</h5>
                                <p className="text-[10px] text-slate-400 leading-relaxed">{pr.description}</p>
                              </div>

                              <button
                                onClick={(e) => handleDeletePreset(pr.id, e)}
                                className="absolute top-5 right-5 p-1.5 rounded bg-slate-800 text-rose-400 hover:text-white hover:bg-rose-600 transition opacity-0 group-hover:opacity-100"
                                title={translate('welcome.deletePresetTooltip', language)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* --- HISTORIAL DE EXPORTACIONES --- */}
                {activeTab === 'historial' && (
                  <div className="space-y-4">
                    
                    <div className="bg-[#102419] p-4 border border-[#0F3D34] rounded-xl flex items-center gap-3">
                      <History className="w-5 h-5 text-[#C8A96A] shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{translate('welcome.exportLogTitle', language)}</h4>
                        <p className="text-[10px] text-slate-400">{translate('welcome.exportLogDesc', language)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {exportHistory.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-1.5 border border-[#0F3D34] border-dashed rounded-xl">
                          <History className="w-6 h-6 text-slate-500" />
                          <p className="text-xs">{translate('welcome.noExportHistory', language)}</p>
                          <p className="text-[10px] text-slate-500">{translate('welcome.noExportHistoryDesc', language)}</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
                          {exportHistory.map((item) => {
                            const dateStr = new Date(item.timestamp).toLocaleString();
                            const isGIF = item.pluginId?.toLowerCase() === 'gif';
                            const isAPNG = item.pluginId?.toLowerCase() === 'apng';
                            return (
                              <div
                                key={item.id}
                                className="bg-[#102419] border border-[#0F3D34] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#102419] border border-[#0F3D34] flex items-center justify-center shrink-0">
                                    {isGIF || isAPNG ? (
                                      <Video className="w-4 h-4 text-[#C8A96A]" />
                                    ) : (
                                      <Image className="w-4 h-4 text-[#C8A96A]" />
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <h5 className="font-bold text-xs text-slate-200">{item.projectName || translate('welcome.unnamedProject', language)}</h5>
                                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-mono">
                                      <span className="text-slate-300 uppercase font-semibold">{item.pluginName || item.pluginId}</span>
                                      <span>•</span>
                                      <span>{translate('welcome.scaleLabel', language, { scale: item.scale, w: item.width, h: item.height })}</span>
                                      <span>•</span>
                                      <span>{dateStr}</span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleRepeatExport(item)}
                                  className="self-end sm:self-center bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] border border-[#0F3D34] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition flex items-center gap-1 shrink-0"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" /> {translate('welcome.repeatExport', language)}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* --- MANUAL DE USUARIO TAB --- */}
                {activeTab === 'manual' && (
                  <div className="space-y-6">
                    
                    {/* Header quick helper */}
                    <div className="bg-[#102419] p-5 border border-[#0F3D34] rounded-xl flex items-center gap-4">
                      <BookOpen className="w-6 h-6 text-[#C8A96A] shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{translate('welcome.userGuideTitle', language)}</h4>
                        <p className="text-[10px] text-slate-400">{translate('welcome.userGuideDesc', language)}</p>
                      </div>
                    </div>

                    {/* Divided Help Topics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Atajos Rápidos de Teclado */}
                      <div className="bg-[#102419] border border-[#0F3D34] rounded-xl p-5 space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Keyboard className="w-4 h-4 text-[#C8A96A]" /> {translate('welcome.quickKeyboardShortcuts', language)}
                        </h5>
                        <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                          <div className="flex justify-between border-b border-[#0F3D34] pb-1">
                            <span>{translate('welcome.penShortcut', language)}</span>
                            <span className="text-[#C8A96A] font-bold bg-[#102419] px-1.5 py-0.5 rounded">[ B ]</span>
                          </div>
                          <div className="flex justify-between border-b border-[#0F3D34] pb-1">
                            <span>{translate('welcome.eraserShortcut', language)}</span>
                            <span className="text-[#C8A96A] font-bold bg-[#102419] px-1.5 py-0.5 rounded">[ E ]</span>
                          </div>
                          <div className="flex justify-between border-b border-[#0F3D34] pb-1">
                            <span>{translate('welcome.bucketShortcut', language)}</span>
                            <span className="text-[#C8A96A] font-bold bg-[#102419] px-1.5 py-0.5 rounded">[ G ]</span>
                          </div>
                          <div className="flex justify-between border-b border-[#0F3D34] pb-1">
                            <span>{translate('welcome.pickerShortcut', language)}</span>
                            <span className="text-[#C8A96A] font-bold bg-[#102419] px-1.5 py-0.5 rounded">[ I ]</span>
                          </div>
                          <div className="flex justify-between border-b border-[#0F3D34] pb-1">
                            <span>{translate('welcome.undoShortcut', language)}</span>
                            <span className="text-[#C8A96A] font-bold bg-[#102419] px-1.5 py-0.5 rounded">[ Ctrl + Z ]</span>
                          </div>
                          <div className="flex justify-between border-b border-[#0F3D34] pb-1">
                            <span>{translate('welcome.redoShortcut', language)}</span>
                            <span className="text-[#C8A96A] font-bold bg-[#102419] px-1.5 py-0.5 rounded">[ Ctrl + Y ]</span>
                          </div>
                        </div>
                      </div>

                      {/* Guías de Animación */}
                      <div className="bg-[#102419] border border-[#0F3D34] rounded-xl p-5 space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Video className="w-4 h-4 text-[#C8A96A]" /> {translate('welcome.animFlowsTitle', language)}
                        </h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {translate('welcome.animFlowsDesc1', language)}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {translate('welcome.animFlowsDesc2', language)}
                        </p>
                      </div>

                    </div>

                  </div>
                )}

                {/* --- DONATION SYSTEM TAB --- */}
                {activeTab === 'apoyar' && (
                  <div className="space-y-6">
                    
                    <div className="bg-gradient-to-r from-[#102419]/30 via-[#0F3D34] to-[#0F3D34] border border-[#102419]/40 p-6 rounded-2xl relative overflow-hidden shadow-lg space-y-3 text-center">
                      <div className="mx-auto w-12 h-12 rounded-full bg-[#102419]/30 border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A]">
                        <Heart className="w-6 h-6 fill-[#C8A96A]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-extrabold text-white">{translate('welcome.supportTitle', language)}</h4>
                        <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                          {translate('welcome.supportDesc', language)}
                        </p>
                      </div>
                    </div>

                    {!donationSuccess ? (
                      <div className="space-y-6">
                        
                        {/* Donation Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {donationTiers.map((tier) => {
                            const Icon = tier.icon;
                            const isSelected = selectedDonationTier === tier.id;
                            return (
                              <div
                                key={tier.id}
                                onClick={() => setSelectedDonationTier(tier.id)}
                                className={`bg-[#102419] hover:bg-[#102419] border cursor-pointer p-5 rounded-2xl transition flex flex-col justify-between h-56 shadow-sm ${
                                  isSelected 
                                    ? 'border-[#C8A96A] bg-[#102419] ring-1 ring-[#C8A96A]/40 shadow-[#C8A96A]/10' 
                                    : 'border-[#0F3D34] hover:border-[#0F3D34]'
                                }`}
                              >
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <div className="p-2 rounded-lg bg-[#102419] border border-[#0F3D34] text-slate-300 shrink-0">
                                      <Icon className="w-4 h-4 text-[#C8A96A]" />
                                    </div>
                                    <span className="text-xs font-extrabold bg-[#102419] text-[#C8A96A] px-2.5 py-1 rounded-full border border-[#0F3D34]">
                                      {tier.amount}
                                    </span>
                                  </div>
                                  <h5 className="font-bold text-xs text-slate-200">{tier.name}</h5>
                                  <p className="text-[10px] text-slate-400 leading-relaxed">{tier.desc}</p>
                                </div>
                                <div className="text-[10px] text-[#C8A96A] font-bold flex items-center gap-1 pt-2 border-t border-[#0F3D34] mt-2 shrink-0">
                                  <span>{tier.perk}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Payment Simulation parameters */}
                        {selectedDonationTier && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#102419] border border-[#0F3D34] p-4 rounded-xl space-y-4 max-w-md mx-auto"
                          >
                            <h5 className="text-xs font-bold text-slate-200">{translate('welcome.supportSimulation', language)}</h5>
                            <div className="space-y-3 text-left">
                              {selectedDonationTier === 'tier-free' && (
                                <div className="space-y-1">
                                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{translate('welcome.donationAmountUsd', language)}</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-2 text-xs text-slate-400">$</span>
                                    <input
                                      type="number"
                                      min="1"
                                      placeholder={translate('welcome.amountPlaceholder', language)}
                                      value={customDonationAmount}
                                      onChange={(e) => setCustomDonationAmount(e.target.value)}
                                      className="w-full bg-[#102419] border border-[#0F3D34] pl-7 pr-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#C8A96A] transition"
                                    />
                                  </div>
                                </div>
                              )}
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{translate('welcome.donorNameLabel', language)}</label>
                                <input
                                  type="text"
                                  placeholder={translate('welcome.donorNamePlaceholder', language)}
                                  value={donatorName}
                                  onChange={(e) => setDonatorName(e.target.value)}
                                  className="w-full bg-[#102419] border border-[#0F3D34] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#C8A96A] transition"
                                />
                              </div>
                              <button
                                onClick={handleConfirmDonation}
                                className="w-full bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] px-4 py-2 rounded-lg text-xs font-bold text-white transition flex items-center justify-center gap-1 shadow-md"
                              >
                                <Heart className="w-4 h-4 fill-white" /> {translate('welcome.makeSimulatedDonation', language)}
                              </button>
                            </div>
                          </motion.div>
                        )}

                      </div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#102419] border border-[#0F3D34] p-8 rounded-2xl text-center max-w-md mx-auto space-y-4"
                      >
                        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Check className="w-6 h-6 stroke-[3]" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-white text-base">{translate('welcome.thankYouDonor', language, { name: donatorName })}</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {translate('welcome.donationProcessedDesc', language, { amount: selectedDonationTier === 'tier-free' ? `$${customDonationAmount} USD` : donationTiers.find(t => t.id === selectedDonationTier)?.amount })}
                          </p>
                        </div>
                        <button
                          onClick={() => { setDonationSuccess(false); setSelectedDonationTier(null); setDonatorName(''); setCustomDonationAmount('10'); }}
                          className="bg-[#102419] hover:bg-[#102419] text-slate-200 px-4 py-2 rounded-lg text-xs font-semibold transition"
                        >
                          {translate('welcome.backToSupport', language)}
                        </button>
                      </motion.div>
                    )}

                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>

      {/* --- RENAME/CONFIRM PROMPT OVERLAY --- */}
      {activePrompt && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-[#102419] border border-[#0F3D34] p-5 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl">
            <h4 className="font-bold text-xs uppercase text-[#C8A96A] tracking-wider">{activePrompt.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{activePrompt.description}</p>
            {activePrompt.defaultValue !== '' && (
              <input
                type="text"
                defaultValue={activePrompt.defaultValue}
                id="prompt-input"
                className="w-full bg-[#102419] border border-[#0F3D34] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#C8A96A] transition"
              />
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setActivePrompt(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#102419] hover:bg-[#102419] text-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('prompt-input') as HTMLInputElement | null;
                  const value = input ? input.value : '';
                  activePrompt.onConfirm(value);
                  setActivePrompt(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] text-white transition"
              >
                {activePrompt.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW PROJECT CREATOR MODAL --- */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-[#102419] border border-[#0F3D34] p-6 rounded-2xl w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#0F3D34] pb-2">
              <h4 className="font-extrabold text-xs text-[#C8A96A] uppercase tracking-wider">{translate('canvas.newProject', language) || 'Nuevo Lienzo'}</h4>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{translate('canvas.width', language) || 'Ancho'} (px)</label>
                  <input
                    type="number"
                    min="4"
                    max="600"
                    value={newWidth}
                    onChange={(e) => setNewWidth(Math.max(4, Math.min(600, parseInt(e.target.value) || 32)))}
                    className="w-full bg-[#102419] border border-[#0F3D34] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#C8A96A]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{translate('canvas.height', language) || 'Alto'} (px)</label>
                  <input
                    type="number"
                    min="4"
                    max="600"
                    value={newHeight}
                    onChange={(e) => setNewHeight(Math.max(4, Math.min(600, parseInt(e.target.value) || 32)))}
                    className="w-full bg-[#102419] border border-[#0F3D34] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#C8A96A]"
                  />
                </div>
              </div>

              {/* Fast size selections */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">{translate('welcome.presetCategorySmall', language) || 'Resoluciones'}</label>
                <div className="flex flex-wrap gap-1.5">
                  {[16, 32, 48, 64, 128, 256, 512].map((size) => (
                    <button
                      key={size}
                      onClick={() => { setNewWidth(size); setNewHeight(size); }}
                      className="bg-[#102419] hover:bg-[#102419] text-slate-200 text-xs px-2.5 py-1 rounded transition border border-[#0F3D34]"
                    >
                      {size}x{size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background fill color options */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{translate('canvas.initialBg', language) || 'Fondo Inicial'}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setBgType('transparent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                      bgType === 'transparent' ? 'bg-[#102419] border-[#C8A96A] text-[#C8A96A]' : 'bg-[#102419] border-[#0F3D34] text-slate-400'
                    }`}
                  >
                    {translate('canvas.transparent', language) || 'Transparente'}
                  </button>
                  <button
                    onClick={() => setBgType('white')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                      bgType === 'white' ? 'bg-[#102419] border-[#C8A96A] text-[#C8A96A]' : 'bg-[#102419] border-[#0F3D34] text-slate-400'
                    }`}
                  >
                    {translate('canvas.solidWhite', language) || 'Blanco Sólido'}
                  </button>
                  <button
                    onClick={() => setBgType('color')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                      bgType === 'color' ? 'bg-[#102419] border-[#C8A96A] text-[#C8A96A]' : 'bg-[#102419] border-[#0F3D34] text-slate-400'
                    }`}
                  >
                    {translate('canvas.customColor', language) || 'Color Lleno'}
                  </button>
                </div>

                {bgType === 'color' && (
                  <div className="flex gap-2 items-center pt-1.5">
                    <input
                      type="color"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-[#0F3D34] bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="w-full bg-[#102419] border border-[#0F3D34] px-3 py-1.5 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-[#0F3D34]">
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#102419] hover:bg-[#102419] text-slate-300 transition"
              >
                {translate('common.cancel', language)}
              </button>
              <button
                onClick={handleNewProjectSubmit}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] text-white transition shadow-lg"
              >
                {translate('headerMenu.create', language as any) || 'Crear Lienzo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden natively triggered input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.onepixel"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

// Simple auxiliary localized icon component fallback
function SmileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" x2="9.01" y1="9" y2="9" />
      <line x1="15" x2="15.01" y1="9" y2="9" />
    </svg>
  );
}
