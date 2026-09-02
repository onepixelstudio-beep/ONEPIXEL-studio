import { animationEventBus } from '../animation/EventBus';

export interface EditorAction {
  id: string;
  name: string;
  category: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  enabled?: () => boolean;
  execute: (...args: any[]) => void;
}

export class ActionSystem {
  private static instance: ActionSystem | null = null;
  private actions: Map<string, EditorAction> = new Map();

  private constructor() {}

  public static getInstance(): ActionSystem {
    if (!ActionSystem.instance) {
      ActionSystem.instance = new ActionSystem();
    }
    return ActionSystem.instance;
  }

  /**
   * Registers a new global action.
   */
  public registerAction(action: EditorAction): void {
    if (this.actions.has(action.id)) {
      console.warn(`Action with ID ${action.id} is already registered. Overwriting.`);
    }
    this.actions.set(action.id, action);
    animationEventBus.emit('ACTION_REGISTERED', { id: action.id, name: action.name });
  }

  /**
   * Unregisters an action.
   */
  public unregisterAction(id: string): void {
    if (this.actions.has(id)) {
      this.actions.delete(id);
      animationEventBus.emit('ACTION_UNREGISTERED', { id });
    }
  }

  /**
   * Checks if an action is registered and currently enabled.
   */
  public isEnabled(id: string): boolean {
    const action = this.actions.get(id);
    if (!action) return false;
    if (action.enabled) {
      try {
        return action.enabled();
      } catch (e) {
        console.error(`Error checking enabled state for action ${id}:`, e);
        return false;
      }
    }
    return true;
  }

  /**
   * Executes a registered action by ID with optional arguments.
   */
  public execute(id: string, ...args: any[]): boolean {
    const action = this.actions.get(id);
    if (!action) {
      console.error(`Action with ID ${id} not found.`);
      return false;
    }

    if (!this.isEnabled(id)) {
      console.warn(`Action ${id} is disabled. Aborting execution.`);
      return false;
    }

    try {
      animationEventBus.emit('ACTION_BEFORE_EXECUTE', { id });
      action.execute(...args);
      animationEventBus.emit('ACTION_AFTER_EXECUTE', { id });
      return true;
    } catch (error) {
      console.error(`Error executing action ${id}:`, error);
      animationEventBus.emit('ACTION_ERROR', { id, error });
      return false;
    }
  }

  /**
   * Retrieves all registered actions.
   */
  public getActions(): EditorAction[] {
    return Array.from(this.actions.values());
  }

  /**
   * Retrieves registered actions of a specific category.
   */
  public getActionsByCategory(category: string): EditorAction[] {
    return this.getActions().filter(action => action.category === category);
  }

  /**
   * Clear all actions.
   */
  public clear(): void {
    this.actions.clear();
  }
}

export const actionSystem = ActionSystem.getInstance();
