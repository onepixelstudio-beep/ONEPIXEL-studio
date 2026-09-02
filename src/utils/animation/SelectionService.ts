import { FrameSelectionState } from '../../types';

export class SelectionService {
  /**
   * Click simple: selecciona únicamente el frame pulsado.
   * Modifica active, focus, anchor y selectedFrameIds.
   */
  public static click(allFrameIds: string[], targetId: string): FrameSelectionState {
    const validTargetId = allFrameIds.includes(targetId) ? targetId : (allFrameIds[0] || '');
    return {
      activeFrameId: validTargetId,
      focusedFrameId: validTargetId,
      anchorFrameId: validTargetId,
      selectedFrameIds: validTargetId ? [validTargetId] : [],
    };
  }

  /**
   * Ctrl/Cmd + Click: alterna la selección del frame pulsado.
   * Cambia el focus. Mantiene el ancla (anchor) si ya existe y es válido.
   */
  public static ctrlClick(
    currentState: FrameSelectionState,
    allFrameIds: string[],
    targetId: string
  ): FrameSelectionState {
    if (allFrameIds.length === 0) {
      return this.click(allFrameIds, targetId);
    }

    const validTarget = allFrameIds.includes(targetId) ? targetId : allFrameIds[0];
    const isSelected = currentState.selectedFrameIds.includes(validTarget);

    let nextSelected: string[];
    if (isSelected) {
      // Intentar deseleccionar. Mantenemos el invariante de que al menos debe haber 1 seleccionado.
      const filtered = currentState.selectedFrameIds.filter(id => id !== validTarget);
      if (filtered.length > 0) {
        nextSelected = filtered;
      } else {
        nextSelected = [validTarget]; // No permitir deseleccionar el único elemento
      }
    } else {
      nextSelected = [...currentState.selectedFrameIds, validTarget];
    }

    // Mantenemos el anchor si es válido dentro de la lista actual, si no, usamos el target
    const currentAnchorValid = allFrameIds.includes(currentState.anchorFrameId);
    const nextAnchor = currentAnchorValid ? currentState.anchorFrameId : validTarget;

    // Para activeFrameId, si sigue seleccionado lo mantenemos, de lo contrario usamos el primero de la selección actual
    const nextActive = nextSelected.includes(currentState.activeFrameId)
      ? currentState.activeFrameId
      : (nextSelected[0] || validTarget);

    return {
      activeFrameId: nextActive,
      focusedFrameId: validTarget,
      anchorFrameId: nextAnchor,
      selectedFrameIds: Array.from(new Set(nextSelected)), // Sin duplicados
    };
  }

  /**
   * Shift + Click: selecciona el rango entre el anchorFrameId y targetId.
   * Cambia el focus. Mantiene el ancla.
   * Nota: El comportamiento de activeFrameId durante Shift+Click está expresamente
   * pendiente de validación de UI, por lo que este método lo expone de forma directa y limpia.
   */
  public static shiftClick(
    currentState: FrameSelectionState,
    allFrameIds: string[],
    targetId: string,
    updateActiveFrame: boolean = true
  ): FrameSelectionState {
    if (allFrameIds.length === 0) {
      return this.click(allFrameIds, targetId);
    }

    const validTarget = allFrameIds.includes(targetId) ? targetId : allFrameIds[0];
    const currentAnchorValid = allFrameIds.includes(currentState.anchorFrameId);
    const anchor = currentAnchorValid ? currentState.anchorFrameId : currentState.activeFrameId;
    const validAnchor = allFrameIds.includes(anchor) ? anchor : allFrameIds[0];

    // Obtener los índices de anchor y target para calcular el rango
    const anchorIdx = allFrameIds.indexOf(validAnchor);
    const targetIdx = allFrameIds.indexOf(validTarget);

    const startIdx = Math.min(anchorIdx, targetIdx);
    const endIdx = Math.max(anchorIdx, targetIdx);

    const nextSelected = allFrameIds.slice(startIdx, endIdx + 1);

    // activeFrameId puede o no modificarse según se configure
    const nextActive = updateActiveFrame ? validTarget : currentState.activeFrameId;

    return {
      activeFrameId: allFrameIds.includes(nextActive) ? nextActive : validTarget,
      focusedFrameId: validTarget,
      anchorFrameId: validAnchor,
      selectedFrameIds: nextSelected,
    };
  }

  /**
   * Shift + Ctrl/Cmd + Click: añade el rango [anchor, target] a la selección actual (unión).
   */
  public static ctrlShiftClick(
    currentState: FrameSelectionState,
    allFrameIds: string[],
    targetId: string
  ): FrameSelectionState {
    if (allFrameIds.length === 0) {
      return this.click(allFrameIds, targetId);
    }

    const validTarget = allFrameIds.includes(targetId) ? targetId : allFrameIds[0];
    const currentAnchorValid = allFrameIds.includes(currentState.anchorFrameId);
    const anchor = currentAnchorValid ? currentState.anchorFrameId : currentState.activeFrameId;
    const validAnchor = allFrameIds.includes(anchor) ? anchor : allFrameIds[0];

    const anchorIdx = allFrameIds.indexOf(validAnchor);
    const targetIdx = allFrameIds.indexOf(validTarget);

    const startIdx = Math.min(anchorIdx, targetIdx);
    const endIdx = Math.max(anchorIdx, targetIdx);

    const rangeIds = allFrameIds.slice(startIdx, endIdx + 1);
    const nextSelected = Array.from(new Set([...currentState.selectedFrameIds, ...rangeIds]));

    return {
      activeFrameId: currentState.activeFrameId,
      focusedFrameId: validTarget,
      anchorFrameId: validAnchor,
      selectedFrameIds: nextSelected,
    };
  }

  /**
   * Escape: limpia la multi-selección, dejando únicamente el frame activo.
   */
  public static escape(currentState: FrameSelectionState): FrameSelectionState {
    return {
      activeFrameId: currentState.activeFrameId,
      focusedFrameId: currentState.activeFrameId,
      anchorFrameId: currentState.activeFrameId,
      selectedFrameIds: currentState.activeFrameId ? [currentState.activeFrameId] : [],
    };
  }

  /**
   * Saneamiento (sanitize): asegura la consistencia de los invariantes.
   * Útil para cargas de proyecto, imports o tras operaciones destructivas.
   */
  public static sanitize(
    currentState: Partial<FrameSelectionState>,
    allFrameIds: string[]
  ): FrameSelectionState {
    if (allFrameIds.length === 0) {
      return {
        activeFrameId: '',
        focusedFrameId: '',
        anchorFrameId: '',
        selectedFrameIds: [],
      };
    }

    const active = currentState.activeFrameId && allFrameIds.includes(currentState.activeFrameId)
      ? currentState.activeFrameId
      : allFrameIds[0];

    const focus = currentState.focusedFrameId && allFrameIds.includes(currentState.focusedFrameId)
      ? currentState.focusedFrameId
      : active;

    const anchor = currentState.anchorFrameId && allFrameIds.includes(currentState.anchorFrameId)
      ? currentState.anchorFrameId
      : active;

    const rawSelected = currentState.selectedFrameIds || [];
    let selected = rawSelected.filter(id => allFrameIds.includes(id));
    if (selected.length === 0) {
      selected = [active];
    } else {
      selected = Array.from(new Set(selected));
    }

    return {
      activeFrameId: active,
      focusedFrameId: focus,
      anchorFrameId: anchor,
      selectedFrameIds: selected,
    };
  }
}
