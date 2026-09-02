import { Frame, AnimationTag, AnimationClip, ProjectPixels, PixelProject } from '../../types';
import { FrameService } from './FrameService';
import { TagService } from './TagService';
import { animationEventBus } from './EventBus';

export interface Command {
  id: string;
  name: string;
  execute(): void;
  undo(): void;
}

export interface CommandHistoryListener {
  onHistoryChange(canUndo: boolean, canRedo: boolean): void;
}

export class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private listeners: CommandHistoryListener[] = [];

  public pushAndExecute(command: Command): void {
    try {
      command.execute();
      this.undoStack.push(command);
      // Limit to 50 steps
      if (this.undoStack.length > 50) {
        this.undoStack.shift();
      }
      this.redoStack = []; // clear redo on new action
      this.notifyListeners();
      animationEventBus.emit('DOCUMENT_CHANGED', { commandName: command.name });
    } catch (e) {
      console.error('Error executing command:', e);
    }
  }

  public undo(): void {
    if (this.undoStack.length === 0) return;
    const command = this.undoStack.pop()!;
    try {
      command.undo();
      this.redoStack.push(command);
      this.notifyListeners();
      animationEventBus.emit('DOCUMENT_CHANGED', { commandName: `Deshacer: ${command.name}` });
    } catch (e) {
      console.error('Error undoing command:', e);
    }
  }

  public redo(): void {
    if (this.redoStack.length === 0) return;
    const command = this.redoStack.pop()!;
    try {
      command.execute();
      this.undoStack.push(command);
      this.notifyListeners();
      animationEventBus.emit('DOCUMENT_CHANGED', { commandName: `Rehacer: ${command.name}` });
    } catch (e) {
      console.error('Error redoing command:', e);
    }
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notifyListeners();
  }

  public addListener(listener: CommandHistoryListener): () => void {
    this.listeners.push(listener);
    // Initial notify
    listener.onHistoryChange(this.canUndo(), this.canRedo());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l.onHistoryChange(this.canUndo(), this.canRedo()));
  }
}

export const timelineCommandHistory = new CommandHistory();

// CONCRETE TIMELINE COMMANDS

export class InsertFrameCommand implements Command {
  public id = `cmd-insert-${Date.now()}-${Math.random()}`;
  public name = 'Insertar fotograma';

  private prevFrames: Frame[];
  private prevPixels: ProjectPixels;
  private prevTags: AnimationTag[];

  constructor(
    private getProject: () => PixelProject,
    private setProject: (proj: PixelProject) => void,
    private index: number,
    private newFrameId: string,
    private frameName: string,
    private defaultDurationMs: number = 100
  ) {
    const proj = getProject();
    this.prevFrames = [...proj.frames];
    this.prevPixels = { ...proj.pixels };
    this.prevTags = [...(proj.animationTags || [])];
  }

  public execute(): void {
    const proj = this.getProject();
    const result = FrameService.insertAt(
      proj.frames,
      proj.pixels,
      proj.layers,
      this.index,
      this.newFrameId,
      this.frameName,
      proj.width,
      proj.height,
      this.defaultDurationMs
    );

    const updatedTags = TagService.handleFrameInsertion(proj.animationTags || [], this.index);

    this.setProject({
      ...proj,
      frames: result.frames,
      pixels: result.pixels,
      animationTags: updatedTags
    });
  }

  public undo(): void {
    const proj = this.getProject();
    this.setProject({
      ...proj,
      frames: this.prevFrames,
      pixels: this.prevPixels,
      animationTags: this.prevTags
    });
  }
}

export class DeleteFrameCommand implements Command {
  public id = `cmd-delete-${Date.now()}-${Math.random()}`;
  public name = 'Eliminar fotograma';

  private prevFrames: Frame[];
  private prevPixels: ProjectPixels;
  private prevTags: AnimationTag[];
  private prevClips: any[];

  constructor(
    private getProject: () => PixelProject,
    private setProject: (proj: PixelProject) => void,
    private index: number
  ) {
    const proj = getProject();
    this.prevFrames = [...proj.frames];
    this.prevPixels = { ...proj.pixels };
    this.prevTags = [...(proj.animationTags || [])];
    this.prevClips = [...(proj.animationClips || [])];
  }

  public execute(): void {
    const proj = this.getProject();
    if (proj.frames.length <= 1) return; // Cannot delete last frame

    const result = FrameService.deleteAt(proj.frames, proj.pixels, this.index);
    const updatedTags = TagService.handleFrameDeletion(proj.animationTags || [], this.index);
    const updatedClips = TagService.handleFrameDeletion((proj.animationClips || []) as any, this.index) as any;

    this.setProject({
      ...proj,
      frames: result.frames,
      pixels: result.pixels,
      animationTags: updatedTags,
      animationClips: updatedClips
    });
  }

  public undo(): void {
    const proj = this.getProject();
    this.setProject({
      ...proj,
      frames: this.prevFrames,
      pixels: this.prevPixels,
      animationTags: this.prevTags,
      animationClips: this.prevClips
    });
  }
}

export class DuplicateFrameCommand implements Command {
  public id = `cmd-duplicate-${Date.now()}-${Math.random()}`;
  public name = 'Duplicar fotograma';

  private prevFrames: Frame[];
  private prevPixels: ProjectPixels;
  private prevTags: AnimationTag[];
  private prevClips: any[];

  constructor(
    private getProject: () => PixelProject,
    private setProject: (proj: PixelProject) => void,
    private index: number,
    private newFrameId: string,
    private frameName: string
  ) {
    const proj = getProject();
    this.prevFrames = [...proj.frames];
    this.prevPixels = { ...proj.pixels };
    this.prevTags = [...(proj.animationTags || [])];
    this.prevClips = [...(proj.animationClips || [])];
  }

  public execute(): void {
    const proj = this.getProject();
    const result = FrameService.duplicateAt(
      proj.frames,
      proj.pixels,
      this.index,
      this.newFrameId,
      this.frameName
    );

    // Duplicating at index duplicates frame and places it at index + 1
    const updatedTags = TagService.handleFrameInsertion(proj.animationTags || [], this.index + 1);
    const updatedClips = TagService.handleFrameInsertion((proj.animationClips || []) as any, this.index + 1) as any;

    this.setProject({
      ...proj,
      frames: result.frames,
      pixels: result.pixels,
      animationTags: updatedTags,
      animationClips: updatedClips
    });
  }

  public undo(): void {
    const proj = this.getProject();
    this.setProject({
      ...proj,
      frames: this.prevFrames,
      pixels: this.prevPixels,
      animationTags: this.prevTags,
      animationClips: this.prevClips
    });
  }
}

export class MoveFrameCommand implements Command {
  public id = `cmd-move-${Date.now()}-${Math.random()}`;
  public name = 'Mover fotograma';

  private prevFrames: Frame[];
  private prevTags: AnimationTag[];
  private prevClips: any[];

  constructor(
    private getProject: () => PixelProject,
    private setProject: (proj: PixelProject) => void,
    private sourceIndex: number,
    private targetIndex: number
  ) {
    const proj = getProject();
    this.prevFrames = [...proj.frames];
    this.prevTags = [...(proj.animationTags || [])];
    this.prevClips = [...(proj.animationClips || [])];
  }

  public execute(): void {
    const proj = this.getProject();
    const movedFrames = FrameService.move(proj.frames, this.sourceIndex, this.targetIndex);
    const updatedTags = TagService.handleFrameMove(proj.animationTags || [], this.sourceIndex, this.targetIndex);
    const updatedClips = TagService.handleFrameMove((proj.animationClips || []) as any, this.sourceIndex, this.targetIndex) as any;

    this.setProject({
      ...proj,
      frames: movedFrames,
      animationTags: updatedTags,
      animationClips: updatedClips
    });
  }

  public undo(): void {
    const proj = this.getProject();
    this.setProject({
      ...proj,
      frames: this.prevFrames,
      animationTags: this.prevTags,
      animationClips: this.prevClips
    });
  }
}

export class UpdateFrameDurationCommand implements Command {
  public id = `cmd-duration-${Date.now()}-${Math.random()}`;
  public name = 'Actualizar duración';

  private prevFrames: Frame[];

  constructor(
    private getProject: () => PixelProject,
    private setProject: (proj: PixelProject) => void,
    private index: number,
    private newDurationMs: number
  ) {
    const proj = getProject();
    this.prevFrames = [...proj.frames];
  }

  public execute(): void {
    const proj = this.getProject();
    const updatedFrames = proj.frames.map((frame, idx) => {
      if (idx === this.index) {
        return { ...frame, durationMs: this.newDurationMs };
      }
      return frame;
    });

    this.setProject({
      ...proj,
      frames: updatedFrames
    });
  }

  public undo(): void {
    const proj = this.getProject();
    this.setProject({
      ...proj,
      frames: this.prevFrames
    });
  }
}

export class AddTagCommand implements Command {
  public id = `cmd-add-tag-${Date.now()}-${Math.random()}`;
  public name = 'Añadir etiqueta de animación';

  private prevTags: AnimationTag[];

  constructor(
    private getProject: () => PixelProject,
    private setProject: (proj: PixelProject) => void,
    private newTag: AnimationTag
  ) {
    const proj = getProject();
    this.prevTags = [...(proj.animationTags || [])];
  }

  public execute(): void {
    const proj = this.getProject();
    const currentTags = proj.animationTags || [];
    this.setProject({
      ...proj,
      animationTags: [...currentTags, this.newTag]
    });
  }

  public undo(): void {
    const proj = this.getProject();
    this.setProject({
      ...proj,
      animationTags: this.prevTags
    });
  }
}

export class DeleteTagCommand implements Command {
  public id = `cmd-delete-tag-${Date.now()}-${Math.random()}`;
  public name = 'Eliminar etiqueta de animación';

  private prevTags: AnimationTag[];

  constructor(
    private getProject: () => PixelProject,
    private setProject: (proj: PixelProject) => void,
    private tagId: string
  ) {
    const proj = getProject();
    this.prevTags = [...(proj.animationTags || [])];
  }

  public execute(): void {
    const proj = this.getProject();
    const currentTags = proj.animationTags || [];
    this.setProject({
      ...proj,
      animationTags: currentTags.filter(tag => tag.id !== this.tagId)
    });
  }

  public undo(): void {
    const proj = this.getProject();
    this.setProject({
      ...proj,
      animationTags: this.prevTags
    });
  }
}

export class UpdateTagCommand implements Command {
  public id = `cmd-update-tag-${Date.now()}-${Math.random()}`;
  public name = 'Actualizar etiqueta de animación';

  private prevTags: AnimationTag[];

  constructor(
    private getProject: () => PixelProject,
    private setProject: (proj: PixelProject) => void,
    private tagId: string,
    private updatedFields: Partial<Omit<AnimationTag, 'id'>>
  ) {
    const proj = getProject();
    this.prevTags = [...(proj.animationTags || [])];
  }

  public execute(): void {
    const proj = this.getProject();
    const currentTags = proj.animationTags || [];
    this.setProject({
      ...proj,
      animationTags: currentTags.map(tag => {
        if (tag.id === this.tagId) {
          return { ...tag, ...this.updatedFields };
        }
        return tag;
      })
    });
  }

  public undo(): void {
    const proj = this.getProject();
    this.setProject({
      ...proj,
      animationTags: this.prevTags
    });
  }
}
