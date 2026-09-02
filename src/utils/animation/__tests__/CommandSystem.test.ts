import { describe, it, expect, vi } from 'vitest';
import {
  CommandHistory,
  InsertFrameCommand,
  DeleteFrameCommand,
  AddTagCommand,
  DeleteTagCommand,
  UpdateTagCommand
} from '../CommandSystem';
import { PixelProject, Frame, Layer, ProjectPixels } from '../../../types';

describe('CommandSystem & History', () => {
  const createMockProject = (): PixelProject => ({
    id: 'p1',
    name: 'Test Project',
    width: 2,
    height: 2,
    layers: [
      { id: 'l1', name: 'Layer 1', opacity: 100, visible: true, locked: false }
    ],
    frames: [
      { id: 'f1', name: 'Frame 1', durationMs: 100 }
    ],
    pixels: {
      'f1': {
        'l1': ['', '', '', '']
      }
    },
    fps: 10,
    tags: [],
    animationTags: [
      { id: 't1', name: 'Intro', color: '#f00', startFrameIndex: 0, endFrameIndex: 0 }
    ],
    lastSaved: Date.now()
  });

  it('should push, execute, undo and redo in CommandHistory', () => {
    let project = createMockProject();
    const getProject = () => project;
    const setProject = (p: PixelProject) => { project = p; };

    const history = new CommandHistory();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);

    // Create and run an InsertFrameCommand at index 1
    const cmd = new InsertFrameCommand(
      getProject,
      setProject,
      1,
      'f2',
      'Frame 2',
      120
    );

    history.pushAndExecute(cmd);

    expect(project.frames).toHaveLength(2);
    expect(project.frames[1].id).toBe('f2');
    expect(project.frames[1].durationMs).toBe(120);
    // Verified that tag-1 shifted and grew/remained consistent
    expect(project.animationTags?.[0].endFrameIndex).toBe(0); // since insert was at index 1 (not before tag start or inside)

    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);

    // Undo
    history.undo();
    expect(project.frames).toHaveLength(1);
    expect(project.frames[0].id).toBe('f1');
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);

    // Redo
    history.redo();
    expect(project.frames).toHaveLength(2);
    expect(project.frames[1].id).toBe('f2');
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it('should execute and undo DeleteFrameCommand', () => {
    let project = createMockProject();
    // Add a second frame to allow deletion
    project.frames.push({ id: 'f2', name: 'Frame 2', durationMs: 150 });
    project.pixels['f2'] = { 'l1': ['', '', '', ''] };

    const getProject = () => project;
    const setProject = (p: PixelProject) => { project = p; };

    const history = new CommandHistory();
    const cmd = new DeleteFrameCommand(getProject, setProject, 1);

    history.pushAndExecute(cmd);

    expect(project.frames).toHaveLength(1);
    expect(project.frames[0].id).toBe('f1');

    history.undo();

    expect(project.frames).toHaveLength(2);
    expect(project.frames[1].id).toBe('f2');
    expect(project.frames[1].durationMs).toBe(150);
  });

  it('should support AddTagCommand, DeleteTagCommand and UpdateTagCommand', () => {
    let project = createMockProject();
    const getProject = () => project;
    const setProject = (p: PixelProject) => { project = p; };

    const history = new CommandHistory();
    
    const newTag = { id: 't2', name: 'Jump', color: '#0f0', startFrameIndex: 0, endFrameIndex: 0 };
    const addCmd = new AddTagCommand(getProject, setProject, newTag);

    // Test add
    history.pushAndExecute(addCmd);
    expect(project.animationTags).toHaveLength(2);
    expect(project.animationTags?.[1]).toEqual(newTag);

    // Test update
    const updateCmd = new UpdateTagCommand(getProject, setProject, 't2', { name: 'SuperJump', color: '#00f' });
    history.pushAndExecute(updateCmd);
    expect(project.animationTags?.[1].name).toBe('SuperJump');
    expect(project.animationTags?.[1].color).toBe('#00f');

    // Undo update
    history.undo();
    expect(project.animationTags?.[1].name).toBe('Jump');
    expect(project.animationTags?.[1].color).toBe('#0f0');

    // Test delete
    const deleteCmd = new DeleteTagCommand(getProject, setProject, 't2');
    history.pushAndExecute(deleteCmd);
    expect(project.animationTags).toHaveLength(1);
    expect(project.animationTags?.[0].id).toBe('t1');

    // Undo delete
    history.undo();
    expect(project.animationTags).toHaveLength(2);
    expect(project.animationTags?.[1].id).toBe('t2');
  });
});
