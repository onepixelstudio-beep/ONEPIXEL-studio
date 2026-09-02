import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalEventSystem } from '../architecture/GlobalEventSystem';
import { actionSystem } from '../architecture/ActionSystem';
import { preferencesSystem } from '../architecture/PreferencesSystem';
import { unifiedResourceSystem } from '../architecture/UnifiedResourceSystem';
import { helpSystem } from '../architecture/HelpSystem';
import { windowSystem } from '../architecture/WindowSystem';
import { extensionPoints } from '../architecture/ExtensionPoints';

// Mock storage
const mockLocalStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => mockLocalStorage[key] || null,
  setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
  removeItem: (key: string) => { delete mockLocalStorage[key]; },
  clear: () => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); },
  length: 0,
  key: (index: number) => Object.keys(mockLocalStorage)[index] || null
};

describe('Architecture Consolidation Tests', () => {
  beforeEach(() => {
    // Reset systems
    actionSystem.clear();
    helpSystem.clear();
    Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
  });

  describe('GlobalEventSystem', () => {
    it('should register and unregister keyboard shortcuts successfully', () => {
      const actionSpy = vi.fn();
      globalEventSystem.registerShortcut({
        id: 'test-undo',
        key: 'z',
        ctrl: true,
        description: 'Test Undo',
        category: 'test',
        action: actionSpy
      });

      expect(globalEventSystem.getShortcuts().some(s => s.id === 'test-undo')).toBe(true);

      globalEventSystem.unregisterShortcut('test-undo');
      expect(globalEventSystem.getShortcuts().some(s => s.id === 'test-undo')).toBe(false);
    });
  });

  describe('ActionSystem', () => {
    it('should register actions and invoke them cleanly with parameters', () => {
      const actionSpy = vi.fn();
      actionSystem.registerAction({
        id: 'canvas.zoom',
        name: 'Zoom Canvas',
        category: 'canvas',
        execute: actionSpy
      });

      expect(actionSystem.isEnabled('canvas.zoom')).toBe(true);
      
      const success = actionSystem.execute('canvas.zoom', 2.0);
      expect(success).toBe(true);
      expect(actionSpy).toHaveBeenCalledWith(2.0);
    });

    it('should respect action enabling guards', () => {
      const actionSpy = vi.fn();
      actionSystem.registerAction({
        id: 'canvas.locked-action',
        name: 'Locked Action',
        category: 'canvas',
        enabled: () => false,
        execute: actionSpy
      });

      expect(actionSystem.isEnabled('canvas.locked-action')).toBe(false);
      const success = actionSystem.execute('canvas.locked-action');
      expect(success).toBe(false);
      expect(actionSpy).not.toHaveBeenCalled();
    });
  });

  describe('PreferencesSystem', () => {
    it('should support dynamic registration, getting, and setting of user preferences', () => {
      preferencesSystem.registerPreference({
        id: 'editor.grid-enabled',
        name: 'Show Grid',
        category: 'ui',
        type: 'boolean',
        defaultValue: true
      });

      expect(preferencesSystem.get<boolean>('editor.grid-enabled')).toBe(true);

      preferencesSystem.set('editor.grid-enabled', false);
      expect(preferencesSystem.get<boolean>('editor.grid-enabled')).toBe(false);
    });

    it('should fail validation when putting invalid parameters', () => {
      preferencesSystem.registerPreference({
        id: 'editor.theme',
        name: 'Color Theme',
        category: 'ui',
        type: 'select',
        defaultValue: 'dark',
        options: [
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' }
        ]
      });

      const setSuccess = preferencesSystem.set('editor.theme', 'invalid-theme');
      expect(setSuccess).toBe(false);
      expect(preferencesSystem.get('editor.theme')).toBe('dark');
    });
  });

  describe('UnifiedResourceSystem', () => {
    it('should register and recall recent projects correctly', () => {
      unifiedResourceSystem.registerRecentProject('test-proj-id', 'Test Project 1', 'data:image/png;base64...');
      
      const recents = unifiedResourceSystem.getRecentProjects();
      expect(recents.length).toBeGreaterThan(0);
      expect(recents[0].id).toBe('test-proj-id');
      expect(recents[0].name).toBe('Test Project 1');
    });
  });

  describe('HelpSystem', () => {
    it('should support dynamic registration of pages, categorized querying, and searching', () => {
      helpSystem.registerPage({
        id: 'animation-tips',
        title: 'Trucos de Animación en Pixel Art',
        category: 'animation',
        tags: ['animacion', 'trucos', 'onion'],
        content: '# Onion Skinning...'
      });

      const animPages = helpSystem.getPagesByCategory('animation');
      expect(animPages.length).toBe(1);
      expect(animPages[0].id).toBe('animation-tips');

      const searchResults = helpSystem.search('onion');
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].title).toBe('Trucos de Animación en Pixel Art');
    });
  });

  describe('WindowSystem', () => {
    it('should manage and resolve simple dialog triggers via promises', async () => {
      const confirmPromise = windowSystem.confirm('Confirm delete', 'Are you sure?');
      
      const activeDialogs = windowSystem.getActiveDialogs();
      expect(activeDialogs.length).toBe(1);
      expect(activeDialogs[0].title).toBe('Confirm delete');

      // Trigger resolution
      activeDialogs[0].resolve(true);

      const result = await confirmPromise;
      expect(result).toBe(true);
      expect(windowSystem.getActiveDialogs().length).toBe(0);
    });
  });

  describe('ExtensionPoints', () => {
    it('should support registering modular extensions and trigger their initializers with type safety', () => {
      const initSpy = vi.fn();
      const ext = {
        id: 'test-donation-plugin',
        name: 'Donation Widget',
        version: '1.0.0',
        initialize: initSpy
      };

      extensionPoints.registerExtension(ext);
      expect(initSpy).toHaveBeenCalled();
      expect(extensionPoints.getExtensions().some(e => e.id === 'test-donation-plugin')).toBe(true);
    });
  });
});
