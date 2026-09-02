// Save system debugging module for OnePixel Studio
export const DEBUG_SAVE = typeof window !== 'undefined' && !!(import.meta as any).env?.DEV;

export const saveDebug = (funcName: string, stepDescription: string, data?: any) => {
  if (DEBUG_SAVE) {
    const timeStr = new Date().toISOString();
    console.log(
      `%c[DEBUG_SAVE][${timeStr}][${funcName}] ${stepDescription}`,
      'color: #00f3ff; background: #111; font-weight: bold; padding: 2px 4px; border-radius: 3px;',
      data !== undefined ? data : ''
    );
  }
};
