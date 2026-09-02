import { LanguageCode } from '../i18n/types';

export interface ManualSection {
  id: string;
  title: string;
  category: string;
  content: string;
}

export interface WorkflowGuide {
  id: string;
  title: string;
  badge: string;
  category: string;
  summary: string;
  steps: Array<{
    title: string;
    description: string;
  }>;
  proTip?: string;
}

export interface ProTip {
  id: string;
  number: number;
  title: string;
  category: string;
  description: string;
  recommendation: string;
}

export interface TourStep {
  id: string;
  targetId: string;
  title: string;
  badge: string;
  description: string;
  features: string[];
  shortcutTip?: string;
}

// ------------------------------------------------------------------------------------------------
// 1. MANUAL DE USUARIO COMPLETO (25 Secciones Temáticas Estructuradas para OnePixel Studio)
// ------------------------------------------------------------------------------------------------
const MANUAL_SECTIONS_ES: ManualSection[] = [
  {
    id: 'intro',
    category: '1. Introducción',
    title: 'Introducción a OnePixel Studio',
    content: `OnePixel Studio es un entorno integral de creación gráfica, ilustración y animación pixel art diseñado desde cero para artistas, desarrolladores de videojuegos y creadores de contenido retro.

La filosofía fundamental de OnePixel Studio radica en el control deliberado y absoluto de cada píxel individual. A diferencia de los programas de edición gráfica tradicional que interpolan o difuminan los trazos, aquí cada punto de color se gestiona de forma exacta, permitiendo construir sprites, escenarios, texturas modulares y animaciones fluidas con precisión matemática.

OnePixel Studio combina la inmediatez de una interfaz moderna y responsiva con la potencia de un motor de capas no destructivo, gestión de paletas clásicas, timeline con papel cebolla y un pipeline de exportación optimizado para motores de videojuegos.`
  },
  {
    id: 'interface',
    category: '2. Espacio de Trabajo',
    title: 'Interfaz y Espacio de Trabajo',
    content: `El espacio de trabajo de OnePixel Studio se organiza de manera lógica para mantener el lienzo como elemento principal y minimizar distracciones:

• Barra Superior de Menús: Acceso a todos los comandos globales (Archivo, Editar, Ver, Seleccionar, Sprite, Paleta, Animación, Ventana y Ayuda).
• Pestañas de Proyectos: Permite trabajar con múltiples proyectos abiertos simultáneamente, alternando entre ellos con un solo clic.
• Barra de Opciones Superior: Se adapta a la herramienta activa mostrando parámetros como tamaño de pincel, modo Píxel Perfecto, tolerancia o simetría.
• Barra Lateral de Herramientas (Izquierda): Contiene todas las utilidades de dibujo, borrado, formas geométricas, selección y relleno.
• Gestor de Capas (Izquierda / Integrado): Controla la jerarquía de capas, visibilidad, bloqueo, opacidad y modos de fusión.
• Panel de Color y Previsualización (Derecha): Selector cromático HSV/RGB, muestras maestras, generador de rampas y ventana de preview en tiempo real.
• Línea de Tiempo (Inferior): Administrador de fotogramas, velocidad FPS, etiquetas de animación y controles de reproducción.
• Modo Zen (F11 / Menú Ventana): Oculta temporalmente los paneles laterales para centrarse al 100% en el lienzo de dibujo.`
  },
  {
    id: 'canvas',
    category: '2. Espacio de Trabajo',
    title: 'Canvas, Mesa de Trabajo y Navegación',
    content: `El lienzo central es el corazón de OnePixel Studio. Su navegación es suave, reactiva y precisa:

• Zoom de Precisión: Gira la rueda del ratón hacia arriba o hacia abajo para hacer zoom in o zoom out centrado exactamente en la posición del cursor. También puedes usar los botones de lupa o los atajos Ctrl + / Ctrl -.
• Desplazamiento Espacial (Pan): Mantén pulsada la Barra Espaciadora y arrastra con el botón izquierdo del ratón, o mantén presionado el botón central del ratón (rueda) para mover el lienzo libremente.
• Centrado Instantáneo (Ctrl+0): Ajusta el lienzo al centro de la pantalla con una escala óptima para tener una vista general inmediata.
• Damero de Transparencia: El fondo en cuadrícula ajedrezada oscura indica áreas alfa transparentes, garantizando que puedas distinguir con claridad el fondo de los píxeles coloreados.`
  },
  {
    id: 'tools',
    category: '3. Herramientas de Dibujo',
    title: 'Herramientas de Dibujo y Edición',
    content: `OnePixel Studio incluye un arsenal completo de herramientas especializadas para pixel art:

• Pincel / Lápiz (B / P): Dibuja píxeles sobre la capa activa. Permite configurar el grosor (1 a 32 px) y activar el algoritmo Píxel Perfecto.
• Borrador (E): Elimina píxeles de la capa activa devolviéndolos a la transparencia alfa sin alterar las capas subyacentes.
• Línea Recta (L): Traza rectas perfectas utilizando el algoritmo clásico de Bresenham. Mantén pulsada la tecla Shift para restringir ángulos rectos y diagonales a 45°.
• Rectángulo y Elipse (U): Crea figuras geométricas con contorno o con relleno sólido manteniendo la proporción 1:1 al pulsar Shift.
• Bote de Pintura (G): Rellena áreas contiguas de color similar o sustituye colores de forma global en todo el lienzo según la tolerancia.
• Cuentagotas / Gotero (I / Alt): Muestrea con un clic cualquier color presente en el lienzo y lo establece como color activo.
• Pincel de Dithering: Aplica patrones de tramado retro (tablero de ajedrez, puntos dispersos, líneas diagonales) para crear degradados suaves sin añadir colores adicionales.
• Pincel de Spray: Aplica una dispersión controlada de píxeles para generar texturas de ruido, arena, follaje o chispas.`
  },
  {
    id: 'option_bar',
    category: '3. Herramientas de Dibujo',
    title: 'Barra de Opciones de Herramienta',
    content: `Ubicada horizontalmente sobre el lienzo, la barra de opciones contextualiza los parámetros de la herramienta seleccionada en cada instante:

• Tamaño de Pincel: Ajusta el diámetro del trazo en píxeles.
• Modo Píxel Perfecto: Algoritmo dinámico que analiza el trazo en tiempo real y elimina automáticamente las esquinas dobles ("L-shapes"), generando líneas limpias de un solo píxel de grosor.
• Tolerancia de Relleno: Para el Bote de Pintura y la Varita Mágica, define la sensibilidad a la variación de tono de los píxeles contiguos.
• Modo Contorno / Relleno: Para figuras geométricas, define si se dibuja solo el borde perimetral o la forma rellena.
• Patrones de Dithering: Selector de cuadrículas de tramado (2x2, 4x4, Bayer, Ajedrezado).
• Ejes de Simetría: Botones rápidos para activar el espejo en el eje X (horizontal) o eje Y (vertical).`
  },
  {
    id: 'layers',
    category: '4. Capas y Composición',
    title: 'Gestión de Capas y Modos de Fusión',
    content: `El trabajo en capas permite componer ilustraciones complejas de forma no destructiva:

• Creación y Duplicación: Añade capas ilimitadas con el botón '+' o duplica la capa actual para probar variaciones sin perder el original.
• Reordenamiento: Arrastra y suelta capas para cambiar la jerarquía visual (las capas superiores tapan a las inferiores).
• Visibilidad y Bloqueo: Haz clic en el icono del ojo para ocultar/mostrar una capa, o en el candado para protegerla contra trazos accidentales.
• Opacidad: Ajusta la transparencia global de cada capa de 0% a 100%.
• Modos de Fusión:
  - Normal: Superposición estándar de píxeles.
  - Multiplicar: Ideal para sombras y oscurecimientos naturales.
  - Pantalla: Ideal para brillos, luces y auras mágicas.
  - Superponer (Overlay): Aumenta el contraste combinando luz y sombra.
• Combinar hacia abajo (Merge Down): Une la capa activa con la inferior en un solo plano conservando los píxeles resultantes.`
  },
  {
    id: 'palettes',
    category: '5. Color y Paletas',
    title: 'Paletas de Colores y Rampas',
    content: `El color en el pixel art requiere cohesión y deliberación:

• Selector Cromático: Panel interactivo HSV / RGB para ajustar tono, saturación, brillo y canal alfa con precisión numérica.
• Rampas de Color: Generador integrado de transiciones tonales que ayuda a crear escalas de luz y sombra con saltos cromáticos armoniosos.
• Paletas Preestablecidas: Incluye una colección de paletas históricas consagradas (Game Boy 4-color, PICO-8 16-color, NES, Commodore 64, DawnBringer DB16/DB32, Endesga 32).
• Paletas Personalizadas: Guarda las muestras utilizadas en tu proyecto, añade nuevos tonos con el botón '+' o elimina colores no deseados.
• Biblioteca de Paletas: Permite importar y exportar paletas en formato GPL (compatible con Aseprite/GIMP/Photoshop), JASC PAL, ACT y JSON.`
  },
  {
    id: 'colors',
    category: '5. Color y Paletas',
    title: 'Gestión de Colores Primario y Secundario',
    content: `• Color Primario y Secundario: Dos ranuras de color activas listas para usar. El clic izquierdo pinta con el color primario y el clic derecho (o tecla de intercambio) utiliza el secundario.
• Intercambio Rápido (X): Presiona la tecla X en cualquier momento para alternar entre el color primario y el secundario.
• Restablecer Colores por Defecto (D): Restaura instantáneamente el color primario a negro (#000000) y el secundario a blanco (#FFFFFF).
• Historial de Colores Recientes: Muestra los últimos tonos aplicados en el documento para que puedas recuperarlos sin necesidad de usar el cuentagotas.`
  },
  {
    id: 'selection',
    category: '6. Selección y Transformación',
    title: 'Herramientas de Selección',
    content: `Aislar zonas del dibujo es fundamental para editar, mover o retocar partes específicas:

• Selección Rectangular (M): Arrastra un marco rectangular para aislar una región geométrica.
• Selección por Lazo Libre: Traza a mano alzada el contorno de un área irregular.
• Varita Mágica (W): Selecciona automáticamente todos los píxeles contiguos del mismo color respetando la tolerancia.
• Seleccionar Todo (Ctrl+A): Abarca la totalidad del lienzo activo.
• Deseleccionar (Ctrl+D / Esc): Limpia el marco de selección activo.
• Invertir Selección (Ctrl+Shift+I): Selecciona todo lo que estaba fuera del área marcada.
• Expandir y Contraer: Modifica el perímetro de la selección en 1 o más píxeles desde el menú Seleccionar.
• Rellenar Selección: Vierte el color primario en todos los píxeles dentro del área seleccionada.`
  },
  {
    id: 'transform',
    category: '6. Selección y Transformación',
    title: 'Transformaciones, Escala, Rotación y Volteo',
    content: `Una vez que tienes una selección activa, puedes manipular los píxeles contenidos:

• Desplazamiento Pixel-Perfect: Haz clic y arrastra dentro del área seleccionada para moverla. Las coordenadas se cuantizan a enteros para que los píxeles nunca queden desalineados.
• Transformación Libre: Muestra un cuadro delimitador con manejadores de esquina para escalar y rotar con un punto de pivote definido.
• Volteo Horizontal y Vertical: Invierte la selección en espejo horizontal (espejo izquierda/derecha) o vertical (arriba/abajo).
• Rotaciones Rápidas de 90° y 180°: Gira el contenido en incrementos ortogonales limpios sin distorsión.
• Aplicar o Cancelar: Presiona Enter para confirmar y fusionar los píxeles transformados en la capa activa, o presiona Escape para cancelar y restaurar los píxeles originales intactos.`
  },
  {
    id: 'symmetry',
    category: '7. Ayudas Visuales',
    title: 'Modos de Simetría en Tiempo Real',
    content: `La simetría duplica cada trazo simultáneamente en el lado opuesto del lienzo, ideal para diseñar rostros, personajes frontales, armaduras, armas y naves espaciales:

• Simetría Horizontal (Eje Y): Dibuja a la izquierda y refleja automáticamente a la derecha.
• Simetría Vertical (Eje X): Dibuja en la mitad superior y refleja en la mitad inferior.
• Simetría Bidireccional (Cruzada): Refleja en los 4 cuadrantes al mismo tiempo.
• Indicador Visual: Una línea guía tenue sobre el lienzo muestra la posición exacta del eje de simetría activo.`
  },
  {
    id: 'grid_guides',
    category: '7. Ayudas Visuales',
    title: 'Cuadrícula, Reglas y Guías Magnéticas',
    content: `• Cuadrícula de Píxeles: Se vuelve visible al acercar el zoom (a partir del 400%), delimitando con líneas nítidas cada píxel individual.
• Cuadrícula de Celdas / Tiles: Configurable en tamaños estándar (8x8, 16x16, 32x32, 64x64) para diseñar tilesets y mosaicos modulares.
• Reglas Superior e Izquierda: Muestran las coordenadas de posición en píxeles.
• Guías Magnéticas: Haz clic y arrastra desde la regla superior o izquierda hacia el lienzo para colocar líneas guía de alineación. Las herramientas se imantan a las guías activas para trazar alineaciones perfectas.`
  },
  {
    id: 'animation',
    category: '8. Animación y Timeline',
    title: 'Animación y Conceptos Clave',
    content: `La animación en pixel art se basa en la técnica tradicional fotograma a fotograma (Frame by Frame):

• Fotogramas Clave (Keyframes): Las poses principales que definen los extremos de un movimiento (ej. contacto, anticipación, paso y caída en un ciclo de caminata).
• Interpolaciones / In-betweens: Los fotogramas intermedios que conectan fluidamente una pose clave con la siguiente.
• Tasa de Fotogramas (FPS): Controla la velocidad de reproducción. Valores comunes en pixel art son 8, 10, 12 FPS para estilos retro clásicos y 24 o 30 FPS para animaciones ultra fluidas.
• Etiquetas de Animación (Tags): Permiten organizar los fotogramas en bloques con nombre (ej. "Idle" del frame 1 al 4, "Run" del 5 al 10, "Attack" del 11 al 16) facilitando el trabajo con personajes complejos.`
  },
  {
    id: 'timeline',
    category: '8. Animación y Timeline',
    title: 'Timeline (Línea de Tiempo)',
    content: `La barra inferior de animación te permite gestionar todos los fotogramas de tu proyecto:

• Añadir Fotograma: Crea un fotograma nuevo vacío o duplica el actual con todos sus píxeles.
• Navegación Rápida: Usa las teclas ',' y '.' (o botones prev/next) para avanzar o retroceder de fotograma sin pausar el flujo de trabajo.
• Modos de Reproducción:
  - Normal (Forward): Reproduce del primer al último fotograma y reinicia en bucle continuo.
  - Ping-Pong: Reproduce hacia adelante y luego en reversa consecutiva (ideal para ciclos de respiración o flotación).
  - Reversa: Reproduce los fotogramas en orden inverso.
• Reordenamiento: Arrastra las miniaturas en la línea de tiempo para reorganizar el orden de la secuencia animada.`
  },
  {
    id: 'onion_skin',
    category: '8. Animación y Timeline',
    title: 'Papel Cebolla (Onion Skinning)',
    content: `El papel cebolla proyecta sombras translúcidas de los fotogramas adyacentes sobre el fotograma actual para ayudarte a calcular arcos de movimiento e interpolaciones:

• Fotogramas Anteriores (Tinte Rojo / Cálido): Muestran de dónde viene el movimiento en los fotogramas previos.
• Fotogramas Posteriores (Tinte Verde / Frío): Muestran hacia dónde va el movimiento en los fotogramas siguientes.
• Configuración: Puedes ajustar la opacidad del papel cebolla y el número de fotogramas visibles antes y después desde el menú Animación.`
  },
  {
    id: 'preview',
    category: '8. Animación y Timeline',
    title: 'Ventana de Previsualización (Preview)',
    content: `El panel flotante de Preview ubicado a la derecha te permite ver tu sprite animado en tiempo real sin que el zoom de trabajo interfiera:

• Escala Real 1x y Zoom Ampliado: Comprueba cómo se ve tu sprite a su tamaño original de juego (1x) o ampliado (2x, 4x, 8x).
• Reproducción Independiente: Puedes activar o pausar la animación en la ventana de preview mientras continúas dibujando píxeles en el lienzo principal.
• Fondo de Contraste: Cambia el fondo del preview entre transparente, blanco, gris o negro para evaluar la legibilidad del sprite contra distintos entornos de juego.`
  },
  {
    id: 'import',
    category: '9. Archivos e Integración',
    title: 'Importación de Imágenes y Proyectos',
    content: `OnePixel Studio ofrece opciones flexibles para incorporar recursos externos:

• Formatos de Imagen Compatibles: Importa archivos PNG, JPG, GIF, WEBP y BMP.
• Opciones de Colocación:
  - En Capa Nueva: Inserta la imagen importada como una capa independiente preservando el resto de tu arte.
  - En Capa Activa: Combina la imagen directamente sobre la capa seleccionada.
• Importación de Sprite Sheets: Corta automáticamente una hoja de sprites en fotogramas individuales especificando el ancho y alto de cada celda.
• Apertura de Proyectos Nativos (.onepixel): Carga proyectos completos conservando todas las capas, etiquetas, paletas e historial.`
  },
  {
    id: 'save',
    category: '9. Archivos e Integración',
    title: 'Guardado y Guardar Como (.onepixel)',
    content: `• Formato Nativo .onepixel: Almacena la estructura completa de tu obra: dimensiones, todas las capas con sus nombres y modos de fusión, cada fotograma de animación, etiquetas y paletas asociadas.
• Guardado Rápido (Ctrl+S): Actualiza el proyecto activo en el almacenamiento local del navegador para que no pierdas tus cambios.
• Guardar Como... (Ctrl+Shift+S): Permite descargar el archivo .onepixel a tu ordenador o elegir una ubicación del sistema de archivos local mediante la API moderna de acceso a archivos.
• Recuperación Automática: OnePixel Studio guarda instantáneas periódicas de seguridad en el almacenamiento local para prevenir pérdidas accidentales ante un cierre inesperado del navegador.`
  },
  {
    id: 'export',
    category: '10. Exportación',
    title: 'Exportación de Archivos',
    content: `El sistema de exportación de OnePixel Studio genera archivos finales listos para compartir o publicar:

• PNG Estático: Exporta el fotograma actual o la composición completa con fondo transparente.
• GIF Animado: Genera un archivo GIF con bucle continuo optimizado para redes sociales, portfolios y web.
• APNG (PNG Animado): PNG con canal alfa de 24 bits completo que ofrece transparencias suaves sin los bordes dentados del GIF tradicional de 1 bit alfa.
• Hojas de Sprites (Sprite Sheet): Empaqueta todos los fotogramas en una cuadrícula compacta ordenada por columnas o filas.
• Formatos Binarios: Exporta en BMP, TGA o archivos de icono ICO para aplicaciones de escritorio.
• Multiplicadores de Escala (1x a 10x): Escala tus creaciones mediante el algoritmo de Vecino Más Cercano (Nearest-Neighbor) para que los píxeles se mantengan 100% nítidos sin desenfoque bilineal.`
  },
  {
    id: 'videogames',
    category: '10. Exportación',
    title: 'Exportación para Videojuegos y Motores',
    content: `OnePixel Studio está optimizado para flujos de trabajo de desarrollo de videojuegos:

• Compatibilidad con Motores: Genera hojas de sprites compatibles con Unity, Godot Engine, Unreal Engine, GameMaker Studio, RPG Maker, Defold y Phaser.
• Cuadrículas de Potencias de Dos: Organiza los sprites en dimensiones recomendadas para GPU (128x128, 256x256, 512x512, 1024x1024).
• Archivos de Datos JSON: Exporta la metadata de la hoja de sprites con coordenadas de cada celda, duración de frames y nombres de etiquetas de animación para importación automática en código.
• Ajuste de Filtro en Motores: Recuerda configurar la textura en tu motor de videojuegos con filtro "Point / Nearest Neighbor" y sin compresión con pérdida para mantener la nitidez retro.`
  },
  {
    id: 'preferences',
    category: '11. Configuración y Ajustes',
    title: 'Preferencias y Configuración',
    content: `Personaliza OnePixel Studio según tus necesidades desde el menú Preferencias:

• Idioma de la Interfaz: Selecciona entre Español, Inglés, Portugués, Chino Simplificado, Ruso o Japonés.
• Modo para Zurdos: Invierte la posición de las barras de herramientas y paneles laterales para una ergonomía óptima con tabletas gráficas o ratón en mano izquierda.
• Lápiz Digital / Tableta Gráfica: Optimiza la respuesta de entrada táctil y rechazo de palma para dispositivos con stylus (Wacom, Apple Pencil, Surface Pen).
• Botones Grandes / Modo Táctil: Aumenta el área interactiva de los controles para facilitar su uso en pantallas táctiles o monitores de alta resolución.
• Filtros de Daltonismo: Modos de simulación de protanopía, deuteranopía y tritanopía para verificar la accesibilidad visual de tus obras.`
  },
  {
    id: 'appearance',
    category: '11. Configuración y Ajustes',
    title: 'Modos de Interfaz y Apariencia',
    content: `• Tema Estándar Marino (60/30/10): La paleta insignia de OnePixel Studio con tonos petróleo oscuros, turquesas profundos y acentos en dorado noble (#C8A96A).
• Tema Oscuro (Dark Theme): Fondo neutro oscuro de alto contraste diseñado para sesiones de trabajo prolongadas con fatiga visual mínima.
• Tema Claro (Light Theme): Fondo limpio y claro para entornos muy iluminados.
• Maximizar Espacio de Trabajo: Oculta cabeceras y maximiza el área útil del lienzo.
• Modo Zen (F11): Oculta todas las barras laterales para una experiencia inmersiva sin distracciones.`
  },
  {
    id: 'shortcuts',
    category: '11. Configuración y Ajustes',
    title: 'Atajos de Teclado y Personalización',
    content: `Los atajos de teclado multiplican la velocidad de dibujo y animación:

• Atajos Esenciales:
  - B / P: Pincel / Lápiz
  - E: Borrador
  - L: Línea Recta
  - U: Figuras Geométricas (Rectángulo / Círculo)
  - G: Bote de Pintura
  - I / Alt: Cuentagotas
  - M / S: Herramientas de Selección
  - X: Intercambiar color primario y secundario
  - D: Colores por defecto (Negro / Blanco)
  - Espacio + Arrastrar: Desplazar lienzo (Pan)
  - Ctrl + Z: Deshacer
  - Ctrl + Y / Ctrl + Shift + Z: Rehacer
  - Ctrl + S: Guardar proyecto
  - Ctrl + E: Exportar
  - F1: Abrir Centro de Ayuda y Manual
• Personalizador de Atajos: En la pestaña "Atajos de Teclado" del Centro de Ayuda puedes reasignar cualquier combinación de teclas, detectar conflictos en tiempo real y exportar/importar tu perfil de atajos.`
  },
  {
    id: 'responsive',
    category: '12. Soporte y Dispositivos',
    title: 'Diseño Adaptativo: Desktop, Tablet y Mobile',
    content: `OnePixel Studio se adapta de forma fluida a cualquier tamaño de pantalla y dispositivo:

• Escritorio (Desktop): Disposición completa en 3 columnas con barras de herramientas y paneles de capas/color siempre accesibles.
• Tabletas y Pantallas Medianas: Paneles laterales compactos y colapsables con tiradores retráctiles rápidos.
• Móvil (Mobile): Barra de navegación inferior flotante tipo dock con acceso rápido a herramientas, paleta de colores y línea de tiempo mediante cajones modales deslizables.
• Gestos Táctiles: Soporte nativo para pellizcar para hacer zoom (pinch to zoom) y arrastrar con dos dedos para desplazarse por el lienzo.`
  },
  {
    id: 'support',
    category: '12. Soporte y Dispositivos',
    title: 'Ayuda, Soporte y Diagnóstico',
    content: `• Centro de Ayuda Integrado (F1): Acceso permanente a este Manual Completo, las Guías Rápidas de Flujo de Trabajo, los 10 Consejos Pro y la configuración de Atajos.
• Recorrido Interactivo Guiado: Un tour paso a paso que te acompaña visualmente por cada sección de la interfaz para que domines el programa en minutos.
• Canal de Feedback y Sugerencias: Envía tus ideas, peticiones de funcionalidades o comentarios directamente desde el menú Ayuda > Enviar Sugerencia.
• Panel de Diagnóstico y Estado del Sistema: Herramienta de telemetría y salud del sistema que verifica la integridad de los subsistemas y previene anomalías de rendimiento.`
  }
];

// ------------------------------------------------------------------------------------------------
// 2. GUÍAS RÁPIDAS DE FLUJOS DE TRABAJO (13 Flujos Reorganizados)
// ------------------------------------------------------------------------------------------------
const WORKFLOW_GUIDES_ES: WorkflowGuide[] = [
  {
    id: 'wf_create',
    title: 'Cómo crear un dibujo desde cero',
    badge: 'Inicio y Lienzo',
    category: 'Dibujo',
    summary: 'Aprende a configurar tu primer documento y comenzar a dibujar con una estructura sólida.',
    steps: [
      {
        title: '1. Crear un Nuevo Proyecto',
        description: 'Ve a Archivo > Nuevo Proyecto o presiona el botón "+" en la barra de pestañas. Escoge un tamaño estándar de pixel art como 16x16 (iconos), 32x32 (sprites clásicos) o 64x64 (personajes detallados).'
      },
      {
        title: '2. Navegar y Ajustar el Lienzo',
        description: 'Usa la rueda del ratón para hacer zoom hasta que los píxeles sean cómodos de ver. Mantén pulsada la Barra Espaciadora y arrastra el ratón para centrar el área de trabajo.'
      },
      {
        title: '3. Bloquear la Silueta Base',
        description: 'Selecciona la herramienta Pincel (B) con un color oscuro y traza la forma general o silueta del objeto o personaje para verificar sus proporciones antes de entrar en detalles.'
      }
    ],
    proTip: 'Comienza siempre con tamaños pequeños (16x16 o 32x32). Es mucho más fácil aprender proporciones y dominar el control de cada píxel en lienzos reducidos.'
  },
  {
    id: 'wf_pixel_tools',
    title: 'Qué herramientas utilizar para dibujar Pixel Art',
    badge: 'Herramientas',
    category: 'Dibujo',
    summary: 'Guía sobre las herramientas principales y cuándo conviene utilizar cada una.',
    steps: [
      {
        title: 'Pincel (B) con Píxel Perfecto',
        description: 'Utilízalo para líneas y contornos limpios. Activa la opción "Píxel Perfecto" en la barra superior para que el motor elimine automáticamente las esquinas dobles no deseadas.'
      },
      {
        title: 'Borrador (E) y Cuentagotas (I)',
        description: 'Usa el borrador para esculpir formas eliminando píxeles sobrantes, y el cuentagotas (o tecla Alt) para reutilizar colores existentes sin buscarlos en la paleta.'
      },
      {
        title: 'Líneas (L) y Formas Geométricas (U)',
        description: 'Ideales para arquitectura, espadas, escudos y elementos mecánicos. Mantén pulsado Shift para restringir ángulos y proporciones 1:1.'
      },
      {
        title: 'Bote de Pintura (G) y Dithering',
        description: 'Rellena zonas grandes con el cubo de pintura y utiliza el pincel de dithering para generar sombreados retro con texturas en tablero de ajedrez.'
      }
    ],
    proTip: 'Alterna rápidamente entre el Pincel (B) y el Borrador (E) usando la mano izquierda en el teclado para esculpir siluetas con máxima velocidad.'
  },
  {
    id: 'wf_select_transform',
    title: 'Cómo seleccionar y transformar',
    badge: 'Transformación',
    category: 'Edición',
    summary: 'Aprende a mover, rotar, escalar y voltear partes de tu dibujo sin desalinear los píxeles.',
    steps: [
      {
        title: '1. Aislar con Herramientas de Selección (M / S)',
        description: 'Elige Selección Rectangular (M), Lazo Libre o Varita Mágica y encierra la parte del dibujo que deseas modificar.'
      },
      {
        title: '2. Desplazar o Transformar',
        description: 'Haz clic dentro de la selección para arrastrarla. O usa los tiradores de las esquinas para rotar o escalar la selección. Usa los botones de volteo horizontal/vertical para efectos de espejo.'
      },
      {
        title: '3. Confirmar o Cancelar',
        description: 'Presiona Enter para confirmar la transformación y fusionar los píxeles en la capa activa, o presiona Escape para cancelar y volver al estado original intacto.'
      }
    ],
    proTip: 'Todas las transformaciones en OnePixel Studio utilizan muestreo Nearest-Neighbor cuantizado a coordenadas enteras para evitar que los píxeles se vuelvan borrosos.'
  },
  {
    id: 'wf_layers',
    title: 'Cómo trabajar con capas',
    badge: 'Estructura',
    category: 'Capas',
    summary: 'Estructura tu ilustración en planos independientes para editar de forma no destructiva.',
    steps: [
      {
        title: '1. Crear Capas por Elemento',
        description: 'Organiza tu proyecto en al menos 3 capas: "Fondo", "Personaje/Objeto" y "Detalles/Efectos". Haz clic en "+" en el panel de capas para añadir una nueva.'
      },
      {
        title: '2. Bloquear y Ocultar',
        description: 'Haz clic en el icono del candado para bloquear una capa mientras dibujas en otra adyacente. Esto evita pintar accidentalmente sobre el lineart o el fondo.'
      },
      {
        title: '3. Usar Modos de Fusión para Sombras y Luces',
        description: 'Crea una capa superior, cambia su modo de fusión a "Multiplicar" para pintar sombras con un tono morado/azulado suave, o a "Pantalla" para brillos y auras mágicas.'
      }
    ],
    proTip: 'Renombra tus capas haciendo doble clic sobre su nombre en el panel para mantener tu proyecto organizado cuando supere las 5 o 10 capas.'
  },
  {
    id: 'wf_create_anim',
    title: 'Cómo crear una animación paso a paso',
    badge: 'Animación',
    category: 'Animación',
    summary: 'Flujo completo para crear secuencias animadas fluidas desde el primer fotograma.',
    steps: [
      {
        title: '1. Diseñar la Pose Clave Inicial',
        description: 'Dibuja la pose principal en el fotograma 1 (por ejemplo, el contacto de un personaje en reposo o el inicio de un ataque).'
      },
      {
        title: '2. Añadir o Duplicar Fotogramas',
        description: 'Haz clic en "+" en la línea de tiempo inferior para añadir un nuevo frame, o en "Duplicar" para reutilizar la pose anterior y modificar solo las partes en movimiento.'
      },
      {
        title: '3. Activar el Papel Cebolla (Onion Skin)',
        description: 'Enciende el papel cebolla para ver la sombra del fotograma anterior en rojo y calcular con precisión cuánto debe desplazarse cada extremidad o elemento.'
      },
      {
        title: '4. Ajustar la Velocidad FPS y Probar',
        description: 'Establece la velocidad entre 8 y 14 FPS en la barra de animación y presiona la barra espaciadora o el botón Play para verificar la fluidez del movimiento en bucle.'
      }
    ],
    proTip: 'Verifica la silueta de tu animación en el panel de Preview flotante a la derecha mientras reproduces el ciclo para asegurarte de que el movimiento sea legible a escala 1x.'
  },
  {
    id: 'wf_anim_tools',
    title: 'Qué herramientas utilizar para animar',
    badge: 'Herramientas Animadas',
    category: 'Animación',
    summary: 'Herramientas esenciales para agilizar el trabajo de interpolación y animación cuadro a cuadro.',
    steps: [
      {
        title: 'Papel Cebolla con Tintes Diferenciados',
        description: 'Muestra en rojo cálido los fotogramas pasados y en verde frío los futuros para trazar arcos de trayectoria limpios.'
      },
      {
        title: 'Atajos de Navegación (, y .)',
        description: 'Usa las teclas de coma y punto para saltar hacia atrás o adelante entre fotogramas rápidamente con la mano izquierda mientras dibujas con el ratón.'
      },
      {
        title: 'Duplicación y Modificación Parcial',
        description: 'Duplica el fotograma base y selecciona solo la parte que cambia (ej. un brazo o un arma) con la herramienta Lazo para moverla y retocar solo los bordes.'
      }
    ],
    proTip: 'Aplica el principio de Anticipación: antes de un movimiento rápido hacia adelante, haz que el personaje retroceda 1 fotograma para dar sensación de peso y energía.'
  },
  {
    id: 'wf_timeline',
    title: 'Cómo utilizar Timeline (Línea de Tiempo)',
    badge: 'Timeline',
    category: 'Animación',
    summary: 'Aprende a gestionar fotogramas, reordenar secuencias y configurar etiquetas de animación.',
    steps: [
      {
        title: '1. Navegar por los Fotogramas',
        description: 'Haz clic en cualquier celda numérica de la línea de tiempo inferior para seleccionar ese fotograma y mostrarlo en el lienzo.'
      },
      {
        title: '2. Reordenar y Eliminar',
        description: 'Arrastra una miniatura a una nueva posición en la secuencia para cambiar el orden de la animación. Usa el icono de papelera para eliminar fotogramas sobrantes.'
      },
      {
        title: '3. Modos de Reproducción Especiales',
        description: 'Prueba el modo "Ping-Pong" desde el menú Animación para bucles de respiración o flotación que deben reproducirse hacia adelante y hacia atrás de forma continua.'
      }
    ],
    proTip: 'Puedes ajustar la tasa de fotogramas por segundo (FPS) en cualquier momento con los botones +/- en la cabecera de la línea de tiempo.'
  },
  {
    id: 'wf_onion_skin',
    title: 'Cómo utilizar papel cebolla (Onion Skin)',
    badge: 'Onion Skin',
    category: 'Animación',
    summary: 'Domina la visualización de fotogramas fantasma para sincronizar movimientos complejos.',
    steps: [
      {
        title: '1. Activar el Papel Cebolla',
        description: 'Ve a Animación > Papel Cebolla o presiona el icono de cebolla en la barra de controles de animación.'
      },
      {
        title: '2. Interpretar los Colores',
        description: 'El tinte rojo/cálido representa lo que estaba dibujado en el fotograma anterior; el tinte verde/frío representa lo que vendrá en el fotograma siguiente.'
      },
      {
        title: '3. Ajustar el Alcance y la Opacidad',
        description: 'Configura si deseas ver 1, 2 o 3 fotogramas de distancia y ajusta la opacidad para que las sombras fantasma no tapen tu dibujo actual.'
      }
    ],
    proTip: 'Si estás animando un efecto de fuego o humo, usa el papel cebolla para asegurarte de que cada chispa o voluta ascienda siguiendo un flujo continuo sin saltos bruscos.'
  },
  {
    id: 'wf_import_file',
    title: 'Cómo importar un archivo o imagen',
    badge: 'Importación',
    category: 'Archivos',
    summary: 'Aprende a cargar imágenes externas, referencias o proyectos guardados previamente.',
    steps: [
      {
        title: '1. Abrir el Menú de Importación',
        description: 'Ve a Archivo > Importar Imagen / Archivo... o presiona Ctrl+I.'
      },
      {
        title: '2. Seleccionar el Archivo',
        description: 'Elige una imagen en formato PNG, JPG, GIF, WEBP o un proyecto nativo .onepixel de tu disco local.'
      },
      {
        title: '3. Elegir Destino de Colocación',
        description: 'Selecciona "En Nueva Capa" para conservar tu arte intacto o "En Capa Activa" para pegar el contenido directamente en la capa actual.'
      }
    ],
    proTip: 'Si importas una imagen de referencia, colócala en una capa inferior y reduce su opacidad al 30% para calcar o estudiar proporciones fácilmente.'
  },
  {
    id: 'wf_work_imported',
    title: 'Cómo trabajar con un archivo importado',
    badge: 'Flujo de Referencias',
    category: 'Archivos',
    summary: 'Ajusta la escala, limpia colores y extrae elementos de imágenes importadas.',
    steps: [
      {
        title: '1. Ajustar Dimensiones y Posición',
        description: 'Usa las herramientas de selección y transformación para mover la imagen importada a la posición deseada dentro de tu lienzo.'
      },
      {
        title: '2. Reducir y Armonizar la Paleta',
        description: 'Usa la herramienta Cuentagotas (I) para muestrear los colores clave de la imagen importada y añadirlos a tu paleta personalizada de OnePixel Studio.'
      },
      {
        title: '3. Limpieza de Bordes',
        description: 'Aplica el Borrador (E) o la Varita Mágica para eliminar fondos opacos y dejar únicamente los sprites que necesitas.'
      }
    ],
    proTip: 'Si la imagen importada tiene un tamaño mayor al lienzo, puedes redimensionar el lienzo desde Sprite > Cambiar Tamaño del Lienzo sin perder píxeles.'
  },
  {
    id: 'wf_export',
    title: 'Cómo exportar tus creaciones',
    badge: 'Exportación',
    category: 'Exportación',
    summary: 'Guía paso a paso para exportar en PNG, GIF animado, APNG o Sprite Sheet.',
    steps: [
      {
        title: '1. Abrir el Diálogo de Exportación',
        description: 'Ve a Archivo > Exportar... o presiona el atajo Ctrl+E.'
      },
      {
        title: '2. Seleccionar el Formato Adecuado',
        description: 'Elige PNG para imágenes estáticas, GIF o APNG para animaciones web, o Sprite Sheet para integrar en motores de videojuegos.'
      },
      {
        title: '3. Elegir el Factor de Escala',
        description: 'Selecciona un multiplicador (ej. 4x u 8x) para que tu arte se vea grande y nítido en redes sociales y navegadores sin perder el aspecto pixelado.'
      },
      {
        title: '4. Descargar o Guardar en Carpeta',
        description: 'Haz clic en "Exportar Archivo" para descargarlo inmediatamente o guardarlo en tu equipo.'
      }
    ],
    proTip: 'Para publicar en redes sociales como X o Discord, exporta siempre a 4x o 8x. La escala 1x nativa (ej. 32x32) se ve minúscula en pantallas de alta resolución.'
  },
  {
    id: 'wf_game_projects',
    title: 'Cómo trabajar con proyectos orientados a videojuegos',
    badge: 'Game Dev',
    category: 'Videojuegos',
    summary: 'Configuración óptima para exportar recursos limpios listos para Unity, Godot y otros motores.',
    steps: [
      {
        title: '1. Trabajar con Celdas Potencias de Dos',
        description: 'Crea tus personajes y tilesets en dimensiones estándar: 16x16, 32x32 o 64x64. Las tarjetas gráficas procesan estas medidas de forma óptima.'
      },
      {
        title: '2. Exportar como Sprite Sheet',
        description: 'En el diálogo de exportación, selecciona "Sprite Sheet" y define el número de columnas para organizar las animaciones ("Idle", "Walk", "Jump") en una sola textura.'
      },
      {
        title: '3. Configurar el Filtro en el Motor',
        description: 'Al importar la textura en Unity, Godot o Unreal, cambia el modo de filtrado de "Bilinear / Linear" a "Point / Nearest" y desactiva la compresión con pérdida.'
      }
    ],
    proTip: 'Exporta siempre el archivo de proyecto .onepixel junto con tu spritesheet para poder volver a editar capas y etiquetas de animación en el futuro.'
  },
  {
    id: 'wf_project_types',
    title: 'Qué tipos de proyectos pueden realizarse en OnePixel Studio',
    badge: 'Posibilidades',
    category: 'Videojuegos',
    summary: 'Descubre todo lo que puedes crear en OnePixel Studio.',
    steps: [
      {
        title: 'Sprites y Personajes de Videojuegos',
        description: 'Diseña personajes, enemigos, NPCs, jefes finales y accesorios con animaciones fluidas fotograma a fotograma.'
      },
      {
        title: 'Tilesets y Escenarios Modulares',
        description: 'Crea conjuntos de baldosas de terreno (suelo, paredes, agua, vegetación) que encajen perfectamente en cuadrículas de 16x16 o 32x32.'
      },
      {
        title: 'Iconos, UI e Interfaces Retro',
        description: 'Diseña botones, marcos de diálogo, barras de vida, inventarios e iconos de objetos (armas, pociones, armaduras).'
      },
      {
        title: 'Ilustraciones y Fondos Parallax',
        description: 'Compón paisajes y fondos por capas independientes para crear efectos de profundidad parallax en juegos de plataformas o RPGs.'
      },
      {
        title: 'Avatares y Emotes para Redes Sociales',
        description: 'Crea avatares animados y emotes personalizados listos para Twitch, Discord o foros comunitarios.'
      }
    ],
    proTip: 'Aprovecha las paletas históricas de OnePixel Studio (Game Boy, PICO-8, NES) para darle a tus proyectos una identidad retro auténtica.'
  }
];

// ------------------------------------------------------------------------------------------------
// 3. 10 CONSEJOS PROFESIONALES PARA PIXEL ART (Rich & Practical Pro Tips)
// ------------------------------------------------------------------------------------------------
const PRO_TIPS_ES: ProTip[] = [
  {
    id: 'tip_1',
    number: 1,
    title: 'Resolución y Escala Inicial: Empieza Pequeño',
    category: 'Resolución',
    description: 'En el pixel art, menos es más. Trabajar en un lienzo demasiado grande (ej. 256x256) antes de dominar los fundamentos genera trazos inconsistentes, pérdida de control píxel a píxel y fatiga visual.',
    recommendation: 'Comienza tus sprites en 16x16 o 32x32 píxeles. Cada píxel en estas dimensiones tiene un impacto directo en la lectura de la forma y te obliga a tomar decisiones deliberadas de diseño.'
  },
  {
    id: 'tip_2',
    number: 2,
    title: 'Píxel Perfecto: Elimina Jaggies y Esquinas Dobles',
    category: 'Píxel Perfecto',
    description: 'Los "jaggies" (píxeles escalonados irregulares) ocurren cuando una curva cambia bruscamente de longitud de segmento (por ejemplo: 3 píxeles, luego 1, luego 3) o cuando quedan píxeles dobles en las esquinas ("L-shapes").',
    recommendation: 'Activa siempre el modo "Píxel Perfecto" en la barra de opciones de OnePixel Studio para limpiar trazos automáticos y procura usar progresiones armónicas en curvas (ej. 3-2-1-1-2-3).'
  },
  {
    id: 'tip_3',
    number: 3,
    title: 'Paletas Restringidas y Control Cromático',
    category: 'Paletas',
    description: 'Utilizar demasiados colores dispersos debilita la cohesión y genera ruido visual. Los grandes clásicos del pixel art destacan por el uso magistral de paletas limitadas.',
    recommendation: 'Limita tus primeros proyectos a 8, 16 o 32 colores. Reutiliza los mismos tonos de sombra o luz para diferentes materiales (madera, cuero, tela) para darle armonía a toda la escena.'
  },
  {
    id: 'tip_4',
    number: 4,
    title: 'Prueba de Silueta y Contraste a Tamaño Real (1x)',
    category: 'Contraste',
    description: 'Mientras dibujas con un zoom del 800% o 1600%, es fácil perder la perspectiva de cómo se verá el sprite en el juego final.',
    recommendation: 'Mantén siempre un ojo en la ventana flotante de Preview a escala 1x. Si el personaje se reconoce instantáneamente solo por su silueta oscura contra el fondo, el diseño es sólido.'
  },
  {
    id: 'tip_5',
    number: 5,
    title: 'Siluetas y Lineart con Personalidad',
    category: 'Siluetas',
    description: 'Un contorno completamente negro y uniforme puede aplanar tu dibujo. Por otro lado, la ausencia total de contorno puede hacer que se pierda contra fondos complejos.',
    recommendation: 'Utiliza "Sel-out" (Selective Outlining): colorea las líneas de contorno con versiones más oscuras del color interior del objeto en lugar de negro puro, oscureciendo más las zonas en sombra y aclarando las expuestas a la luz.'
  },
  {
    id: 'tip_6',
    number: 6,
    title: 'Iluminación y Shading en Bloques: Evita el "Pillow Shading"',
    category: 'Iluminación',
    description: 'El "pillow shading" es el error clásico de sombrear todo el perímetro de un sprite hacia el centro como si fuera un cojín blando, sin definir un origen de luz real.',
    recommendation: 'Establece una fuente de luz clara (por ejemplo, arriba a la izquierda en ángulo de 45°) y agrupa las sombras y luces en bloques sólidos y claros que describan el volumen geométrico del objeto.'
  },
  {
    id: 'tip_7',
    number: 7,
    title: 'Animación: Aplastamiento, Estiramiento y Arcos de Movimiento',
    category: 'Animación',
    description: 'Las animaciones rígidas donde los objetos se desplazan sin deformación carecen de vida y energía.',
    recommendation: 'Aplica el principio de "Squash & Stretch" (aplasta el cuerpo 1 frame antes de un salto y estíralo durante la aceleración) y asegúrate de que extremidades y armas sigan arcos curvos suaves en lugar de líneas rectas.'
  },
  {
    id: 'tip_8',
    number: 8,
    title: 'Organización No Destructiva por Capas',
    category: 'Capas',
    description: 'Dibujar todo en una sola capa complica corregir poses, cambiar accesorios o reutilizar bases para diferentes skins.',
    recommendation: 'Separa tu sprite en capas lógicas: Fondo, Cuerpo Base, Ropa/Armadura, Armas y Efectos Especiales. Usa el modo de fusión "Multiplicar" en una capa superior para añadir sombras globales rápidamente.'
  },
  {
    id: 'tip_9',
    number: 9,
    title: 'Creación de Tilesets y Patrones Continuos Sin Costuras',
    category: 'Tilesets',
    description: 'Al crear baldosas de suelo o paredes repetibles, cualquier píxel desalineado en los bordes generará una molesta "costura" visible al multiplicar el mosaico.',
    recommendation: 'Verifica que los píxeles del borde izquierdo conecten de forma idéntica con el borde derecho, y el superior con el inferior. Usa el modo Tiling de OnePixel Studio para previsualizar la repetición infinita en tiempo real.'
  },
  {
    id: 'tip_10',
    number: 10,
    title: 'Preparación y Empaquetado de Sprites para Motores de Juego',
    category: 'Sprites para Motores',
    description: 'Exportar sprites con tamaños dispares o márgenes descentrados dificulta la configuración de pivotes y colliders en Unity, Godot o Unreal.',
    recommendation: 'Mantén un tamaño de celda uniforme para todas las animaciones de un personaje (ej. 32x32) con el punto de contacto de los pies centrado horizontalmente en la base de la celda. Al importar en el motor, configura el filtro en "Point (no filter)".'
  }
];

// ------------------------------------------------------------------------------------------------
// 4. PASOS DEL RECORRIDO INTERACTIVO GUIADO (Guided Interactive Tour)
// ------------------------------------------------------------------------------------------------
const TOUR_STEPS_ES: TourStep[] = [
  {
    id: 'welcome',
    targetId: 'project-tabs-container',
    title: 'Bienvenido a OnePixel Studio',
    badge: 'Recorrido Guiado 1/7',
    description: 'OnePixel Studio es tu suite profesional y ligera para crear arte pixelado, ilustrar en capas y animar fotograma a fotograma con precisión matemática.',
    features: [
      'Pestañas para trabajar con múltiples proyectos simultáneos.',
      'Soporte completo de atajos de teclado y personalización.',
      'Diseño responsivo adaptado a Desktop, Tablet y Móvil.'
    ],
    shortcutTip: 'Puedes avanzar con Flecha Derecha o cerrar en cualquier momento con Escape.'
  },
  {
    id: 'header',
    targetId: 'header-menu-bar',
    title: 'Barra Superior de Menús',
    badge: 'Menús Globales 2/7',
    description: 'Accede a todos los comandos del sistema organizados de forma estándar:',
    features: [
      'Archivo: Crear, guardar (.onepixel), abrir, importar y exportar (PNG, GIF, APNG, Spritesheet).',
      'Editar: Deshacer, rehacer, cortar, copiar, pegar y preferencias.',
      'Ver / Ventana: Reglas, guías, cuadrícula, temas de color y Modo Zen.',
      'Seleccionar & Sprite: Rotaciones, volteos, escalado y selección por color.',
      'Paleta & Animación: Gestión de muestras y controles de reproducción.'
    ],
    shortcutTip: 'Presiona Alt + letra subrayada o F1 para ayuda instantánea.'
  },
  {
    id: 'toolbar',
    targetId: 'left-toolbar-wrapper',
    title: 'Barra Lateral de Herramientas',
    badge: 'Herramientas de Dibujo 3/7',
    description: 'Tu caja de herramientas esencial para dibujar, editar y seleccionar píxeles:',
    features: [
      'Pincel (B) & Borrador (E): Trazos directos píxel a píxel.',
      'Líneas (L) & Figuras (U): Trazado matemático y geométrico con Bresenham.',
      'Bote de Pintura (G): Rellenos contiguos o globales según tolerancia.',
      'Selecciones (M / S): Rectángulo, lazo libre y varita mágica.',
      'Cuentagotas (I): Muestreo instantáneo de colores en el lienzo.'
    ],
    shortcutTip: 'Puedes alternar la visibilidad de la barra con su tirador lateral.'
  },
  {
    id: 'option_bar',
    targetId: 'option-bar',
    title: 'Barra de Opciones Contextual',
    badge: 'Parámetros 4/7',
    description: 'Ajusta los parámetros de la herramienta seleccionada en tiempo real:',
    features: [
      'Grosor del Pincel: Ajustable de 1 a 32 píxeles.',
      'Modo Píxel Perfecto: Elimina automáticamente esquinas dobles para líneas limpias.',
      'Ejes de Simetría: Reflejo en espejo horizontal (X) o vertical (Y).',
      'Tolerancia de Relleno y Dithering: Control de tramados retro.'
    ],
    shortcutTip: 'La barra cambia automáticamente al seleccionar otra herramienta.'
  },
  {
    id: 'canvas',
    targetId: 'canvas-viewport',
    title: 'Lienzo Central & Navegación',
    badge: 'Mesa de Trabajo 5/7',
    description: 'El área de dibujo central con renderizado reactivo y máxima nitidez:',
    features: [
      'Zoom con Rueda del Ratón: Acércate con precisión sobre el cursor.',
      'Desplazamiento (Pan): Mantén pulsada la Barra Espaciadora y arrastra con el ratón.',
      'Centrado Rápido (Ctrl+0): Encaja el lienzo en el centro del viewport.',
      'Cuadrícula y Guías Magnéticas: Arrastra desde las reglas para alinear.'
    ],
    shortcutTip: 'El damero ajedrezado oscuro indica transparencia alfa pura.'
  },
  {
    id: 'panels',
    targetId: 'right-column-wrapper',
    title: 'Panel de Color, Paletas & Preview',
    badge: 'Color y Vista 6/7',
    description: 'Controla la armonía cromática y visualiza tus creaciones en tiempo real:',
    features: [
      'Selector HSV / RGB: Ajuste exacto de tono, saturación, brillo y opacidad.',
      'Muestras y Paletas Clásicas: Presets de Game Boy, NES, PICO-8 y DB32.',
      'Colores Primario y Secundario: Alterna rápidamente presionando la tecla X.',
      'Ventana de Previsualización (Preview): Observa tu sprite a escala real 1x.'
    ],
    shortcutTip: 'Presiona D para restaurar colores por defecto (Negro / Blanco).'
  },
  {
    id: 'timeline',
    targetId: 'bottom-timeline-wrapper',
    title: 'Línea de Tiempo & Animación',
    badge: 'Animación Frame a Frame 7/7',
    description: 'Crea secuencias de movimiento fluidas con todas las utilidades de animación:',
    features: [
      'Añadir y Duplicar Frames: Crea poses clave e interpolaciones.',
      'Papel Cebolla (Onion Skin): Proyecta fotogramas previos (rojo) y siguientes (verde).',
      'Velocidad FPS: Ajusta los fotogramas por segundo en tiempo real.',
      'Modos de Reproducción: Normal, Ping-Pong y Reversa.'
    ],
    shortcutTip: 'Usa las teclas de coma (,) y punto (.) para navegar entre frames mientras dibujas.'
  }
];

// ------------------------------------------------------------------------------------------------
// 5. DATA LOCALIZATION MAPPER & EXPORT HELPERS
// ------------------------------------------------------------------------------------------------
export function getManualSections(lang: LanguageCode = 'es'): ManualSection[] {
  // For now, return comprehensive Spanish base or translate if English requested
  if (lang === 'en') {
    return MANUAL_SECTIONS_ES.map(s => ({
      id: s.id,
      category: translateCategoryEn(s.category),
      title: translateTitleEn(s.title),
      content: s.content // Fallback or translated content
    }));
  }
  return MANUAL_SECTIONS_ES;
}

export function getWorkflowGuides(lang: LanguageCode = 'es'): WorkflowGuide[] {
  return WORKFLOW_GUIDES_ES;
}

export function getProTips(lang: LanguageCode = 'es'): ProTip[] {
  return PRO_TIPS_ES;
}

export function getInteractiveTips(lang: LanguageCode = 'es'): ProTip[] {
  return PRO_TIPS_ES;
}

export function getTourSteps(lang: LanguageCode = 'es'): TourStep[] {
  return TOUR_STEPS_ES;
}

function translateCategoryEn(cat: string): string {
  const map: Record<string, string> = {
    '1. Introducción': '1. Introduction',
    '2. Espacio de Trabajo': '2. Workspace & Interface',
    '3. Herramientas de Dibujo': '3. Drawing Tools',
    '4. Capas y Composición': '4. Layers & Composition',
    '5. Color y Paletas': '5. Colors & Palettes',
    '6. Selección y Transformación': '6. Selection & Transform',
    '7. Ayudas Visuales': '7. Visual Guides & Grid',
    '8. Animación y Timeline': '8. Animation & Timeline',
    '9. Archivos e Integración': '9. Files & Integration',
    '10. Exportación': '10. Export Pipeline',
    '11. Configuración y Ajustes': '11. Settings & Preferences',
    '12. Soporte y Dispositivos': '12. Support & Devices'
  };
  return map[cat] || cat;
}

function translateTitleEn(title: string): string {
  const map: Record<string, string> = {
    'Introducción a OnePixel Studio': 'Introduction to OnePixel Studio',
    'Interfaz y Espacio de Trabajo': 'Interface & Workspace',
    'Canvas, Mesa de Trabajo y Navegación': 'Canvas, Artboard & Navigation',
    'Herramientas de Dibujo y Edición': 'Drawing & Editing Tools',
    'Barra de Opciones de Herramienta': 'Tool Options Bar',
    'Gestión de Capas y Modos de Fusión': 'Layer Management & Blend Modes',
    'Paletas de Colores y Rampas': 'Color Palettes & Ramps',
    'Gestión de Colores Primario y Secundario': 'Primary & Secondary Color Management',
    'Herramientas de Selección': 'Selection Tools',
    'Transformaciones, Escala, Rotación y Volteo': 'Transformations, Scaling, Rotation & Flip',
    'Modos de Simetría en Tiempo Real': 'Real-Time Symmetry Modes',
    'Cuadrícula, Reglas y Guías Magnéticas': 'Pixel Grid, Rulers & Magnetic Guides',
    'Animación y Conceptos Clave': 'Animation & Core Concepts',
    'Timeline (Línea de Tiempo)': 'Timeline & Frame Management',
    'Papel Cebolla (Onion Skinning)': 'Onion Skinning',
    'Ventana de Previsualización (Preview)': 'Real-Time Preview Panel',
    'Importación de Imágenes y Proyectos': 'Importing Images & Projects',
    'Guardado y Guardar Como (.onepixel)': 'Saving & Save As (.onepixel)',
    'Exportación de Archivos': 'Exporting Files',
    'Exportación para Videojuegos y Motores': 'Exporting for Game Engines',
    'Preferencias y Configuración': 'Preferences & Settings',
    'Modos de Interfaz y Apariencia': 'Interface Modes & Appearance',
    'Atajos de Teclado y Personalización': 'Keyboard Shortcuts & Customization',
    'Diseño Adaptativo: Desktop, Tablet y Mobile': 'Responsive Design: Desktop, Tablet & Mobile',
    'Ayuda, Soporte y Diagnóstico': 'Help, Support & Diagnostics'
  };
  return map[title] || title;
}

export const MANUAL_SECTIONS: ManualSection[] = MANUAL_SECTIONS_ES;
export const WORKFLOW_GUIDES: WorkflowGuide[] = WORKFLOW_GUIDES_ES;
export const PRO_TIPS: ProTip[] = PRO_TIPS_ES;
export const INTERACTIVE_TIPS: ProTip[] = PRO_TIPS_ES;
export const TOUR_STEPS: TourStep[] = TOUR_STEPS_ES;
