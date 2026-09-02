import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Keyboard, 
  Sparkles, 
  X, 
  Search, 
  RefreshCw, 
  Download, 
  Upload, 
  Edit2, 
  Key, 
  AlertTriangle, 
  Check, 
  Compass,
  Layers,
  Film,
  Zap,
  Gamepad2,
  FileText,
  Sliders
} from 'lucide-react';
import { 
  getManualSections, 
  getWorkflowGuides,
  getProTips,
  ManualSection, 
  WorkflowGuide,
  ProTip 
} from '../data/helpContent';
import { defaultKeyBindings, KeyBinding } from '../utils/shortcuts';
import { LanguageCode } from '../i18n/types';
import { translate } from '../i18n';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
  onStartTour?: () => void;
  initialTab?: 'manual' | 'workflows' | 'tips' | 'shortcuts';
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({
  isOpen,
  onClose,
  language = 'es',
  onStartTour,
  initialTab = 'manual'
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'workflows' | 'tips' | 'shortcuts'>(initialTab);
  
  // Tab 1: Manual state
  const manualSections = getManualSections(language);
  const [selectedSectionId, setSelectedSectionId] = useState<string>(manualSections[0]?.id || 'intro');
  const [manualSearch, setManualSearch] = useState<string>('');

  // Tab 2: Workflow guides state
  const workflowGuides = getWorkflowGuides(language);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflowGuides[0]?.id || 'wf_create');
  const [workflowCategory, setWorkflowCategory] = useState<string>('all');

  // Tab 3: Pro Tips state
  const proTips = getProTips(language);
  const [tipCategoryFilter, setTipCategoryFilter] = useState<string>('all');

  // Tab 4: Shortcuts state
  const [shortcutsList, setShortcutsList] = useState<KeyBinding[]>([]);
  const [shortcutSearch, setShortcutSearch] = useState<string>('');
  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null);
  const [listenKeys, setListenKeys] = useState<{ key: string; ctrl: boolean; shift: boolean; alt: boolean } | null>(null);
  const [shortcutConflict, setShortcutConflict] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize shortcuts from local storage or defaults
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pixel_art_custom_shortcuts');
      if (stored) {
        setShortcutsList(JSON.parse(stored));
      } else {
        setShortcutsList(defaultKeyBindings);
      }
    } catch (e) {
      setShortcutsList(defaultKeyBindings);
    }
  }, []);

  // Update initial tab when opening
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Handle escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editingShortcutId && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editingShortcutId, onClose]);

  // Shortcut key listener overlay
  useEffect(() => {
    if (!editingShortcutId) return;

    const handleGrabKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

      const keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      const newModifiers = {
        key: keyName,
        ctrl: e.ctrlKey || e.metaKey,
        shift: e.shiftKey,
        alt: e.altKey
      };

      setListenKeys(newModifiers);

      // Check conflict
      const conflict = shortcutsList.find(
        s => s.id !== editingShortcutId &&
             s.key.toUpperCase() === keyName.toUpperCase() &&
             !!s.ctrl === newModifiers.ctrl &&
             !!s.shift === newModifiers.shift &&
             !!s.alt === newModifiers.alt
      );

      if (conflict) {
        setShortcutConflict(conflict.description || conflict.id);
      } else {
        setShortcutConflict(null);
      }
    };

    window.addEventListener('keydown', handleGrabKey, true);
    return () => window.removeEventListener('keydown', handleGrabKey, true);
  }, [editingShortcutId, shortcutsList]);

  if (!isOpen) return null;

  // Selected manual section
  const selectedManualSection = manualSections.find(s => s.id === selectedSectionId) || manualSections[0];

  // Filtered manual sections
  const filteredManualSections = manualSections.filter(s => 
    s.title.toLowerCase().includes(manualSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(manualSearch.toLowerCase()) ||
    s.content.toLowerCase().includes(manualSearch.toLowerCase())
  );

  // Group manual sections by category
  const manualCategories = Array.from(new Set(filteredManualSections.map(s => s.category)));

  // Workflow guide filter
  const workflowCategories = ['all', ...Array.from(new Set(workflowGuides.map(w => w.category)))];
  const filteredWorkflows = workflowGuides.filter(w => 
    workflowCategory === 'all' || w.category === workflowCategory
  );
  const selectedWorkflow = workflowGuides.find(w => w.id === selectedWorkflowId) || filteredWorkflows[0];

  // Pro Tips categories
  const tipCategories = ['all', ...Array.from(new Set(proTips.map(t => t.category)))];
  const filteredProTips = proTips.filter(t => 
    tipCategoryFilter === 'all' || t.category === tipCategoryFilter
  );

  // Shortcut helpers
  const startEditingShortcut = (id: string, current: KeyBinding) => {
    setEditingShortcutId(id);
    setListenKeys({
      key: current.key,
      ctrl: !!current.ctrl,
      shift: !!current.shift,
      alt: !!current.alt
    });
    setShortcutConflict(null);
  };

  const stopEditingShortcut = () => {
    setEditingShortcutId(null);
    setListenKeys(null);
    setShortcutConflict(null);
  };

  const saveShortcutChanges = () => {
    if (!editingShortcutId || !listenKeys) return;
    const updated = shortcutsList.map(s => {
      if (s.id === editingShortcutId) {
        return {
          ...s,
          key: listenKeys.key,
          ctrl: listenKeys.ctrl,
          shift: listenKeys.shift,
          alt: listenKeys.alt
        };
      }
      return s;
    });
    setShortcutsList(updated);
    localStorage.setItem('pixel_art_custom_shortcuts', JSON.stringify(updated));
    stopEditingShortcut();
  };

  const restoreDefaultShortcuts = () => {
    if (window.confirm('¿Deseas restaurar todas las combinaciones de teclas por defecto?')) {
      setShortcutsList(defaultKeyBindings);
      localStorage.removeItem('pixel_art_custom_shortcuts');
    }
  };

  const exportShortcutsFile = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(shortcutsList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'onepixel-shortcuts.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportShortcuts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setShortcutsList(imported);
          localStorage.setItem('pixel_art_custom_shortcuts', JSON.stringify(imported));
        }
      } catch (err) {
        alert('Archivo de atajos no válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/85 z-[9999] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm select-none font-sans"
      id="help-center-modal"
    >
      <div className="bg-[#0c1a12] border border-[#0F3D34] rounded-2xl w-full max-w-5xl h-[92vh] max-h-[880px] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden">
        
        {/* TOP BAR: Brand, Tabs & Close */}
        <div className="bg-[#102419] border-b border-[#0F3D34] px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0F3D34] border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A] shadow-inner font-extrabold text-sm">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-[#C8A96A] uppercase tracking-widest block">
                OnePixel Studio
              </span>
              <h2 className="text-sm font-extrabold text-white leading-tight">
                Centro de Documentación y Guías
              </h2>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-[#08120d] p-1 rounded-xl border border-[#0F3D34] gap-1">
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'manual'
                  ? 'bg-[#C8A96A] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0F3D34]/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Manual de Usuario</span>
            </button>

            <button
              onClick={() => setActiveTab('workflows')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'workflows'
                  ? 'bg-[#C8A96A] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0F3D34]/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Flujos de Trabajo</span>
            </button>

            <button
              onClick={() => setActiveTab('tips')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'tips'
                  ? 'bg-[#C8A96A] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0F3D34]/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>10 Consejos Pro</span>
            </button>

            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'shortcuts'
                  ? 'bg-[#C8A96A] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0F3D34]/50'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Atajos</span>
            </button>
          </div>

          {/* Quick Tour Button & Close */}
          <div className="flex items-center gap-2">
            {onStartTour && (
              <button
                onClick={() => {
                  onClose();
                  onStartTour();
                }}
                className="px-3 py-1.5 bg-[#0F3D34] hover:bg-[#155447] text-[#C8A96A] border border-[#C8A96A]/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
                title="Iniciar recorrido visual guiado por la interfaz"
              >
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Recorrido Interactivo</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#0F3D34] rounded-xl transition"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TAB 1: MANUAL DE USUARIO */}
        {activeTab === 'manual' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-64 md:w-72 bg-[#0c1a12] border-r border-[#0F3D34] flex flex-col shrink-0">
              <div className="p-3 border-b border-[#0F3D34]">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar en el manual..."
                    value={manualSearch}
                    onChange={(e) => setManualSearch(e.target.value)}
                    className="w-full bg-[#08120d] border border-[#0F3D34] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#C8A96A]"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                {manualCategories.map(cat => (
                  <div key={cat} className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-[#C8A96A] tracking-wider px-2 block">
                      {cat}
                    </span>
                    {filteredManualSections.filter(s => s.category === cat).map(sec => (
                      <button
                        key={sec.id}
                        onClick={() => setSelectedSectionId(sec.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold block transition ${
                          selectedSectionId === sec.id
                            ? 'bg-[#C8A96A]/20 text-[#C8A96A] font-bold border-l-2 border-[#C8A96A]'
                            : 'hover:bg-[#102419] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sec.title}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Reader Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-3xl mx-auto scrollbar-thin scrollbar-thumb-slate-800 leading-relaxed">
              <div className="space-y-2 border-b border-[#0F3D34] pb-4">
                <span className="text-[10px] uppercase font-bold text-[#C8A96A] tracking-widest block">
                  {selectedManualSection?.category}
                </span>
                <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                  {selectedManualSection?.title}
                </h1>
              </div>

              {/* Text Content */}
              <div className="text-xs md:text-sm text-slate-300 space-y-4 whitespace-pre-wrap leading-relaxed">
                {selectedManualSection?.content}
              </div>

              {/* Pro Tip Callout */}
              <div className="mt-8 border border-[#0F3D34] bg-[#102419]/60 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="w-9 h-9 bg-[#0F3D34] border border-[#C8A96A]/40 rounded-xl flex items-center justify-center text-[#C8A96A] font-bold text-sm shrink-0 shadow-md">
                  <Sparkles className="w-4 h-4 text-[#C8A96A]" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#C8A96A] block">
                    Consejo Clave de OnePixel Studio
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Mantén presionada la barra espaciadora en cualquier momento para desplazarte por el lienzo sin cambiar de herramienta activa. Usa la rueda del ratón para ampliar o reducir el zoom con precisión sobre el cursor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FLUJOS DE TRABAJO (13 Workflow Guides) */}
        {activeTab === 'workflows' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Guide Selector */}
            <div className="w-64 md:w-80 bg-[#0c1a12] border-r border-[#0F3D34] flex flex-col shrink-0">
              {/* Category Filter Pills */}
              <div className="p-3 border-b border-[#0F3D34] flex gap-1.5 overflow-x-auto no-scrollbar">
                {workflowCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setWorkflowCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition ${
                      workflowCategory === cat
                        ? 'bg-[#C8A96A] text-white shadow'
                        : 'bg-[#08120d] text-slate-400 hover:text-slate-200 border border-[#0F3D34]'
                    }`}
                  >
                    {cat === 'all' ? 'Todos' : cat}
                  </button>
                ))}
              </div>

              {/* Guide List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                {filteredWorkflows.map(wf => (
                  <button
                    key={wf.id}
                    onClick={() => setSelectedWorkflowId(wf.id)}
                    className={`w-full text-left p-3 rounded-xl transition flex flex-col gap-1 border ${
                      selectedWorkflowId === wf.id
                        ? 'bg-[#102419] border-[#C8A96A] text-white shadow-md'
                        : 'border-transparent hover:bg-[#102419]/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#08120d] text-[#C8A96A] border border-[#0F3D34]">
                        {wf.badge}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-100 leading-tight">
                      {wf.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Guide Reader Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-3xl mx-auto scrollbar-thin scrollbar-thumb-slate-800 leading-relaxed">
              <div className="space-y-2 border-b border-[#0F3D34] pb-4">
                <span className="text-[10px] uppercase font-bold text-[#C8A96A] tracking-widest block">
                  Guía Rápida de Flujo • {selectedWorkflow?.badge}
                </span>
                <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                  {selectedWorkflow?.title}
                </h1>
                <p className="text-xs text-slate-300">
                  {selectedWorkflow?.summary}
                </p>
              </div>

              {/* Steps List */}
              <div className="space-y-4">
                {selectedWorkflow?.steps.map((step, idx) => (
                  <div 
                    key={idx}
                    className="bg-[#102419]/60 border border-[#0F3D34] rounded-2xl p-4.5 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#0F3D34] text-[#C8A96A] font-extrabold text-xs flex items-center justify-center border border-[#C8A96A]/40">
                        {idx + 1}
                      </span>
                      <h3 className="font-extrabold text-sm text-white">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-7">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pro Tip Box */}
              {selectedWorkflow?.proTip && (
                <div className="mt-6 border border-[#0F3D34] bg-[#102419]/80 p-4.5 rounded-2xl flex items-start gap-3.5">
                  <div className="w-8 h-8 bg-[#0F3D34] border border-[#C8A96A]/40 rounded-xl flex items-center justify-center text-[#C8A96A] shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[#C8A96A] block">
                      Consejo Profesional
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedWorkflow.proTip}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: 10 CONSEJOS PROFESIONALES */}
        {activeTab === 'tips' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category Filter Pills */}
            <div className="px-6 py-3.5 border-b border-[#0F3D34] bg-[#102419] flex gap-2 overflow-x-auto no-scrollbar shrink-0">
              {tipCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setTipCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition ${
                    tipCategoryFilter === cat 
                      ? 'bg-[#C8A96A] text-white shadow-md' 
                      : 'bg-[#08120d] text-slate-400 hover:text-slate-200 border border-[#0F3D34]'
                  }`}
                >
                  {cat === 'all' ? 'Todos los Consejos' : cat}
                </button>
              ))}
            </div>

            {/* Grid of 10 Pro Tip Cards */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
                {filteredProTips.map(tip => (
                  <div 
                    key={tip.id} 
                    className="bg-[#102419]/70 border border-[#0F3D34] p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-[#C8A96A]/40 transition shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-extrabold text-[#C8A96A] bg-[#08120d] border border-[#0F3D34] px-2.5 py-0.5 rounded-full tracking-wider">
                          Consejo #{tip.number} • {tip.category}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm text-white leading-snug">
                        {tip.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {tip.description}
                      </p>
                    </div>

                    <div className="bg-[#08120d] border border-[#0F3D34] p-3 rounded-xl flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block">
                          Recomendación Práctica
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {tip.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ATAJOS DE TECLADO */}
        {activeTab === 'shortcuts' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar Atajos */}
            <div className="px-5 py-3 border-b border-[#0F3D34] bg-[#102419] flex flex-wrap gap-4 items-center justify-between shrink-0">
              <div className="relative w-full max-w-xs shrink-0">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar atajo de teclado..."
                  value={shortcutSearch}
                  onChange={(e) => setShortcutSearch(e.target.value)}
                  className="w-full bg-[#08120d] border border-[#0F3D34] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#C8A96A]"
                />
              </div>

              <div className="flex gap-2 items-center">
                <button
                  onClick={restoreDefaultShortcuts}
                  className="px-3 py-1.5 bg-[#0F3D34]/50 border border-[#0F3D34] text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restaurar</span>
                </button>
                <button
                  onClick={exportShortcutsFile}
                  className="px-3 py-1.5 bg-[#0F3D34]/50 border border-[#0F3D34] text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-[#C8A96A] hover:bg-[#b59659] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportShortcuts}
                  accept=".json"
                  className="hidden"
                />
              </div>
            </div>

            {/* List of shortcuts */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
              {Array.from(new Set(shortcutsList.map(s => s.category))).map(cat => {
                const filtered = shortcutsList.filter(s => {
                  const desc = s.description || s.id;
                  return s.category === cat && 
                    (desc.toLowerCase().includes(shortcutSearch.toLowerCase()) || 
                     s.key.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
                     s.id.toLowerCase().includes(shortcutSearch.toLowerCase()));
                });

                if (filtered.length === 0) return null;

                return (
                  <div key={cat} className="space-y-2">
                    <h4 className="text-[10px] uppercase font-bold text-[#C8A96A] tracking-wider pl-1">
                      {cat}
                    </h4>
                    <div className="bg-[#102419]/60 border border-[#0F3D34] rounded-xl overflow-hidden divide-y divide-[#0F3D34]/50">
                      {filtered.map(binding => (
                        <div key={binding.id} className="flex items-center justify-between p-3 hover:bg-[#102419] transition gap-4">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-200 block">
                              {binding.description || binding.id}
                            </span>
                            <span className="text-[9px] text-slate-400 block font-mono">
                              ID: {binding.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {binding.ctrl && <kbd className="px-1.5 py-0.5 bg-[#08120d] border border-[#0F3D34] text-sky-400 rounded text-[10px] font-mono font-bold">Ctrl</kbd>}
                              {binding.shift && <kbd className="px-1.5 py-0.5 bg-[#08120d] border border-[#0F3D34] text-emerald-400 rounded text-[10px] font-mono font-bold">Shift</kbd>}
                              {binding.alt && <kbd className="px-1.5 py-0.5 bg-[#08120d] border border-[#0F3D34] text-pink-400 rounded text-[10px] font-mono font-bold">Alt</kbd>}
                              <kbd className="px-2 py-0.5 bg-[#08120d] border border-[#0F3D34] text-slate-200 rounded text-[10px] font-mono font-extrabold uppercase">{binding.key}</kbd>
                            </div>

                            <button
                              onClick={() => startEditingShortcut(binding.id, binding)}
                              className="p-1.5 hover:bg-[#0F3D34] text-slate-400 hover:text-[#C8A96A] rounded-lg transition"
                              title="Editar atajo"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Key Grabber Overlay */}
            {editingShortcutId && (
              <div className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
                <div className="bg-[#102419] border border-[#C8A96A]/60 p-6 rounded-2xl max-w-sm w-full space-y-5 text-center shadow-2xl">
                  <div className="w-12 h-12 bg-[#0F3D34] border border-[#C8A96A]/30 text-[#C8A96A] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-white">Editar Atajo de Teclado</h4>
                    <p className="text-[10px] text-slate-400">Presiona la nueva combinación de teclas en tu teclado</p>
                  </div>

                  <div className="bg-[#08120d] border border-[#0F3D34] p-4 rounded-xl flex items-center justify-center gap-1.5 min-h-[50px]">
                    {listenKeys ? (
                      <>
                        {listenKeys.ctrl && <span className="px-1.5 py-0.5 bg-[#102419] text-sky-400 font-mono text-xs font-bold border border-[#0F3D34] rounded">Ctrl</span>}
                        {listenKeys.shift && <span className="px-1.5 py-0.5 bg-[#102419] text-emerald-400 font-mono text-xs font-bold border border-[#0F3D34] rounded">Shift</span>}
                        {listenKeys.alt && <span className="px-1.5 py-0.5 bg-[#102419] text-pink-400 font-mono text-xs font-bold border border-[#0F3D34] rounded">Alt</span>}
                        <span className="px-2.5 py-0.5 bg-[#102419] text-white font-mono text-xs font-bold border border-[#0F3D34] rounded uppercase">{listenKeys.key}</span>
                      </>
                    ) : (
                      <span className="text-[11px] font-mono text-[#C8A96A] animate-pulse font-semibold">
                        Esperando combinación de teclas...
                      </span>
                    )}
                  </div>

                  {shortcutConflict && (
                    <div className="bg-rose-950/40 border border-rose-500/30 p-3 rounded-xl flex items-start gap-2 text-left">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-rose-300 block">Conflicto detectado</span>
                        <span className="text-[9px] text-slate-300 block">
                          Ya está en uso por: <strong>{shortcutConflict}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={stopEditingShortcut}
                      className="flex-1 py-2 bg-[#08120d] hover:bg-[#0F3D34] border border-[#0F3D34] text-slate-400 rounded-xl text-xs font-semibold transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveShortcutChanges}
                      disabled={!!shortcutConflict}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold text-white transition shadow-lg ${
                        !!shortcutConflict 
                          ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                          : 'bg-[#C8A96A] hover:bg-[#b59659]'
                      }`}
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default HelpCenterModal;

