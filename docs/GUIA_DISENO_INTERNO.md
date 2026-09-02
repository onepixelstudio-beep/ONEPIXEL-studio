# GUÍA DE DISEÑO INTERNO (INTERNAL DESIGN GUIDE)
## OnePixel Studio — Referencia de UI/UX para la Fase 10

Esta guía de diseño interno documenta las especificaciones visuales, los tokens de diseño y los patrones de comportamiento de la interfaz de usuario de OnePixel Studio. Su propósito es unificar la estética de la aplicación bajo los principios de **claridad técnica**, **reducción de ruido visual** y **protagonismo del lienzo (Canvas-first)**.

---

## 1. Filosofía de Diseño: "La interfaz invisible"

*   **El lienzo es el héroe**: El espacio de trabajo (Canvas) debe poseer el mayor área física posible.
*   **Atenuación del ruido**: Los paneles laterales, bordes, sombras y menús deben usar colores apagados y de bajo contraste relativo, de modo que solo la obra del artista destaque con viveza.
*   **Animaciones mecánicas y discretas**: Transiciones cortas (150ms-200ms) de tipo `ease-out` para colapsar paneles y transiciones de estado instantáneas para hovers, imitando el software nativo profesional (Aseprite, Photoshop, VS Code).

---

## 2. Sistema de Espaciados (Grid de 4px / 8px)

Para evitar separaciones y rellenos arbitrarios, la aplicación emplea una escala uniforme basada en incrementos de **4px** y **8px**:

| Token Tailwind | Valor real | Caso de Uso Principal |
| :--- | :--- | :--- |
| `gap-1` / `p-1` | 4px | Espaciado interno de elementos pequeños (botones del timeline, paletas de color). |
| `gap-1.5` / `p-1.5` | 6px | Uniones de alta densidad (tabs de proyectos, botones de capas). |
| `gap-2` / `p-2` | 8px | Margen interno en sub-bloques y paddings de celdas. |
| `gap-2.5` / `p-2.5` | 10px | Espaciado entre paneles principales e hilos de herramental. |
| `gap-3` / `p-3` | 12px | Padding general de tarjetas flotantes y cabeceras de diálogo. |
| `gap-4` / `p-4` | 16px | Espaciado general en flujos de configuración y diálogos modales amplios. |

---

## 3. Radios de Borde (Border Radius)

Los bordes redondeados se aplican de forma jerárquica para reflejar el orden de anidación:

*   **`rounded-none` / `rounded-sm` (0px - 2px)**: No usados excepto para píxeles individuales o bloques de zoom.
*   **`rounded-md` (6px)**: Botones pequeños de herramientas, celdas de paleta de color y tabs individuales.
*   **`rounded-lg` (8px)**: Botones generales, selectores de opción, inputs de texto, barras de herramientas y menús contextuales.
*   **`rounded-xl` (12px)**: Tarjetas y paneles colapsables externos principales (Toolbar lateral, ColorPanel, OptionBar, Timeline).
*   **`rounded-2xl` / `rounded-3xl`**: Excluidos para mantener un lenguaje técnico, limpio e ingenieril.

---

## 4. Alturas y Tamaños de Controles Estándar

Para garantizar la simetría y consistencia visual entre elementos adyacentes:

*   **Botones de Herramienta de Toolbar**: `h-8 w-8` (32px x 32px) para barra principal.
*   **Botones de Control de Opción (OptionBar)**: `h-8` (32px) con relleno horizontal `px-2.5`.
*   **Inputs y Selectores numéricos**: Altura fija de `h-8` (32px), alineándose perfectamente con los botones adyacentes.
*   **Botón de Acción Principal (Modales)**: `h-9` (36px) con `px-4` para un tacto cómodo.
*   **Cabeceras de Panel**: Altura estándar de `h-9` (36px) o `h-10` (40px) con tipografía en negrita pequeña de `text-xs`.

---

## 5. Bordes y Delimitadores (Borders)

*   **Grosor de borde**: `border` (1px) de forma estándar para paneles, tarjetas e inputs.
*   **Color de borde estándar**:
    *   *Tema por defecto (Cosmic Slate)*: `#2e304f/80` o `#2e304f/40`.
    *   *Tema Dark (Neutral)*: `#27272a`.
    *   *Tema Light (Crisp)*: `#e4e4e7`.
*   **Bordes Dobles**: Quedan estrictamente prohibidos. No se debe anidar un contenedor con borde dentro de otro con borde si comparten la misma frontera física.

---

## 6. Paleta de Colores y Contrastes

La aplicación utiliza un sistema adaptativo basado en tres esquemas base:

### A. Cosmic Slate (Predefinido)
*   **Fondo de Aplicación**: `#0d0e1b` (un índigo-pizarra ultra-oscuro)
*   **Fondo de Paneles**: `#141525` o `#15162c`
*   **Bordes**: `#2e304f/80`
*   **Texto Principal**: `#f1f5f9` (Slate 100)
*   **Texto Secundario**: `#94a3b8` (Slate 400)

### B. Neutral Dark
*   **Fondo de Aplicación**: `#09090b` (Zinc 950)
*   **Fondo de Paneles**: `#18181b` (Zinc 900)
*   **Bordes**: `#27272a` (Zinc 800)
*   **Texto Principal**: `#f4f4f5` (Zinc 100)

### C. Crisp Light
*   **Fondo de Aplicación**: `#f4f4f5` (Zinc 100)
*   **Fondo de Paneles**: `#ffffff` (Blanco puro)
*   **Bordes**: `#e4e4e7` (Zinc 200)
*   **Texto Principal**: `#18181b` (Zinc 900)

---

## 7. Colores e Indicadores de Interacción (Accents)

El color de acento principal es el **Violeta / Indigo** de la marca, acompañado de colores funcionales de semántica de estado:

| Estado de Interacción | Expresión de Estilo | Descripción |
| :--- | :--- | :--- |
| **Normal / Reposo** | `bg-slate-800` / `bg-transparent` | Neutro, no capta la atención del artista. |
| **Hover (Paso de cursor)** | `bg-violet-600/10` / `hover:bg-[#202240]` | Feedback rápido e instantáneo de interactividad. |
| **Active / Selected** | `bg-violet-600` / `text-white` | Indica la herramienta activa o la capa seleccionada. |
| **Focus (Teclado/Input)** | `ring-2 ring-violet-500 ring-offset-1` | Enfoque claro para navegación accesible. |
| **Disabled (Inactivo)** | `opacity-40 cursor-not-allowed` | Totalmente transparente o gris apagado, no interactivo. |

---

## 8. Jerarquía Tipográfica (Typography)

Basado en la fuente de sistema **Inter** y monoespaciada **JetBrains Mono**:

*   **Títulos de Aplicación y Paneles**: `text-xs font-semibold tracking-wider uppercase text-slate-400`
*   **Etiquetas y Etiquetas de Input**: `text-xs font-medium text-slate-300`
*   **Valores de Datos / Rejilla**: `font-mono text-xs text-slate-100` (JetBrains Mono para números alineados).
*   **Mensajes de Error / Éxito**: `text-xs font-medium` acompañado de colores rojo o verde funcionales.

---
