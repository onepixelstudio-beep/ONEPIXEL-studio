import { QATestCase, PlanMaestroPhase } from '../types';

export const PLAN_MAESTRO_PHASES: PlanMaestroPhase[] = [
  {
    id: 'fase-1',
    name: 'Fase 1: Herramientas y Pinceles',
    description: 'Estabilización de herramientas base de dibujo y trazo en lienzo pixel art.'
  },
  {
    id: 'fase-2',
    name: 'Fase 2: Selecciones y Transformaciones',
    description: 'Sistemas de máscaras de selección, lazo, varita mágica y manipulación de fragmentos.'
  },
  {
    id: 'fase-3',
    name: 'Fase 3: Barra de Opciones',
    description: 'Ajustes dinámicos de pincel (grosor, opacidad, suavizado, estabilización de trazo).'
  },
  {
    id: 'fase-4',
    name: 'Fase 4: Guardado Local e Historial',
    description: 'Pila de undo/redo determinista, serialización de proyectos y almacenamiento.'
  },
  {
    id: 'fase-5',
    name: 'Fase 5: Estabilidad y Pruebas de Estrés',
    description: 'Simulación de fatiga de estados, redundancia de memoria y protección ante cierres.'
  },
  {
    id: 'fase-1-6',
    name: 'Bloque 1.7: Certificación Empírica del Editor Real',
    description: 'Batería permanente de certificación experimental utilizando exclusivamente los componentes reales de OnePixel Studio.'
  }
];

export const INITIAL_TEST_SUITE: QATestCase[] = [
  // --- FASE 1: HERRAMIENTAS ---
  {
    id: 'f1-pencil',
    phaseId: 'fase-1',
    name: 'Herramienta de Lápiz - Trazo Preciso',
    description: 'Verifica el trazado pixel a pixel sin desviaciones de alias.',
    module: 'Brushes',
    type: 'guided',
    steps: '1. Seleccione la herramienta Lápiz.\n2. Realice un trazo diagonal rápido en el lienzo.\n3. Verifique que no queden huecos de interpolación.',
    expected: 'Un trazo diagonal coherente sin píxeles huérfanos o desalineados.',
    status: 'not_executed'
  },
  {
    id: 'f1-eraser',
    phaseId: 'fase-1',
    name: 'Herramienta de Borrador - Limpieza de Búfer',
    description: 'Verifica la sustitución de color de píxel por valor transparente.',
    module: 'Brushes',
    type: 'guided',
    steps: '1. Dibuje una línea de color sólido.\n2. Seleccione el Borrador.\n3. Pase sobre la línea dibujada.',
    expected: 'Los píxeles afectados vuelven a ser transparentes (rgba 0,0,0,0) sin alterar el fondo.',
    status: 'not_executed'
  },
  {
    id: 'f1-bucket',
    phaseId: 'fase-1',
    name: 'Herramienta de Cubeta de Relleno',
    description: 'Relleno de áreas conexas con tolerancia de color cero.',
    module: 'Brushes',
    type: 'guided',
    steps: '1. Dibuje un círculo cerrado.\n2. Seleccione la Cubeta de Relleno.\n3. Haga clic dentro del círculo.',
    expected: 'El interior del círculo se rellena por completo sin desbordar el contorno.',
    status: 'not_executed'
  },
  {
    id: 'f1-line',
    phaseId: 'fase-1',
    name: 'Herramienta de Línea - Algoritmo Bresenham',
    description: 'Verifica la rectitud de la línea geométrica con Bresenham.',
    module: 'Brushes',
    type: 'guided',
    steps: '1. Seleccione la herramienta Línea.\n2. Presione clic, arrastre hasta otra esquina y suelte.',
    expected: 'Línea de interpolación perfecta sin dobles anchos innecesarios.',
    status: 'not_executed'
  },
  {
    id: 'f1-rectangle',
    phaseId: 'fase-1',
    name: 'Herramienta de Rectángulo - Bordes Lógicos',
    description: 'Verifica la renderización geométrica de rectángulos vacíos y rellenos.',
    module: 'Brushes',
    type: 'guided',
    steps: '1. Seleccione Rectángulo.\n2. Arrastre en el lienzo para crear un cuadrado de 10x10.',
    expected: 'Contorno rectangular simétrico dibujado en la capa actual.',
    status: 'not_executed'
  },
  {
    id: 'f1-circle',
    phaseId: 'fase-1',
    name: 'Herramienta de Círculo - Algoritmo Midpoint',
    description: 'Verifica que la simetría del círculo sea perfecta en bajas resoluciones.',
    module: 'Brushes',
    type: 'guided',
    steps: '1. Seleccione Círculo.\n2. Dibuje un círculo de diámetro 8 píxeles.',
    expected: 'Forma circular perfecta con simetría en los cuatro cuadrantes.',
    status: 'not_executed'
  },

  // --- FASE 2: SELECCIONES ---
  {
    id: 'f2-sel-rect',
    phaseId: 'fase-2',
    name: 'Selección Rectangular - Delimitación de Área',
    description: 'Establece una máscara booleana activa para limitar el dibujo.',
    module: 'Selections',
    type: 'guided',
    steps: '1. Defina un área de selección rectangular.\n2. Seleccione el pincel.\n3. Dibuje atravesando el borde de la selección.',
    expected: 'Solo se alteran los píxeles ubicados en el interior de la máscara de selección.',
    status: 'not_executed'
  },
  {
    id: 'f2-sel-lasso',
    phaseId: 'fase-2',
    name: 'Selección por Lazo Libre',
    description: 'Crea selecciones irregulares siguiendo el contorno del cursor.',
    module: 'Selections',
    type: 'guided',
    steps: '1. Active la herramienta Lazo.\n2. Trace un polígono cerrado.\n3. Cierre el bucle.',
    expected: 'Se genera una máscara exacta que se ajusta a la silueta cerrada trazada.',
    status: 'not_executed'
  },
  {
    id: 'f2-sel-wand',
    phaseId: 'fase-2',
    name: 'Herramienta de Varita Mágica (Color flood)',
    description: 'Crea una máscara de selección basada en coincidencia de color conexo.',
    module: 'Selections',
    type: 'guided',
    steps: '1. Tenga un lienzo con dos colores distintos en áreas separadas.\n2. Use la Varita Mágica en un bloque monocromo.',
    expected: 'Toda el área conexa del mismo color queda seleccionada de manera precisa.',
    status: 'not_executed'
  },
  {
    id: 'f2-transform',
    phaseId: 'fase-2',
    name: 'Transformación - Rotación y Escalado',
    description: 'Aplica matrices de transformación al área seleccionada.',
    module: 'Selections',
    type: 'guided',
    steps: '1. Haga una selección rectangular sobre un dibujo.\n2. Use los nodos de transformación para rotar 90 grados.\n3. Aplique el cambio.',
    expected: 'El dibujo gira respetando los límites de alias sin emborronar píxeles.',
    status: 'not_executed'
  },

  // --- FASE 3: BARRA DE OPCIONES ---
  {
    id: 'f3-brush-size',
    phaseId: 'fase-3',
    name: 'Slider de Tamaño de Pincel',
    description: 'Valida que el diámetro del pincel se dibuje simétricamente.',
    module: 'Brushes',
    type: 'guided',
    steps: '1. Cambie el tamaño del pincel a 3px.\n2. Haga un único clic en el lienzo.',
    expected: 'Se genera una huella de pincel en forma de cruz de 3x3 píxeles.',
    status: 'not_executed'
  },
  {
    id: 'f3-brush-opacity',
    phaseId: 'fase-3',
    name: 'Opacidad del Trazo Real',
    description: 'Verifica la mezcla alfa progresiva al presionar continuamente.',
    module: 'Color',
    type: 'guided',
    steps: '1. Ajuste opacidad a 50%.\n2. Trace sobre un fondo oscuro con color blanco.',
    expected: 'El resultado visual es un color gris con mezcla alfa perfecta (0.5).',
    status: 'not_executed'
  },

  // --- FASE 4: GUARDADO E HISTORIAL ---
  {
    id: 'f4-undo-redo',
    phaseId: 'fase-4',
    name: 'Pila Undo/Redo Determinista',
    description: 'Reconstruye el estado de capas de forma exacta tras deshacer.',
    module: 'History',
    type: 'auto',
    status: 'not_executed'
  },
  {
    id: 'f4-local-storage',
    phaseId: 'fase-4',
    name: 'Persistencia del Proyecto Activo',
    description: 'Recuperación íntegra de capas, frames y paletas tras recarga.',
    module: 'History',
    type: 'auto',
    status: 'not_executed'
  },

  // --- FASE 5: ESTABILIDAD Y ESTRÉS ---
  {
    id: 'f5-layer-stress',
    phaseId: 'fase-5',
    name: 'Fatiga de Capas (50 capas concurrentes)',
    description: 'Estresa el motor de composición visual uniendo 50 buffers de imagen.',
    module: 'Layers',
    type: 'stress',
    status: 'not_executed'
  },
  {
    id: 'f5-extreme-zoom',
    phaseId: 'fase-5',
    name: 'Zoom Extremo 3200% y Paneo',
    description: 'Estabilidad de coordenadas de renderizado con factores multiplicadores.',
    module: 'Canvas',
    type: 'stress',
    status: 'not_executed'
  },
  
  // --- BLOQUE 1.6: VALIDACIÓN EMPÍRICA DEL NÚCLEO ---
  {
    id: 'f16-project-lifecycle',
    phaseId: 'fase-1-6',
    name: 'Creación y Cierre de Proyectos',
    description: 'Simula la instanciación repetida de proyectos pixel art y su respectiva destrucción y liberación.',
    module: 'Canvas',
    type: 'stress',
    status: 'not_executed'
  },
  {
    id: 'f16-tabs-rapid',
    phaseId: 'fase-1-6',
    name: 'Apertura y Cierre Rápido de Pestañas',
    description: 'Comprueba la robustez de transiciones de panel a alta velocidad evitando excepciones reactivas.',
    module: 'Timeline',
    type: 'stress',
    status: 'not_executed'
  },
  {
    id: 'f16-canvas-resize',
    phaseId: 'fase-1-6',
    name: 'Redimensionado Continuo del Lienzo',
    description: 'Evalúa la estabilidad lógica de los buffers de píxeles al reconfigurar las dimensiones x/y.',
    module: 'Canvas',
    type: 'stress',
    status: 'not_executed'
  },
  {
    id: 'f16-sprite-scaling',
    phaseId: 'fase-1-6',
    name: 'Escalado de Sprites',
    description: 'Verifica la integridad de los algoritmos de redimensionamiento bilineal y nearest-neighbor.',
    module: 'Export',
    type: 'stress',
    status: 'not_executed'
  },
  {
    id: 'f16-layers-massive',
    phaseId: 'fase-1-6',
    name: 'Creación y Eliminación Masiva de Capas',
    description: 'Estresa el árbol de capas agregando, duplicando y borrando secuencialmente 30 nodos.',
    module: 'Layers',
    type: 'stress',
    status: 'not_executed'
  },
  {
    id: 'f16-frame-navigation',
    phaseId: 'fase-1-6',
    name: 'Navegación Rápida entre Frames',
    description: 'Mide la latencia de renderizado al alternar de forma veloz fotogramas de la línea de tiempo.',
    module: 'Timeline',
    type: 'stress',
    status: 'not_executed'
  },
  {
    id: 'f16-undo-redo',
    phaseId: 'fase-1-6',
    name: 'Undo/Redo Prolongado',
    description: 'Dispara 150 operaciones undo/redo simuladas y verifica el mantenimiento de las invariantes lógicas.',
    module: 'History',
    type: 'stress',
    status: 'not_executed'
  },
  {
    id: 'f16-continuous-drawing',
    phaseId: 'fase-1-6',
    name: 'Dibujo Continuo Sesiones Largas',
    description: 'Genera 2000 eventos de trazos continuos para buscar fugas de memoria o acumulación incontrolada.',
    module: 'Brushes',
    type: 'stress',
    status: 'not_executed'
  },
  {
    id: 'f16-import-export',
    phaseId: 'fase-1-6',
    name: 'Importación y Exportación de Archivos',
    description: 'Valida la consistencia de codificación Base64 y empaquetamiento del sprite en formato local JSON.',
    module: 'Import',
    type: 'stress',
    status: 'not_executed'
  },
  {
    id: 'f16-save-restore',
    phaseId: 'fase-1-6',
    name: 'Guardado y Restauración',
    description: 'Simula el ciclo de volcado instantáneo a base de almacenamiento local y su posterior parseo.',
    module: 'History',
    type: 'stress',
    status: 'not_executed'
  },
  {
    id: 'f16-tool-swap',
    phaseId: 'fase-1-6',
    name: 'Cambios Rápidos de Herramientas',
    description: 'Comprueba el ciclo de destrucción y reasignación de punteros y cursores de dibujo en el DOM.',
    module: 'Brushes',
    type: 'stress',
    status: 'not_executed'
  },
  {
    id: 'f16-zoom-pan',
    phaseId: 'fase-1-6',
    name: 'Zoom y Pan Extremos',
    description: 'Fuerza factores multiplicativos extremos de escala visual y traslación para auditar desbordamientos.',
    module: 'Canvas',
    type: 'stress',
    status: 'not_executed'
  },
  {
    id: 'f16-error-recovery',
    phaseId: 'fase-1-6',
    name: 'Recuperación tras Errores',
    description: 'Inyecta fallos simulados y verifica la autocuración sin pérdida de estado ni fallos del editor.',
    module: 'History',
    type: 'stress',
    status: 'not_executed'
  }
];
