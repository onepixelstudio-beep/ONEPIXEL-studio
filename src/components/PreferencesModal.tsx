import React, { useState, useEffect } from 'react';
import { 
  X, Settings, Palette, Eye, Grid, Sliders, Film, 
  Save, Cpu, Globe, Keyboard, Download, Layout, ShieldAlert
} from 'lucide-react';
import { UserPreferences } from '../types';
import { translate } from '../i18n';
import { PreferencesSystem } from '../utils/architecture/PreferencesSystem';
import { windowSystem } from '../utils/architecture/WindowSystem';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onChangePreferences: (prefs: UserPreferences) => void;
}

type PrefCategory = 
  | 'branding'
  | 'appearance' 
  | 'ui' 
  | 'canvas' 
  | 'tools' 
  | 'grid' 
  | 'symmetry' 
  | 'onionSkin' 
  | 'animation' 
  | 'saving' 
  | 'performance' 
  | 'accessibility' 
  | 'language' 
  | 'export';

import { 
  setCustomBrandLogo, 
  setCustomBrandIsotype, 
  getBrandAssetPath, 
  setCustomBrandAsset,
  exportBrandingConfig, 
  importBrandingConfig, 
  resetAllBrandingAssets,
  BrandAssetKey 
} from '../branding/BrandAssets';
import { Image, Upload, RotateCcw, FileText, Check, AlertCircle, ShieldCheck } from 'lucide-react';

export default function PreferencesModal({
  isOpen,
  onClose,
  preferences,
  onChangePreferences
}: PreferencesModalProps) {
  const [activeCategory, setActiveCategory] = useState<PrefCategory>('appearance');
  const [prefValues, setPrefValues] = useState<Record<string, any>>({});
  const language = (prefValues['general.language'] || preferences.language || 'es') as any;

  useEffect(() => {
    if (isOpen) {
      // Sync from PreferencesSystem on open
      const system = PreferencesSystem.getInstance();
      const schemas = system.getSchemas();
      const values: Record<string, any> = {};
      schemas.forEach(schema => {
        values[schema.id] = system.get(schema.id);
      });
      if (preferences.interfaceColor) {
        values['appearance.themeColor'] = preferences.interfaceColor;
      }
      if (preferences.theme) {
        values['appearance.theme'] = preferences.theme;
      }
      setPrefValues(values);
    }
  }, [isOpen, preferences]);

  if (!isOpen) return null;

  const handleUpdateValue = (id: string, value: any) => {
    const system = PreferencesSystem.getInstance();
    const success = system.set(id, value);
    if (success) {
      setPrefValues(prev => ({ ...prev, [id]: value }));

      // Bridge/Sync with the legacy App.tsx preferences state to keep absolute backwards compatibility
      const updatedPrefs = { ...preferences };
      if (id === 'appearance.theme') updatedPrefs.theme = value;
      if (id === 'appearance.themeColor') updatedPrefs.interfaceColor = value;
      if (id === 'language.current' || id === 'general.language') updatedPrefs.language = value;
      if (id === 'ui.interfaceSize') updatedPrefs.interfaceSize = value;
      if (id === 'ui.largeButtons') updatedPrefs.largeButtons = value;
      if (id === 'ui.leftHandedMode') updatedPrefs.leftHandedMode = value;
      if (id === 'saving.autoSaveEnabled') updatedPrefs.autoSaveEnabled = value;
      if (id === 'accessibility.highContrast') updatedPrefs.highContrast = value;
      if (id === 'accessibility.colorBlindness') updatedPrefs.colorBlindness = value;
      
      onChangePreferences(updatedPrefs);
    }
  };

  const currentLang = (preferences.language || 'es') as string;

  const categoriesList: { id: PrefCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'branding', label: currentLang === 'es' ? 'Branding Oficial' : currentLang === 'pt' ? 'Branding Oficial' : currentLang === 'zh-CN' ? '官方品牌' : currentLang === 'ru' ? 'Официальный брендинг' : currentLang === 'ja' ? '公式ブランディング' : 'Official Branding', icon: <Image className="w-4 h-4 text-[#C8A96A]" /> },
    { id: 'appearance', label: currentLang === 'es' ? 'Apariencia' : currentLang === 'pt' ? 'Aparência' : currentLang === 'zh-CN' ? '外观' : currentLang === 'ru' ? 'Внешний вид' : currentLang === 'ja' ? '外観' : 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'ui', label: currentLang === 'es' ? 'Interfaz' : currentLang === 'pt' ? 'Interface' : currentLang === 'zh-CN' ? '界面' : currentLang === 'ru' ? 'Интерфейс' : currentLang === 'ja' ? 'UI' : 'Interface', icon: <Layout className="w-4 h-4" /> },
    { id: 'canvas', label: currentLang === 'es' ? 'Lienzo' : currentLang === 'pt' ? 'Tela' : currentLang === 'zh-CN' ? '画布' : currentLang === 'ru' ? 'Холст' : currentLang === 'ja' ? 'キャンバス' : 'Canvas', icon: <Sliders className="w-4 h-4" /> },
    { id: 'tools', label: currentLang === 'es' ? 'Herramientas' : currentLang === 'pt' ? 'Ferramentas' : currentLang === 'zh-CN' ? '工具' : currentLang === 'ru' ? 'Инструменты' : currentLang === 'ja' ? 'ツール' : 'Tools', icon: <Settings className="w-4 h-4" /> },
    { id: 'grid', label: currentLang === 'es' ? 'Cuadrículas' : currentLang === 'pt' ? 'Grades' : currentLang === 'zh-CN' ? '网格' : currentLang === 'ru' ? 'Сетки' : currentLang === 'ja' ? 'グリッド' : 'Grid', icon: <Grid className="w-4 h-4" /> },
    { id: 'symmetry', label: currentLang === 'es' ? 'Simetría' : currentLang === 'pt' ? 'Simetria' : currentLang === 'zh-CN' ? '对称' : currentLang === 'ru' ? 'Симметрия' : currentLang === 'ja' ? '対称' : 'Symmetry', icon: <Grid className="w-4 h-4 text-pink-400" /> },
    { id: 'onionSkin', label: 'Onion Skin', icon: <Film className="w-4 h-4 text-emerald-400" /> },
    { id: 'animation', label: currentLang === 'es' ? 'Animación' : currentLang === 'pt' ? 'Animação' : currentLang === 'zh-CN' ? '动画' : currentLang === 'ru' ? 'Анимация' : currentLang === 'ja' ? 'アニメーション' : 'Animation', icon: <Film className="w-4 h-4" /> },
    { id: 'saving', label: currentLang === 'es' ? 'Guardado' : currentLang === 'pt' ? 'Salvamento' : currentLang === 'zh-CN' ? '保存' : currentLang === 'ru' ? 'Сохранение' : currentLang === 'ja' ? '保存' : 'Saving', icon: <Save className="w-4 h-4" /> },
    { id: 'performance', label: currentLang === 'es' ? 'Rendimiento' : currentLang === 'pt' ? 'Desempenho' : currentLang === 'zh-CN' ? '性能' : currentLang === 'ru' ? 'Производительность' : currentLang === 'ja' ? 'パフォーマンス' : 'Performance', icon: <Cpu className="w-4 h-4" /> },
    { id: 'accessibility', label: currentLang === 'es' ? 'Accesibilidad' : currentLang === 'pt' ? 'Acessibilidade' : currentLang === 'zh-CN' ? '无障碍' : currentLang === 'ru' ? 'Доступность' : currentLang === 'ja' ? 'アクセシビリティ' : 'Accessibility', icon: <Eye className="w-4 h-4" /> },
    { id: 'language', label: currentLang === 'es' ? 'Idioma' : currentLang === 'pt' ? 'Idioma' : currentLang === 'zh-CN' ? '语言' : currentLang === 'ru' ? 'Язык' : currentLang === 'ja' ? '言語' : 'Language', icon: <Globe className="w-4 h-4" /> },
    { id: 'export', label: currentLang === 'es' ? 'Exportación' : currentLang === 'pt' ? 'Exportação' : currentLang === 'zh-CN' ? '导出' : currentLang === 'ru' ? 'Экспорт' : currentLang === 'ja' ? 'エクスポート' : 'Export', icon: <Download className="w-4 h-4" /> },
  ];

  const currentSchemas = PreferencesSystem.getInstance()
    .getSchemas()
    .filter(s => s.category === activeCategory);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" id="preferences-modal-container">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-depth/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-brand-petroleum border border-brand-turquoise/40 rounded-2xl w-full max-w-3xl h-[70vh] shadow-2xl overflow-hidden flex flex-col text-slate-100 font-sans" id="preferences-modal">
        {/* Header */}
        <div className="px-5 py-4 border-b border-brand-turquoise/30 flex justify-between items-center bg-brand-depth">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-sand" />
            <h3 className="font-bold text-sm tracking-tight">{translate('preferences.title', preferences.language)}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-brand-turquoise/20 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body split in categories sidebar and details */}
        <div className="flex-1 flex overflow-hidden bg-brand-depth">
          {/* Categories list */}
          <div className="w-52 border-r border-brand-turquoise/20 bg-brand-petroleum overflow-y-auto p-2 space-y-1 no-scrollbar">
            {categoriesList.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition text-left ${activeCategory === cat.id ? 'bg-brand-sage/20 text-brand-sand font-extrabold border-l-2 border-brand-sage' : 'text-slate-400 hover:text-slate-200 hover:bg-brand-turquoise/20'}`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          {/* Preferences Settings Detail */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar">
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-white capitalize">
                {activeCategory === 'branding' ? 'Sistema de Branding Oficial' : activeCategory === 'onionSkin' ? 'Onion Skin (Papel de Cebolla)' : activeCategory}
              </h4>
              <p className="text-[10px] text-slate-400">
                {activeCategory === 'branding' 
                  ? 'Configura el logotipo e isotipo oficial de OnePixel Studio. Los recursos se aplicarán automáticamente a toda la aplicación.' 
                  : 'Personaliza los comportamientos en tiempo real para esta categoría.'}
              </p>
            </div>

            {activeCategory === 'branding' ? (
              <div className="space-y-5">
                {/* Single Source of Truth Banner */}
                <div className="bg-[#102419] border border-[#0F3D34] p-3.5 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#C8A96A] shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">Fuente Única de Identidad (Single Source of Truth)</p>
                      <p className="text-[10px] text-slate-400">Al sustituir el logotipo o isotipo aquí, toda la aplicación se actualizará instantáneamente.</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const ok = await windowSystem.confirm(
                        'Restablecer Identidad',
                        '¿Restablecer el logotipo e isotipo a los valores oficiales predeterminados?'
                      );
                      if (ok) {
                        resetAllBrandingAssets();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-300 text-xs font-bold rounded-xl border border-red-500/30 transition shrink-0"
                    title="Restablecer marca oficial por defecto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restablecer Todo
                  </button>
                </div>

                {/* Logo Principal Config Card */}
                <div className="bg-[#102419] border border-[#0F3D34] p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-xs text-[#C8A96A] uppercase tracking-wider">Logotipo Oficial Principal</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">Sube tu imagen PNG, SVG o WebP. Se aplicará a Header, Diálogos y Acerca de.</p>
                    </div>
                    <button
                      onClick={() => setCustomBrandLogo(null)}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-[#030408] border border-[#0F3D34] transition"
                    >
                      <RotateCcw className="w-3 h-3" /> Restablecer
                    </button>
                  </div>

                  <div className="bg-[#030408] border border-[#0F3D34] p-4 rounded-xl flex items-center justify-center min-h-[80px]">
                    <img 
                      src={getBrandAssetPath('logoMain')} 
                      alt="Logo Oficial Preview" 
                      className="max-h-12 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 bg-[#0F3D34] hover:bg-[#16584b] text-[#C8A96A] hover:text-white font-bold text-xs py-2 px-3 rounded-xl border border-[#C8A96A]/30 cursor-pointer transition shadow">
                      <Upload className="w-3.5 h-3.5" /> {translate('preferences.uploadLogo', language as any)}
                      <input 
                        type="file" 
                        accept="image/png,image/svg+xml,image/webp" 
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) setCustomBrandLogo(evt.target.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    <input 
                      type="text"
                      placeholder="http://..."
                      className="flex-1 bg-[#030408] border border-[#0F3D34] text-xs text-white rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#C8A96A]"
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val) setCustomBrandLogo(val);
                      }}
                    />
                  </div>
                </div>

                {/* Isotipo Config Card */}
                <div className="bg-[#102419] border border-[#0F3D34] p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-xs text-[#C8A96A] uppercase tracking-wider">{translate('preferences.isotypeTitle', language as any)}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">{translate('preferences.isotypeDesc', language as any)}</p>
                    </div>
                    <button
                      onClick={() => setCustomBrandIsotype(null)}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-[#030408] border border-[#0F3D34] transition"
                    >
                      <RotateCcw className="w-3 h-3" /> {translate('preferences.reset', language as any)}
                    </button>
                  </div>

                  <div className="bg-[#030408] border border-[#0F3D34] p-4 rounded-xl flex items-center justify-center min-h-[60px]">
                    <img 
                      src={getBrandAssetPath('isotype')} 
                      alt="Isotipo Oficial Preview" 
                      className="max-h-8 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 bg-[#0F3D34] hover:bg-[#16584b] text-[#C8A96A] hover:text-white font-bold text-xs py-2 px-3 rounded-xl border border-[#C8A96A]/30 cursor-pointer transition shadow">
                      <Upload className="w-3.5 h-3.5" /> {translate('preferences.uploadIsotype', language as any)}
                      <input 
                        type="file" 
                        accept="image/png,image/svg+xml,image/webp" 
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) setCustomBrandIsotype(evt.target.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Favicon & App Icon Config Card */}
                <div className="bg-[#102419] border border-[#0F3D34] p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-xs text-[#C8A96A] uppercase tracking-wider">{translate('preferences.faviconTitle', language as any)}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">{translate('preferences.faviconDesc', language as any)}</p>
                    </div>
                    <button
                      onClick={() => setCustomBrandAsset('favicon', null)}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-[#030408] border border-[#0F3D34] transition"
                    >
                      <RotateCcw className="w-3 h-3" /> {translate('preferences.reset', language as any)}
                    </button>
                  </div>

                  <div className="bg-[#030408] border border-[#0F3D34] p-4 rounded-xl flex items-center justify-center min-h-[50px]">
                    <img 
                      src={getBrandAssetPath('favicon')} 
                      alt="Favicon Preview" 
                      className="w-6 h-6 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 bg-[#0F3D34] hover:bg-[#16584b] text-[#C8A96A] hover:text-white font-bold text-xs py-2 px-3 rounded-xl border border-[#C8A96A]/30 cursor-pointer transition shadow">
                      <Upload className="w-3.5 h-3.5" /> {translate('preferences.uploadFavicon', language as any)}
                      <input 
                        type="file" 
                        accept="image/png,image/x-icon,image/svg+xml" 
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) setCustomBrandAsset('favicon', evt.target.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : activeCategory === 'appearance' ? (
              <div className="space-y-6">
                {/* 1. Visual Theme */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 tracking-wide">
                      {currentLang === 'es' ? 'Tema Visual' : currentLang === 'pt' ? 'Tema Visual' : currentLang === 'zh-CN' ? '视觉主题' : currentLang === 'ru' ? 'Визуальная тема' : currentLang === 'ja' ? 'ビジュアルテーマ' : 'Visual Theme'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {currentLang === 'es' ? 'Selecciona el estilo de contraste y luminosidad general del espacio de trabajo.' : 'Select the contrast and luminosity style for your workspace.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'standard',
                        title: currentLang === 'es' ? 'Estándar (OnePixel)' : 'Standard (OnePixel)',
                        subtitle: currentLang === 'es' ? 'Esmeralda & Oro clásico' : 'Classic Emerald & Gold',
                        bgPreview: '#0F3D34',
                        borderPreview: '#C8A96A',
                        textPreview: '#F7F6F1'
                      },
                      {
                        id: 'dark',
                        title: currentLang === 'es' ? 'Oscuro Profundo' : 'Deep Dark',
                        subtitle: currentLang === 'es' ? 'Negro obsidiana & nitidez' : 'Obsidian Black & High Contrast',
                        bgPreview: '#07130F',
                        borderPreview: '#1E283C',
                        textPreview: '#FFFFFF'
                      },
                      {
                        id: 'light',
                        title: currentLang === 'es' ? 'Claro' : 'Light Mode',
                        subtitle: currentLang === 'es' ? 'Luminoso & suave' : 'Soft luminous background',
                        bgPreview: '#EAF0EC',
                        borderPreview: '#CAD5D0',
                        textPreview: '#0F2F26'
                      }
                    ].map((th) => {
                      const isSelected = (prefValues['appearance.theme'] || preferences.theme || 'standard') === th.id;
                      return (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => handleUpdateValue('appearance.theme', th.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'border-brand-turquoise bg-brand-turquoise/15 shadow-md ring-1 ring-brand-turquoise/50'
                              : 'border-brand-turquoise/20 bg-brand-petroleum/40 hover:bg-brand-petroleum/70 hover:border-brand-turquoise/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div 
                              className="w-full h-8 rounded-lg border flex items-center justify-between px-2.5 shadow-inner"
                              style={{ backgroundColor: th.bgPreview, borderColor: th.borderPreview }}
                            >
                              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: th.borderPreview }} />
                              <span className="text-[10px] font-mono font-bold" style={{ color: th.textPreview }}>Aa</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-100">{th.title}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-brand-turquoise" />}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{th.subtitle}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Interface Color Palette */}
                <div className="space-y-3 pt-2 border-t border-brand-turquoise/20">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 tracking-wide">
                      {currentLang === 'es' ? 'Color de Interfaz' : currentLang === 'pt' ? 'Cor da Interface' : currentLang === 'zh-CN' ? '界面配色' : currentLang === 'ru' ? 'Цвет интерфейса' : currentLang === 'ja' ? 'インターフェースカラー' : 'Interface Color'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {currentLang === 'es' ? 'Personaliza los acentos, bordes y tonos primarios de todos los paneles y controles.' : 'Customize accents, borders, and primary tones across all panels and controls.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        id: 'gold',
                        title: currentLang === 'es' ? 'Dorado' : 'Gold',
                        subtitle: currentLang === 'es' ? 'Paleta emblemática esmeralda y oro' : 'Emblematic emerald & gold palette',
                        color: '#C8A96A',
                        bgTint: 'rgba(200, 169, 106, 0.15)'
                      },
                      {
                        id: 'slate',
                        title: currentLang === 'es' ? 'Plata' : 'Silver / Slate',
                        subtitle: currentLang === 'es' ? 'Acabado metálico plateado y acero' : 'Metallic slate & steel finish',
                        color: '#CBD5E1',
                        bgTint: 'rgba(203, 213, 225, 0.15)'
                      },
                      {
                        id: 'rose',
                        title: currentLang === 'es' ? 'Rosa Silvestre' : 'Wild Rose',
                        subtitle: currentLang === 'es' ? 'Tonos magenta y rosa silvestre' : 'Wild magenta & vibrant rose tones',
                        color: '#E175A2',
                        bgTint: 'rgba(225, 117, 162, 0.15)'
                      },
                      {
                        id: 'charcoal',
                        title: currentLang === 'es' ? 'Gris Carbón' : 'Charcoal Gray',
                        subtitle: currentLang === 'es' ? 'Elegancia neutra grafito y carbón' : 'Graphite neutral & deep charcoal',
                        color: '#9CA3AF',
                        bgTint: 'rgba(156, 163, 175, 0.15)'
                      }
                    ].map((col) => {
                      const isSelected = (prefValues['appearance.themeColor'] || preferences.interfaceColor || 'gold') === col.id;
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => handleUpdateValue('appearance.themeColor', col.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all relative flex items-center gap-3.5 cursor-pointer ${
                            isSelected
                              ? 'border-brand-turquoise bg-brand-turquoise/15 shadow-md ring-1 ring-brand-turquoise/50'
                              : 'border-brand-turquoise/20 bg-brand-petroleum/40 hover:bg-brand-petroleum/70 hover:border-brand-turquoise/40'
                          }`}
                        >
                          <div 
                            className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-inner"
                            style={{ backgroundColor: col.bgTint, borderColor: col.color }}
                          >
                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: col.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-100">{col.title}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-brand-turquoise shrink-0" />}
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate mt-0.5">{col.subtitle}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
              {currentSchemas.map(schema => {
                const currentVal = prefValues[schema.id] !== undefined ? prefValues[schema.id] : schema.defaultValue;

                return (
                   <div key={schema.id} className="bg-brand-petroleum/40 border border-brand-turquoise/20 p-4 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1 max-w-[70%]">
                      <span className="text-xs font-bold text-slate-200 block">{schema.name}</span>
                      {schema.description && (
                        <span className="text-[10px] text-slate-400 leading-relaxed block">{schema.description}</span>
                      )}
                    </div>

                    {/* Render fields depending on preference type */}
                    {schema.type === 'boolean' && (
                      <button
                        onClick={() => handleUpdateValue(schema.id, !currentVal)}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${currentVal ? 'bg-brand-turquoise' : 'bg-brand-depth border border-brand-turquoise/50'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${currentVal ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    )}

                    {schema.type === 'select' && schema.options && (
                      <select
                        value={currentVal}
                        onChange={(e) => handleUpdateValue(schema.id, e.target.value)}
                        className="bg-brand-depth border border-brand-turquoise/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-sage cursor-pointer min-w-[120px]"
                      >
                        {schema.options.map(opt => (
                          <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                        ))}
                      </select>
                    )}

                    {schema.type === 'number' && (
                      <input
                        type="number"
                        value={currentVal}
                        onChange={(e) => handleUpdateValue(schema.id, Number(e.target.value))}
                        className="w-20 bg-brand-depth border border-brand-turquoise/50 rounded-lg px-2 py-1.5 text-xs text-slate-300 text-center focus:outline-none focus:border-brand-sage"
                      />
                    )}

                    {schema.type === 'string' && (
                      <div className="flex items-center gap-2">
                        {schema.id.toLowerCase().includes('color') && (
                          <input
                            type="color"
                            value={currentVal || '#ffffff'}
                            onChange={(e) => handleUpdateValue(schema.id, e.target.value)}
                            className="w-7 h-7 rounded border border-brand-turquoise/50 bg-brand-depth cursor-pointer p-0.5 shrink-0"
                          />
                        )}
                        <input
                          type="text"
                          value={currentVal}
                          onChange={(e) => handleUpdateValue(schema.id, e.target.value)}
                          className="w-28 bg-brand-depth border border-brand-turquoise/50 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-sage font-mono"
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {currentSchemas.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No hay opciones configuradas para esta sección.
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-brand-turquoise/30 bg-brand-petroleum flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-brand-turquoise hover:bg-brand-sage text-white font-bold rounded-xl text-xs transition shadow-lg shadow-brand-turquoise/15"
          >
            {translate('common.saveAndClose', preferences.language) || translate('common.save', preferences.language)}
          </button>
        </div>
      </div>
    </div>
  );
}
