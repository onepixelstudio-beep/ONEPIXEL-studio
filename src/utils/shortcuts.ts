export interface KeyBinding {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  category: string;
}

export const defaultKeyBindings: KeyBinding[] = [
  // Herramientas de Dibujo
  { id: 'tool.pencil', key: 'B', description: 'Lápiz / Pincel', category: 'Herramientas de Dibujo' },
  { id: 'tool.eraser', key: 'E', description: 'Borrador', category: 'Herramientas de Dibujo' },
  { id: 'tool.line', key: 'L', description: 'Línea Recta', category: 'Herramientas de Dibujo' },
  { id: 'tool.rectangle', key: 'U', description: 'Rectángulo', category: 'Herramientas de Dibujo' },
  { id: 'tool.ellipse', key: 'C', description: 'Círculo / Elipse', category: 'Herramientas de Dibujo' },
  { id: 'tool.bucket', key: 'G', description: 'Bote de Pintura (Relleno)', category: 'Herramientas de Dibujo' },
  { id: 'tool.picker', key: 'I', description: 'Cuentagotas (Pipeta)', category: 'Herramientas de Dibujo' },
  { id: 'tool.dithering', key: 'T', description: 'Pincel de Difuminado (Dithering)', category: 'Herramientas de Dibujo' },
  { id: 'tool.spray', key: 'R', description: 'Aerógrafo (Spray)', category: 'Herramientas de Dibujo' },
  { id: 'tool.clone_stamp', key: 'S', description: 'Tampón de Clonar', category: 'Herramientas de Dibujo' },

  // Selección y Transformación
  { id: 'tool.rect_select', key: 'M', description: 'Selección Rectangular', category: 'Selección y Transformación' },
  { id: 'tool.lasso_select', key: 'Q', description: 'Lazo Libre', category: 'Selección y Transformación' },
  { id: 'tool.magic_wand', key: 'W', description: 'Varita Mágica', category: 'Selección y Transformación' },
  { id: 'tool.transform', key: 'V', description: 'Transformar Selección / Mover', category: 'Selección y Transformación' },
  { id: 'selection.all', key: 'A', ctrl: true, description: 'Seleccionar Todo', category: 'Selección y Transformación' },
  { id: 'selection.deselect', key: 'D', ctrl: true, description: 'Deseleccionar', category: 'Selección y Transformación' },
  { id: 'selection.invert', key: 'I', ctrl: true, shift: true, description: 'Invertir Selección', category: 'Selección y Transformación' },

  // Edición y Portapapeles
  { id: 'edit.undo', key: 'Z', ctrl: true, description: 'Deshacer Última Acción', category: 'Edición y Portapapeles' },
  { id: 'edit.redo', key: 'Y', ctrl: true, description: 'Rehacer Acción', category: 'Edición y Portapapeles' },
  { id: 'edit.cut', key: 'X', ctrl: true, description: 'Cortar Selección', category: 'Edición y Portapapeles' },
  { id: 'edit.copy', key: 'C', ctrl: true, description: 'Copiar Selección', category: 'Edición y Portapapeles' },
  { id: 'edit.paste', key: 'V', ctrl: true, description: 'Pegar Selección', category: 'Edición y Portapapeles' },
  { id: 'edit.delete', key: 'Delete', description: 'Borrar Contenido Seleccionado', category: 'Edición y Portapapeles' },

  // Navegación y Lienzo
  { id: 'view.pan', key: 'Space', description: 'Desplazar Lienzo (Mano Pan)', category: 'Navegación y Vista' },
  { id: 'view.center', key: '0', ctrl: true, description: 'Centrar Lienzo en Pantalla', category: 'Navegación y Vista' },
  { id: 'view.zoom_in', key: '+', description: 'Acercar Zoom', category: 'Navegación y Vista' },
  { id: 'view.zoom_out', key: '-', description: 'Alejar Zoom', category: 'Navegación y Vista' },
  { id: 'view.grid', key: '\'', ctrl: true, description: 'Conmutar Rejilla de Píxeles', category: 'Navegación y Vista' },
  { id: 'view.zen', key: 'Tab', description: 'Modo Inmersivo Zen (Ocultar Paneles)', category: 'Navegación y Vista' },

  // Animación y Línea de Tiempo
  { id: 'anim.play', key: 'Space', shift: true, description: 'Reproducir / Pausar Animación', category: 'Animación' },
  { id: 'anim.new_frame', key: 'F', alt: true, description: 'Añadir Nuevo Fotograma', category: 'Animación' },
  { id: 'anim.delete_frame', key: 'D', alt: true, description: 'Eliminar Fotograma Actual', category: 'Animación' },
  { id: 'anim.prev_frame', key: 'ArrowLeft', description: 'Fotograma Anterior', category: 'Animación' },
  { id: 'anim.next_frame', key: 'ArrowRight', description: 'Fotograma Siguiente', category: 'Animación' },
  { id: 'anim.onion_skin', key: 'O', alt: true, description: 'Conmutar Papel Cebolla', category: 'Animación' },

  // Proyecto y Ayuda
  { id: 'project.new', key: 'N', ctrl: true, description: 'Nuevo Proyecto', category: 'Proyecto y Ayuda' },
  { id: 'project.save', key: 'S', ctrl: true, description: 'Guardar (.onepixel)', category: 'Proyecto y Ayuda' },
  { id: 'project.save_as', key: 'S', ctrl: true, shift: true, description: 'Guardar Como...', category: 'Proyecto y Ayuda' },
  { id: 'project.export', key: 'E', ctrl: true, description: 'Exportar Activos', category: 'Proyecto y Ayuda' },
  { id: 'help.open', key: 'F1', description: 'Abrir Centro de Ayuda y Manual', category: 'Proyecto y Ayuda' }
];
