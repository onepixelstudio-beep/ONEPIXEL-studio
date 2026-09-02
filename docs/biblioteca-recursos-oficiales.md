# Biblioteca de Recursos Oficiales — OnePixel Studio
**Catálogo Maestro de Assets y Manual de Especificaciones de Dirección de Arte (Senior Art Direction Standard)**

Este manual recoge las especificaciones visuales, parámetros técnicos, justificaciones de diseño y el índice completo de los **520 recursos oficiales** predeterminados de la biblioteca de **OnePixel Studio**. 

Esta colección predeterminada ha sido diseñada de forma jerárquica por categorías y subcategorías, asegurando una estética profesional de nivel de industria (comparable a herramientas líderes como Aseprite, Pyxel Edit y Pixel Studio). Para optimizar el rendimiento y evitar la saturación de memoria RAM durante la compilación, la biblioteca opera bajo un modelo de **hidratación asíncrona bajo demanda (Lazy Directory Architecture)**. El editor carga únicamente el índice maestro compacto en el inicio y recupera las pesadas matrices de píxeles o capas guía de forma perezosa a medida que el artista los activa en su lienzo de trabajo.

---

## Estructura de la Base de Datos de la Biblioteca (Lazy Loading Index)

El sistema organiza los recursos en 10 categorías principales que cubren desde la teoría del color hasta la animación avanzada y la integración directa con motores de videojuegos comerciales:

```
/assets/library/
├── catalogs/                 # Índices de hidratación dinámica (Archivos .json)
│   ├── index.json            # Metadatos unificados de los 520 recursos
│   ├── palettes.json         # Paletas indexadas (GPL / HEX)
│   ├── brushes.json          # Máscaras de pincel binarias
│   ├── templates.json        # Configuraciones de guías y rejillas
│   ├── patterns.json         # Sombreadores enlazables de tramado (seamless)
│   ├── gradients.json        # Rampas de color con desplazamiento tonal (Hue Shift)
│   ├── animations.json       # Esqueletos guía y poses de animación
│   ├── tilesets.json         # Conjuntos de terreno y reglas de autotile
│   ├── ui_hud.json           # Componentes 9-slice para interfaces de usuario
│   ├── vfx.json              # Hojas de sprites de partículas y efectos
│   └── academy.json          # Guías de práctica de la Academia de Pixel Art
```

---

## 🎨 Categoría 1. Paletas Oficiales e Históricas (50 Recursos)
*   **Identificador de Grupo**: `palette_*`
*   **Finalidad**: Proporcionar rampas de color equilibradas que prevengan el "banding visual" y el frotamiento inarmónico de color, optimizadas para el sombreado dinámico en capas.

### 1.1 Legacy Consoles (12 Recursos)
1.  **palette_legacy_pico8**: La icónica paleta de 16 colores puros y contrastados de la consola virtual PICO-8.
2.  **palette_legacy_gameboy_dmg**: Los 4 tonos verde oliva clásicos de la pantalla LCD reflectiva de la GameBoy de 1989.
3.  **palette_legacy_gameboy_pocket**: Versión corregida en grises verdosos de alta visibilidad para pantallas de segunda generación.
4.  **palette_legacy_c64**: Los 16 colores terrosos y de baja saturación característicos de la máquina Commodore 64.
5.  **palette_legacy_nes**: La paleta física completa de 56 colores del microprocesador de vídeo de la NES de 8 bits.
6.  **palette_legacy_sms_gamegear**: 32 colores intensos seleccionados para emular la riqueza cromática del hardware de SEGA.
7.  **palette_legacy_msx**: 16 colores fijos del procesador Texas Instruments TMS9918, con su característico tono verde profundo.
8.  **palette_legacy_zx_spectrum**: Los 8 colores básicos en sus modos normal y brillante (16 variaciones binarias de luminancia).
9.  **palette_legacy_cga_p1**: La clásica paleta de 4 colores de PC de 1981: Negro, Cian, Magenta y Blanco de alto impacto visual.
10. **palette_legacy_ega**: Los 16 colores puros de la tarjeta Enhanced Graphics Adapter, pionera en juegos de estrategia de PC.
11. **palette_legacy_vga_m13h**: El legendario mapa de 256 colores que impulsó los clásicos en 320x200 de los años 90.
12. **palette_legacy_mac_classic**: Blanco y negro absoluto (1 bit) sin escala de grises, ideal para interfaces dithered retro de 1984.

### 1.2 Historical Pixel Art Palettes (18 Recursos)
13. **palette_historical_db16**: Diseñada matemáticamente por Dawnbringer para exprimir la máxima combinación cromática con solo 16 tonos.
14. **palette_historical_db32**: La paleta hermana de 32 colores, un estándar absoluto para ilustración de escenarios detallados.
15. **palette_historical_endesga16**: Colores extremadamente cálidos y orgánicos creados por el diseñador de píxeles ENDESGA.
16. **palette_historical_endesga32**: Selección extendida ideal para juegos cozy, simuladores de agricultura y entornos pacíficos.
17. **palette_historical_endesga64**: Rampa cromática maestra de 64 colores con transiciones perfectas en marrones, verdes y ocres.
18. **palette_historical_aap64**: 64 colores multipropósito creados por Andry, equilibrando fantasía y tonos de sombra oscuros.
19. **palette_historical_arne16**: El conjunto seminal del artista Arne Niklas Jansson para sombreados volumétricos directos.
20. **palette_historical_arne32**: Paleta extendida de Arne con tonos intermedios perfectos para personajes de acción.
21. **palette_historical_sweetie16**: 16 tonos pastel suaves y limpios, excelentes para juegos infantiles y de estética cute.
22. **palette_historical_sweetie24**: Versión extendida de Sweetie con rampas de luz optimizadas para sprites de alta expresividad.
23. **palette_historical_resurrect64**: Una paleta arcade de 64 tonos vibrantes orientada a dar vida a videojuegos de acción de los 80.
24. **palette_historical_bubblegum16**: Tonos chicle saturados y divertidos, óptimos para mundos de fantasía y golosinas.
25. **palette_historical_slidervalg32**: Rampas de tonos fríos metálicos excelentes para mechas, robots e interiores de naves.
26. **palette_historical_marmg24**: Curada para simular el aspecto de las ilustraciones de cómics de mediados de siglo.
27. **palette_historical_famicom**: La versión de color calibrada de la consola japonesa de Nintendo, con tonos cálidos y pastel únicos.
28. **palette_historical_super_gameboy**: Los 4 tonos coloreados por defecto de los cartuchos clásicos al ejecutarse en SNES.
29. **palette_historical_cga_p2**: La segunda variación de CGA de baja saturación: Negro, Verde, Rojo y Marrón.
30. **palette_historical_steam_engine16**: Tonos óxido, bronce, latón y carbón específicos para el diseño de mundos Steampunk.

### 1.3 OnePixel Studio Exclusive Master Collections (20 Recursos)
31. **palette_onepixel_neon_noir**: Cyberpunk saturado con púrpuras profundos, cian eléctrico, rosa neón y amarillos de advertencia.
32. **palette_onepixel_autumn_warmth**: Tonos cobrizos, marrones de bellotas, amarillos de hojas caídas y un gris niebla para balancear.
33. **palette_onepixel_glacier_melt**: Azules gélidos, blancos de escarcha y un contraste de azul marino profundo casi negro de refracción.
34. **palette_onepixel_royal_velvet**: Púrpuras aristocráticos, púrpuras rojizos, dorados de brocado y un suntuoso verde esmeralda brillante.
35. **palette_onepixel_toxic_waste**: Verdes radiactivos, amarillos azufre, negros de alquitrán y acentos morado berenjena de peligro químico.
36. **palette_onepixel_desert_mirage**: Tonos arcillosos, arenas calientes, terracota oscuro y un turquesa pastel frío para reflejos en oasis.
37. **palette_onepixel_sakura_breeze**: Rosas pálidos de flor de cerezo, maderas suaves de bonsái y un blanco cremoso Zen de meditación.
38. **palette_onepixel_deep_ocean**: Azules abisales que transicionan a verdes fosforescentes de plancton y turquesas de agua poco profunda.
39. **palette_onepixel_vintage_ink**: Marrones sepia, marfiles envejecidos y negros de tinta de carbón para imitar grabados del siglo XIX.
40. **palette_onepixel_crimson_curse**: Rojos sangre oscuros, escarlatas intensos, grises ceniza y un color hueso amarillento de terror clásico.
41. **palette_onepixel_pixel_arcade**: Colores de gabinete arcade retro de los años 80: amarillos brillantes, azules eléctricos y magentas puros.
42. **palette_onepixel_swamp_gas**: Verdes musgo apagados, marrones lodo, grises verdosos y un amarillo fluorescente de fuego fatuo de ciénaga.
43. **palette_onepixel_cosmic_stardust**: Azules de cielo estrellado, púrpuras galácticos, rosas neón de nebulosa y amarillos estelares intensos.
44. **palette_onepixel_industrial_rust**: Grises metálicos sucios, naranjas de óxido de hierro desaturados y negros de hollín de carbón.
45. **palette_onepixel_porcelain_pastel**: Colores menta suaves, lavandas tiernos, rosas empolvados y cremas relajantes.
46. **palette_onepixel_volcanic_ash**: Grises de ceniza de piedra pómez, naranjas ígneos de magma fluido y rojos oscuros calientes.
47. **palette_onepixel_jungle_canopy**: Verdes de follaje tropical denso, marrones de liana y un amarillo de orquídeas exóticas.
48. **palette_onepixel_steam_brass**: Tonos latonados, bronces oxidados, verdes de pátina de cobre y un marrón de cuero de engranaje de vapor.
49. **palette_onepixel_boreal_tundra**: Verdes oliva fríos, grises liquen, azules pizarra y un marrón claro de astas de reno de clima polar.
50. **palette_onepixel_monochrome_chic**: Rampa de 16 niveles de grises neutros perfectos, calculada de forma logarítmica para una interfaz oscura.

---

## 🖌️ Categoría 2. Pinceles y Ajustes de Precisión (40 Recursos)
*   **Identificador de Grupo**: `brush_*`
*   **Finalidad**: Brindar trazos limpios de píxel perfecto sobre el canvas, eliminando las esquinas dobles redundantes en curvas de un píxel (Pixel Perfect Algorithms).

### 2.1 Basic Precision & Pen Shapes (10 Recursos)
51. **brush_basic_pp1**: Un solo píxel absoluto para retoque fino quirúrgico en alta ampliación de zoom.
52. **brush_basic_pp3_circle**: Pincel en cruz de 3x3 con algoritmo Pixel-Perfect que suprime esquinas no deseadas.
53. **brush_basic_square2x2**: Cuadrado rígido de 2x2 para estructuras arquitectónicas e interfaces ortogonales rápidas.
54. **brush_basic_square3x3**: Cuadrado rígido de 3x3 para trazar bloques de colisión y rellenar terrenos manualmente.
55. **brush_basic_circle5x5**: Círculo de 5x5 para pintar sprites redondos grandes o proyectiles esféricos.
56. **brush_basic_ink_chisel**: Cincel inclinado que emula la pluma estilográfica de caligrafía o rotuladores de punta plana.
57. **brush_basic_chisel_45**: Línea oblicua que ayuda en el rotulado simétrico de tipografías pixeladas de 8 bits.
58. **brush_basic_dual_dot**: Dos píxeles separados por un espacio vacío de un píxel, útil para líneas discontinuas de mapa.
59. **brush_basic_star_cross**: Forma de estrella de 5 píxeles ideal para trazar brillos mágicos rápidos en sprites de fondo.
60. **brush_basic_fine_spray**: Spray de baja dispersión para efectos de arena y polvo sin control de capas complejas.

### 2.2 Texturizers & Dither Brushes (15 Recursos)
61. **brush_dither_bayer_10**: Mascarilla Bayer de bajísima densidad (10%) para efectos sutiles de polvo de hadas.
62. **brush_dither_bayer_25**: Mascarilla Bayer de baja densidad (25%) para dar ligeras luces de volumen en los bordes.
63. **brush_dither_bayer_50**: Tablero de ajedrez clásico de 50% para fusiones medias de color y transiciones de volumen de esferas.
64. **brush_dither_bayer_75**: Mascarilla Bayer de alta densidad (75%) para transiciones sombreadas hacia zonas oscuras.
65. **brush_dither_cluster**: Agrupaciones de 2x2 píxeles con huecos intermedios para texturizar rocas rugosas y hormigón de sillería.
66. **brush_dither_noise**: Dispersión aleatoria estocástica de píxeles individuales (Scatter Noise) para efectos de tierra suelta.
67. **brush_dither_horizontal_hatch**: Aplica líneas horizontales alternas de un píxel simulando refracción de agua.
68. **brush_dither_vertical_hatch**: Aplica líneas verticales alternas ideales para simular lluvia o caída de agua distante.
69. **brush_dither_crosshatch_fine**: Micro-grabado cruzado para texturas rústicas de madera vieja o sacos de lona medievales.
70. **brush_dither_hex_shell**: Sella una textura de panal hexagonal, ideal para barreras cibernéticas o trajes espaciales.
71. **brush_dither_brick_pattern**: Pincel estampa que traza juntas de mortero de ladrillo con un solo movimiento continuo.
72. **brush_dither_weaving**: Sombreado textil entrelazado para alfombras, mantas y capas de lana de personajes.
73. **brush_dither_diagonal_shading**: Líneas oblicuas repetitivas que simulan el brillo de cristales templados inclinados.
74. **brush_dither_grunge**: Dispersión asimétrica de píxeles sueltos para manchas de barro y desgaste por suciedad ambiental.
75. **brush_dither_halftone**: Sombreado de semitono retro que imita la impresión tipográfica clásica de cómics vintage.

### 2.3 Organic & Material Shaders (15 Recursos)
76. **brush_organic_grass**: Pincel dinámico que genera briznas de césped hacia arriba de forma asimétrica y fluida.
77. **brush_organic_leaves**: Rellena áreas aplicando una silueta de hojas sueltas para árboles, lianas y matorrales espesos.
78. **brush_organic_fur**: Pincel direccional que genera texturas lineales cortas ideales para pelaje de animales y ropajes.
79. **brush_organic_hair**: Facilita el dibujado de mechones de cabello ondulado con sombreado de contorno unificado automático.
80. **brush_organic_bark**: Trazador vertical de rugosidad orgánica para simular la corteza de troncos de árboles antiguos.
81. **brush_organic_moss**: Genera manchas redondeadas de musgo esponjoso sobre superficies de piedra o ladrillo.
82. **brush_material_rock**: Estampa micro-grietas e imperfecciones porosas en superficies de roca o granito labrado.
83. **brush_material_metal**: Pincel de brillo lineal horizontal para reflejos de luz pulida en armaduras y metales.
84. **brush_material_smoke**: Aplica círculos concéntricos de baja opacidad y dither suave para pintar nubes de humo.
85. **brush_material_cloud**: Genera siluetas esponjosas compuestas por arcos de píxeles perfectos para el cielo diurno.
86. **brush_material_water**: Genera patrones lineales ondulados para superficies fluidas de lagos, mares o ríos.
87. **brush_material_sand**: Distribuye píxeles aislados de forma homogénea emulando la textura porosa de dunas desérticas.
88. **brush_material_cracks**: Estampa ramificada que simula la fractura física de cristales, porcelana o muros dañados.
89. **brush_material_cobblestone**: Sella bloques redondeados e irregulares de piedra para calzadas y caminos rurales.
90. **brush_material_wood_veins**: Genera vetas concéntricas fluidas que imitan el interior de troncos talados de madera noble.

---

## 📐 Categoría 3. Plantillas de Rejilla de Proyecto (50 Recursos)
*   **Identificador de Grupo**: `template_*`
*   **Finalidad**: Ajustar el lienzo del canvas y las cuadrículas de seguridad con las dimensiones idóneas según el destino final del asset.

### 3.1 Basic & UI Icons Templates (12 Recursos)
91. **template_icon_16x16**: Tamaño estándar clásico para consumibles, proyectiles, runas mágicas y cursores del ratón.
92. **template_icon_32x32**: Diseñado para armas detalladas (espadas, escudos, báculos) e iconos complejos de inventario.
93. **template_icon_64x64**: Adecuado para ilustraciones de trofeos de alta resolución, logos de logros y emblemas.
94. **template_portrait_32x32**: Retratos de personajes ultracompactos estilo NES para diálogos de texto simplificados.
95. **template_portrait_64x64**: Formato estándar de retratos JRPG para diálogos de personajes detallados con gesticulación facial.
96. **template_portrait_128x128**: Lienzo para perfiles de personaje de alta definición en novelas visuales o interfaces modernas.
97. **template_ui_frame_8x8**: Plantilla modular para baldosas de interfaz estirable de 3 bits con rejillas interiores estrictas.
98. **template_ui_frame_16x16**: Plantilla de marco de ventana modular estándar para el sistema 9-slice.
99. **template_hud_bar_128x16**: Canvas apaisado optimizado para el diseño de barras de carga, salud o experiencia de juego.
100. **template_hud_container_32x32**: Espacio simétrico para casillas fijas de HUD (ej. contenedor de magia, brújula, reloj).
101. **template_ui_cursor_16x16**: Área delimitada para punteros personalizados con guías para centrar el píxel activo (pivote).
102. **template_ui_tooltip_48x16**: Lienzo óptimo para pequeñas burbujas flotantes de ayuda o menús emergentes del ratón.

### 3.2 Game Engines Integration (18 Recursos)
103. **template_engine_godot_16**: Canvas optimizado para los Tilemaps nativos de Godot con margen de separación de 1 píxel.
104. **template_engine_godot_32**: Tilemap de Godot de resolución media para texturas de terreno complejas.
105. **template_engine_unity_16**: Diseñado para sprites de Unity con configuración de 16 píxeles por unidad (Pixels Per Unit).
106. **template_engine_unity_32**: Sprites de Unity optimizados para un renderizado escalado limpio en el motor.
107. **template_engine_unity_64**: Alta definición para sprites individuales en Unity, preservando la proporción ortográfica de cámara.
108. **template_engine_gamemaker_16**: Hoja de sprites modular con espaciado regular de 16x16 adaptada para GameMaker Studio.
109. **template_engine_gamemaker_32**: Spritesheet de GameMaker de 32x32 con puntos de origen de sprite de precisión centrados por guías.
110. **template_engine_rpgmaker_mv_48**: Formato de autotiling de 48x48 píxeles por celda para RPG Maker MV.
111. **template_engine_rpgmaker_mz_48**: Formato adaptado de 48x48 píxeles con guías de capas de colisión de RPG Maker MZ.
112. **template_engine_rpgmaker_vx_32**: Formato clásico de 32x32 píxeles por baldosa utilizado por RPG Maker VX Ace.
113. **template_engine_defold_16**: Estructura de atlas de sprites optimizada para el motor Defold con rejillas sin desborde.
114. **template_engine_unreal_paper2d_32**: Hoja de sprites preparada para el sistema Paper2D de Unreal Engine.
115. **template_engine_phaser_16**: Hoja de sprites en formato JSON hash compatible con el motor Phaser JS para HTML5.
116. **template_engine_phaser_32**: Spritesheet de Phaser con márgenes simétricos para evitar el "bleeding" de píxeles en renderizadores WebGL.
117. **template_engine_love2d_16**: Estructura Quad optimizada para LÖVE2D, con guías de corte en arrays ordenados de coordenadas.
118. **template_engine_solar2d_32**: Canvas estructurado para Corona/Solar2D con optimización de hojas de sprites en arrays de frames.
119. **template_engine_gdevelop_16**: Lienzo modular idóneo para la inserción en el sistema de baldosas de GDevelop.
120. **template_engine_cocos2d_32**: Spritesheet para Cocos2d-x con mapeado simétrico optimizado para aceleración de GPU.

### 3.3 Game Genres & Formats (20 Recursos)
121. **template_genre_jrpg_battle_snes**: Relación de aspecto clásica de 256x224 píxeles para fondos y sprites de combate JRPG de SNES.
122. **template_genre_platformer_level**: Lienzo panorámico de 320x180 con guías de suelo firme predefinidas para niveles scroll.
123. **template_genre_metroidvania_room**: Guías modulares de 160x144, adaptadas para salas interconectadas estilo GameBoy clásica.
124. **template_genre_isometric_2to1**: Rejilla de perspectiva isométrica con ratio angular exacto de 2:1 (26.56°) para evitar jaggies.
125. **template_genre_isometric_dimetric**: Rejilla isométrica dimétrica con inclinaciones reguladas para vistas estratégicas clásicas.
126. **template_genre_visual_novel_bg**: Lienzo de 640x360 optimizado para ilustraciones de fondo escénicas con guías de tercios.
127. **template_genre_fighting_stage**: Lienzo extra ancho (512x256) con marcas de suelo y límites de cámara para combates 2D.
128. **template_genre_beatemup_3d**: Perspectiva con inclinación de suelo en profundidad (vista lateral en falso 3D) estilo arcade clásica.
129. **template_genre_topdown_zelda_16**: Rejillas de 16x16 para juegos de rol cenitales estilo The Legend of Zelda: A Link to the Past.
130. **template_genre_rts_isometric_64**: Baldosa isométrica de 64x32 píxeles optimizada para diseño de terrenos de juegos de estrategia.
131. **template_genre_shootemup_horizontal**: Lienzo de 320x240 adaptado para shooters de scroll horizontal (tipo Gradius).
132. **template_genre_shootemup_vertical**: Lienzo vertical de 240x320 con guías de entrada lateral de enemigos para shooters verticales.
133. **template_genre_adventure_lucasarts**: Formato de 320x200 con relación de aspecto estirada, ideal para aventuras gráficas de SCUMM.
134. **template_genre_virtual_pet_lcd**: Lienzo ultra-bajo de 32x32 con filtro monocromo pixelado imitando un Tamagotchi de 1996.
135. **template_genre_puzzle_tetris**: Cuadrícula de 10x20 celdas verticales para juegos de encaje de bloques o Tetris.
136. **template_genre_stealth_topdown**: Guías de cono de visión y sigilo en escenarios de vista aérea de 256x256.
137. **template_genre_roguelike_ascii**: Rejilla de caracteres de 8x12 para sprites de tipografía de juegos de mazmorras ASCII.
138. **template_genre_pinball_table**: Estructura alargada verticalmente con guías de rebote y flippers de física precalculada.
139. **template_genre_sports_soccer**: Terreno de juego inclinado en vista isométrica con guías para diseño de césped y porterías.
140. **template_genre_card_game**: Lienzo vertical para diseño de naipes y cartas pixeladas coleccionables (ej. 64x88 píxeles).

---

## 🏁 Categoría 4. Patrones de Tramado y Texturas Seamless (60 Recursos)
*   **Identificador de Grupo**: `pattern_*`
*   **Finalidad**: Simular variaciones de luminosidad y sombras sin expandir la paleta cromática activa de un sprite.

### 4.1 Mathematical Ordered Dithering (20 Recursos)
141. **pattern_dither_bayer_2x2**: Tablero de ajedrez básico de 2x2 con alternancia regular de 50% de densidad.
142. **pattern_dither_bayer_4x4_25**: Matriz Bayer de 4x4 píxeles que reparte un degradado sutil de 25% de luz.
143. **pattern_dither_bayer_4x4_50**: Matriz Bayer de 4x4 enlazable de 50% para transiciones homogéneas.
144. **pattern_dither_bayer_4x4_75**: Matriz Bayer de 4x4 que bloquea un 75% de la luz para zonas oscuras.
145. **pattern_dither_bayer_8x8**: Degradado matemático avanzado de 8 niveles de luz para degradados en lienzos de alta definición.
146. **pattern_dither_noise_stochastic**: Dispersión pseudo-aleatoria de píxeles que elimina las líneas de patrón repetitivas.
147. **pattern_dither_noise_blue**: Ruido azul de alta dispersión para sombreados suaves y granos orgánicos.
148. **pattern_dither_noise_white**: Ruido blanco estocástico para simular nieve de televisión analógica.
149. **pattern_dither_ordered_halftone**: Patrón de semitono que agrupa píxeles en círculos crecientes según la luz.
150. **pattern_dither_interlaced**: Alternancia horizontal de líneas finas de 1 píxel para simular reflejos de agua o CRT.
151. **pattern_dither_checkerboard_large**: Cuadrícula de ajedrez gigante de 8x8 píxeles para texturizar tableros.
152. **pattern_dither_diamond_hatch**: Reducción de puntos en patrón de diamante inclinado a 45 grados de gran elegancia.
153. **pattern_dither_vertical_stripes**: Líneas verticales de un píxel de grosor espaciadas por huecos de un píxel.
154. **pattern_dither_horizontal_stripes**: Líneas horizontales de un píxel de grosor, excelentes para texturas de brillo en metal.
155. **pattern_dither_diagonal_stripes_left**: Líneas inclinadas hacia la izquierda de 45 grados para simular cristales mojados.
156. **pattern_dither_diagonal_stripes_right**: Líneas inclinadas hacia la derecha de 45 grados de gran dinamismo.
157. **pattern_dither_crosshatch_coarse**: Tramado grueso cruzado de 4x4 píxeles para telas medievales rústicas.
158. **pattern_dither_crosshatch_dense**: Tramado cruzado denso que emula el sombreado a pluma tradicional de ilustraciones.
159. **pattern_dither_spiral**: Patrón de dither circular en espiral para portales mágicos u orbes mágicos.
160. **pattern_dither_checker_dither**: Híbrido de ajedrez y Bayer de alta densidad para sombreados de rocas esculpidas.

### 4.2 Industrial & Structural Patterns (40 Recursos)
161. **pattern_struct_brick_classic**: Ladrillos entrelazados con juntas de 1px de color gris para paredes estándar.
162. **pattern_struct_brick_gothic**: Ladrillos estrechos y alargados típicos de construcciones medievales o templos oscuros.
163. **pattern_struct_cobblestone**: Piedras redondeadas asimétricas para caminos de aldeas y plazas medievales.
164. **pattern_struct_wood_grain**: Líneas concéntricas fluidas que imitan de forma perfecta las vetas de la madera noble.
165. **pattern_struct_wood_plank_v**: Listones de madera verticales para vallas y barcos de piratas.
166. **pattern_struct_wood_plank_h**: Listones de madera horizontales para suelos de tabernas y techos de cabañas.
167. **pattern_struct_metal_plate_smooth**: Planchas de acero unificadas con tornillos de fijación en las 4 esquinas de un píxel.
168. **pattern_struct_metal_plate_rusted**: Planchas metálicas con manchas de corrosión y óxido de cobre.
169. **pattern_struct_carbon_fiber**: Patrón diagonal entrelazado que imita la textura brillante de la fibra de carbono futurista.
170. **pattern_struct_chainlink_fence**: Malla de alambre cruzado transparente de 1 píxel, ideal para cercas industriales.
171. **pattern_struct_ventilation_grille**: Rejilla de ventilación metálica con sombreado de profundidad interior negro.
172. **pattern_struct_honeycomb_energy**: Celdas hexagonales futuristas de cian brillante para escudos de energía o campos de fuerza.
173. **pattern_struct_tiles_bathroom**: Baldosas cuadradas blancas y limpias con juntas de 1px azul celeste de baño.
174. **pattern_struct_tiles_terracotta**: Baldosas de arcilla cuadradas de color rojo terracota para suelos rústicos.
175. **pattern_struct_fabric_canvas**: Textura de lona gruesa cruzada para sacos de trigo y tiendas de campaña militar.
176. **pattern_struct_fabric_tartan**: Patrón de tartán escocés con alternancia de líneas rojas, verdes y amarillas.
177. **pattern_struct_fabric_denim**: Textura diagonal fina de color azul vaquero con sutil desgaste en los bordes de píxel.
178. **pattern_struct_stone_wall_rough**: Piedras irregulares apiladas sin argamasa para muros rústicos de fincas de campo.
179. **pattern_struct_stone_wall_marble**: Bloques pulidos con vetas grises que imitan el mármol de templos griegos.
180. **pattern_struct_scales_reptile**: Escamas superpuestas alineadas, ideales para lomos de dragones y serpientes monstruosas.
181. **pattern_struct_scales_fish**: Escamas de refracción marina para peces de colores brillantes de río o mar.
182. **pattern_struct_circuit_board**: Pistas de cobre y conectores de un píxel simulando una placa base de circuito integrado.
183. **pattern_struct_roof_shingles_clay**: Tejas de arcilla semicirculares superpuestas para tejados de aldeas mediterráneas.
184. **pattern_struct_roof_shingles_slate**: Tejas de pizarra rectangulares planas de color gris oscuro para castillos norteños.
185. **pattern_struct_cyber_grid**: Líneas de neón magenta sobre fondo negro puro de realidad virtual clásica de los 80.
186. **pattern_struct_cracked_soil**: Suelo desértico arcilloso fracturado por el calor extremo del sol.
187. **pattern_struct_bark_pine**: Corteza rugosa y escamosa típica de los troncos de pinos de bosques templados.
188. **pattern_struct_bark_birch**: Corteza lisa y blanca con manchas negras horizontales de tronco de abedul de zonas heladas.
189. **pattern_struct_glass_block**: Bloques de vidrio de baño que distorsionan la luz interior de forma pixelada.
190. **pattern_struct_water_ripples**: Ondulaciones concéntricas de agua azul suave, idóneas para fondos de estanques en calma.
191. **pattern_struct_sand_dunes_h**: Líneas de arena onduladas por el viento en dirección horizontal.
192. **pattern_struct_sand_dunes_v**: Líneas de arena onduladas por el viento en dirección vertical.
193. **pattern_struct_ice_crystals**: Cristales de hielo y copos geométricos de un píxel sobre fondo azul helado.
194. **pattern_struct_leather_texture**: Textura arrugada y porosa que imita el cuero marrón de botas y cinturones.
195. **pattern_struct_bamboo_wall**: Cañas de bambú unidas verticalmente para paredes orientales de dojos.
196. **pattern_struct_tatami_mat**: Esterilla de tatami de paja tejida típica de interiores de casas japonesas tradicionales.
197. **pattern_struct_lava_veins**: Suelo volcánico oscuro con venas incandescentes de lava líquida de color naranja y rojo.
198. **pattern_struct_alien_hush**: Colmena orgánica extraterrestre con capullos y venas de quitina purpúrea parpadeante.
199. **pattern_struct_industrial_grate**: Rejilla de acero industrial antideslizante con perforaciones de 1px.
200. **pattern_struct_space_hull**: Placas de casco de nave espacial de titanio gris con remaches simétricos alineados.

---

## 📈 Categoría 5. Rampas de Color y Sombreados Hue Shifting (80 Recursos)
*   **Identificador de Grupo**: `gradient_*`
*   **Finalidad**: Proporcionar secuencias de color precalculadas que desplazan el matiz cromático (Hue Shifting) según la exposición solar de la luz.

### 5.1 Real World & Physical Materials (40 Recursos)
201. **gradient_metal_imperial_gold**: Marrón cobre -> Marrón ocre -> Amarillo oro -> Marfil pálido brillante.
202. **gradient_metal_cold_steel**: Azul marino oscuro -> Gris azulado -> Gris acero -> Blanco brillante.
203. **gradient_metal_corroded_bronze**: Marrón rojizo oscuro -> Marrón latón -> Verde pátina -> Amarillo limón.
204. **gradient_metal_brushed_copper**: Marrón terracota oscuro -> Rojo cobrizo -> Naranja cálido -> Crema claro de luz.
205. **gradient_metal_rusted_iron**: Negro carbón -> Rojo óxido -> Naranja óxido seco -> Amarillo arcilla.
206. **gradient_material_skin_pale_pink**: Sombra siena -> Tono medio rosáceo -> Crema suave -> Blanco marfil.
207. **gradient_material_skin_olive_tanned**: Marrón oliva -> Tono medio mediterráneo -> Melocotón claro -> Crema de luz.
208. **gradient_material_skin_deep_dark**: Negro ébano -> Marrón chocolate profundo -> Siena cálido -> Ocre pálido.
209. **gradient_material_skin_fantasy_orc**: Verde bosque profundo -> Verde oliva -> Verde lima -> Amarillo pastel.
210. **gradient_material_skin_fantasy_elf**: Violeta nocturno -> Lila pálido -> Rosa lavanda -> Blanco escarcha.
211. **gradient_material_wood_mahogany**: Marrón caoba casi negro -> Marrón rojizo -> Terracota cálido -> Crema.
212. **gradient_material_wood_oak**: Marrón roble profundo -> Marrón cálido -> Amarillo ocre -> Crema paja.
213. **gradient_material_wood_rotten**: Gris verdoso sucio -> Marrón verdoso -> Oliva claro -> Verde de hongo.
214. **gradient_material_fabric_indigo_denim**: Azul vaquero oscuro -> Azul cobalto -> Azul grisáceo -> Azul celeste.
215. **gradient_material_fabric_scarlet_silk**: Rojo carmín profundo -> Escarlata brillante -> Naranja brillante -> Rosa pálido.
216. **gradient_material_stone_slate**: Gris carbón -> Gris pizarra -> Gris azulado -> Blanco tiza.
217. **gradient_material_stone_mossy**: Gris oscuro -> Verde musgo profundo -> Verde oliva -> Verde lima brillante.
218. **gradient_material_stone_sandstone**: Marrón arcilla -> Terracota -> Ocre desértico -> Amarillo arena claro.
219. **gradient_material_crystal_emerald**: Verde esmeralda profundo -> Verde kelly -> Verde menta -> Blanco cromo.
220. **gradient_material_crystal_ruby**: Rojo rubí oscuro -> Carmín -> Magenta brillante -> Rosa pálido de reflejo.
221. **gradient_material_crystal_sapphire**: Azul zafiro profundo -> Azul real -> Azul cian eléctrico -> Blanco hielo.
222. **gradient_material_crystal_amethyst**: Violeta oscuro -> Morado -> Amatista brillante -> Lavanda pálido.
223. **gradient_material_glass_clear**: Verde botella translúcido -> Azul celeste -> Blanco tiza de reflejo angular.
224. **gradient_material_water_tropical**: Azul marino -> Turquesa profundo -> Turquesa brillante -> Blanco espuma marina.
225. **gradient_material_water_deep**: Azul abisal -> Azul cobalto -> Azul cian -> Azul hielo de refracción.
226. **gradient_material_lava_magma**: Negro volcánico -> Rojo sangre -> Naranja brillante -> Amarillo sol -> Blanco incandescente.
227. **gradient_material_coal_soot**: Negro absoluto -> Gris grafito -> Gris humo -> Gris claro de ceniza.
228. **gradient_material_paper_scroll**: Marrón cuero seco -> Siena envejecido -> Marfil pergamino -> Crema de luz.
229. **gradient_material_fruit_apple**: Verde oliva -> Rojo manzana -> Escarlata -> Amarillo sol de brillo cutáneo.
230. **gradient_material_leaf_autumn**: Marrón arcilla -> Naranja cálido -> Amarillo mostaza -> Crema de sol.
231. **gradient_material_ice_frozen**: Azul marino oscuro -> Azul hielo -> Cian ártico -> Blanco nieve puro.
232. **gradient_material_brick_clay**: Marrón terracota oscuro -> Rojo arcilla -> Naranja terracota -> Crema de sol.
233. **gradient_material_mud_swamp**: Marrón fango -> Marrón oliva -> Gris verdoso -> Verde de hongo.
234. **gradient_material_slime_radioactive**: Verde bosque oscuro -> Verde radiactivo -> Verde lima -> Amarillo azufre.
235. **gradient_material_cloud_cumulus**: Azul pizarra de sombra -> Gris nube -> Blanco nube -> Blanco brillante.
236. **gradient_material_bone_skull**: Gris oscuro -> Marrón siena seco -> Crema hueso -> Blanco tiza.
237. **gradient_material_feather_peacock**: Azul real profundo -> Verde esmeralda -> Amarillo limón -> Blanco plata.
238. **gradient_material_pearl_nacre**: Violeta lavanda -> Rosa pálido -> Amarillo crema suave -> Blanco perla brillante.
239. **gradient_material_plasma_energy**: Púrpura profundo -> Rosa neón -> Magenta brillante -> Blanco cian de luz.
240. **gradient_material_nebula_gas**: Azul cósmico -> Púrpura cósmico -> Rosa neón -> Amarillo estelar de brillo.

### 5.2 Climatic & Atmospheric Shaders (40 Recursos)
241. **gradient_climate_sky_dawn**: Violeta de medianoche -> Magenta -> Naranja amanecer -> Amarillo sol pálido.
242. **gradient_climate_sky_day**: Azul cobalto brillante -> Azul celeste -> Azul turquesa claro -> Crema del horizonte.
243. **gradient_climate_sky_sunset**: Púrpura noche -> Escarlata -> Naranja de fuego -> Amarillo sol del ocaso.
244. **gradient_climate_sky_night**: Negro cosmos -> Azul abisal -> Azul cobalto de luna -> Celeste de estrella.
245. **gradient_climate_foggy_morning**: Gris azulado frío -> Gris pizarra -> Gris niebla claro -> Crema suave.
246. **gradient_climate_sandstorm**: Marrón arcilla seco -> Ocre desértico -> Amarillo mostaza -> Amarillo arena.
247. **gradient_climate_toxic_haze**: Gris verdoso de alquitrán -> Verde pantano -> Verde lima -> Amarillo ácido.
248. **gradient_climate_polar_aurora**: Azul abisal -> Púrpura oscuro -> Verde aurora fluorescente -> Blanco de luz.
249. **gradient_climate_underwater_murky**: Verde botella oscuro -> Verde turquesa -> Verde oliva claro -> Amarillo turquesa.
250. **gradient_climate_space_void**: Negro profundo -> Azul abisal -> Púrpura de nebulosa -> Rosa neón.
251. **gradient_climate_rainy_day**: Azul pizarra -> Gris azulado -> Gris nube -> Gris perla de luz.
252. **gradient_climate_forest_canopy**: Verde pino oscuro -> Verde bosque -> Verde brillante de hojas -> Amarillo sol de sol filtrado.
253. **gradient_climate_cyberpunk_neon**: Violeta nocturno -> Rosa magenta neón -> Azul cian neón -> Blanco neón.
254. **gradient_climate_vintage_sepia**: Marrón sepia oscuro -> Siena cálido -> Marfil envejecido -> Blanco marfil.
255. **gradient_climate_retro_pastel**: Azul turquesa pastel -> Rosa pastel -> Amarillo pastel -> Blanco cremoso.
256. **gradient_climate_industrial_smog**: Gris carbón sujo -> Gris humo -> Amarillo azufre -> Blanco cremoso.
257. **gradient_climate_mystic_swamp**: Morado berenjena oscuro -> Gris verdoso -> Verde musgo -> Verde oliva brillante.
258. **gradient_climate_volcanic_glow**: Negro basalto -> Rojo magma caliente -> Naranja ígneo -> Amarillo incandescente.
259. **gradient_climate_deep_cave**: Azul marino profundo -> Gris pizarra -> Verde liquen -> Crema de piedra.
260. **gradient_climate_winter_breeze**: Gris azulado ártico -> Azul escarcha -> Celeste translúcido -> Blanco nieve.
261. **gradient_climate_desert_noon**: Terracota oscuro -> Siena cálido -> Amarillo ocre -> Crema sol de mediodía.
262. **gradient_climate_jungle_night**: Violeta profundo -> Verde oliva oscuro -> Verde kelly -> Amarillo verde de luciérnaga.
263. **gradient_climate_steampunk_brass**: Marrón engranaje -> Bronce rojizo -> Amarillo latón -> Blanco de luz.
264. **gradient_climate_monochrome_cool**: Azul pizarra oscuro -> Gris azulado -> Gris claro -> Blanco escarcha.
265. **gradient_climate_monochrome_warm**: Marrón rojizo oscuro -> Siena -> Crema -> Blanco marfil.
266. **gradient_climate_abyssal_glow**: Negro abisal -> Azul marino -> Azul cian -> Verde menta de refracción.
267. **gradient_climate_fairy_woods**: Rosa purpúreo -> Lavanda -> Verde lima brillante -> Crema suave de sol.
268. **gradient_climate_alien_sunset**: Azul cobalto profundo -> Magenta brillante -> Naranja neón -> Amarillo sol de alien.
269. **gradient_climate_acid_rain**: Gris verdoso ácido -> Verde lima -> Amarillo azufre -> Blanco brillante de luz.
270. **gradient_climate_ruins_moss**: Gris pizarra -> Verde oliva oscuro -> Verde musgo -> Amarillo oliva brillante.
271. **gradient_climate_overcast**: Azul pizarra oscuro -> Gris oscuro -> Gris perla -> Blanco ceniza.
272. **gradient_climate_sahara_heat**: Siena oscuro -> Terracota -> Naranja caliente -> Amarillo sol radiante.
273. **gradient_climate_deep_ocean_sun**: Azul marino abisal -> Azul turquesa -> Azul celeste -> Blanco de luz.
274. **gradient_climate_sakura_petals**: Púrpura sutil -> Rosa ciruela -> Rosa suave sakura -> Blanco marfil.
275. **gradient_climate_boreal_forest**: Azul marino de pino -> Verde oliva -> Gris liquen -> Blanco escarcha de nieve.
276. **gradient_climate_toxic_waste_leak**: Negro carbón -> Verde radiactivo -> Amarillo azufre -> Blanco brillante de luz.
277. **gradient_climate_copper_mine**: Marrón cobre oscuro -> Naranja cobrizo -> Verde de pátina oxidada -> Crema de luz.
278. **gradient_climate_cosmic_radiation**: Azul cobalto -> Violeta galáctico -> Rosa neón -> Blanco brillante.
279. **gradient_climate_royal_palace**: Azul real -> Rojo terciopelo -> Dorado imperial -> Crema suave de luz.
280. **gradient_climate_limbo**: Negro profundo -> Gris carbón oscuro -> Gris niebla -> Gris claro translúcido.

---

## 🏃 Categoría 6. Plantillas Guía de Animación (60 Recursos)
*   **Identificador de Grupo**: `animation_*`
*   **Finalidad**: Brindar esqueletos de poses de referencia en formato transparente (Wireframes) para acelerar el proceso de dibujado fotograma a fotograma de movimientos físicos y de fluidos.

### 6.1 Locomoción & Movimiento Básico (30 Recursos)
281. **animation_loco_idle_biped_6f**: Movimiento de respiración cíclica de personaje bípedo estándar (6 fotogramas).
282. **animation_loco_walk_biped_8f**: Ciclo de andar bípedo completo con poses de contacto y amortiguación de impacto (8 frames).
283. **animation_loco_run_biped_8f**: Ciclo de carrera dinámica de alta velocidad con fotogramas de suspensión aérea (8 frames).
284. **animation_loco_jump_biped_4f**: Salto de tres fases: crouch de empuje, ascenso de arco y caída vertical (4 frames).
285. **animation_loco_fall_biped_3f**: Ciclo de caída por gravedad con balanceo de pelo y ropa hacia arriba (3 frames).
286. **animation_loco_climb_ladder_6f**: Animación de subida de espaldas por escalera de mano con balanceo de caderas (6 frames).
287. **animation_loco_swim_biped_8f**: Ciclo de nado en agua con braceo de braza y batido de piernas (8 frames).
288. **animation_loco_fly_wings_4f**: Vuelo dinámico con batido de alas extendidas arriba y abajo (4 frames).
289. **animation_loco_rolling_dodge_6f**: Voltereta evasiva de 360 grados sobre el suelo de combate (6 frames).
290. **animation_loco_dash_speed_4f**: Impulso horizontal de alta velocidad con siluetas de distorsión de movimiento (4 frames).
291. **animation_loco_idle_quadruped_6f**: Respiración y reposo de criatura cuadrúpeda (perro, lobo) de perfil (6 frames).
292. **animation_loco_walk_quadruped_8f**: Ciclo de marcha cuadrúpeda con patas cruzadas estables (8 frames).
293. **animation_loco_run_quadruped_8f**: Galope cuadrúpedo con flexión completa de columna de criatura (8 frames).
294. **animation_loco_push_heavy_6f**: Fuerza de empuje de un personaje contra una caja o bloque de escenario (6 frames).
295. **animation_loco_pull_heavy_6f**: Acción de tirar de una cuerda u objeto con peso desplazado hacia atrás (6 frames).
296. **animation_loco_crawl_biped_8f**: Avance a gachas o cuerpo a tierra de soldado o explorador (8 frames).
297. **animation_loco_climb_ledge_6f**: Personaje agarrándose de un saliente de muro y trepando hacia arriba (6 frames).
298. **animation_loco_slide_slope_3f**: Deslizamiento por rampa inclinada con un pie adelante de forma fluida (3 frames).
299. **animation_loco_skate_loop_6f**: Desplazamiento sobre patines o tabla de skate con impulsos de pierna alternos (6 frames).
300. **animation_loco_ride_mount_6f**: Ciclo de cabalgadura sobre caballo u otra montura fantástica en carrera (6 frames).
301. **animation_loco_teleport_out_5f**: Animación de desaparición de personaje por desmaterialización lineal vertical (5 frames).
302. **animation_loco_teleport_in_5f**: Animación de aparición de personaje mediante orbe expansivo de energía (5 frames).
303. **animation_loco_float_ghost_6f**: Flotación espectral vertical oscilante de fantasma u orbe mágico (6 frames).
304. **animation_loco_sit_down_4f**: Acción de sentarse en silla o suelo y reposar (4 frames).
305. **animation_loco_get_up_4f**: Levantarse rápidamente de un asiento u estado de derribado (4 frames).
306. **animation_loco_carrying_idle_6f**: Respiración cargando un objeto pesado sobre los hombros (6 frames).
307. **animation_loco_carrying_walk_8f**: Ciclo de andar cargando un objeto o cofre de tesoro pesado (8 frames).
308. **animation_loco_swing_rope_6f**: Balanceo asido de una cuerda con inercia de arco de péndulo (6 frames).
309. **animation_loco_dig_ground_6f**: Acción de excavar tierra con una pala empleando fuerza de cadera (6 frames).
310. **animation_loco_salute_chest_4f**: Saludo formal de soldado con puño al pecho o mano a la frente (4 frames).

### 6.2 Combat & Action Frameworks (30 Recursos)
311. **animation_combat_melee_slash_4f**: Ataque de espada veloz con arco de tajo y extensión completa del brazo (4 frames).
312. **animation_combat_melee_thrust_4f**: Estocada frontal de lanza con torso inclinado y pies plantados (4 frames).
313. **animation_combat_melee_overhead_6f**: Tajo de hacha descendente desde la cabeza con arco de impacto de gran peso (6 frames).
314. **animation_combat_shoot_bow_6f**: Carga de arco, tensión de cuerda, disparo de flecha y retroceso de muñeca (6 frames).
315. **animation_combat_shoot_gun_3f**: Disparo de revólver con destello en la boca del cañón y retroceso de hombro (3 frames).
316. **animation_combat_shoot_rifle_4f**: Ráfaga de ametralladora pesada con vibración continua del torso del soldado (4 frames).
317. **animation_combat_cast_magic_6f**: Invocación de orbe mágico con brazos levantados de mago y destellos flotantes (6 frames).
318. **animation_combat_block_shield_3f**: Acción defensiva de levantar escudo bloqueando proyectiles con retroceso (3 frames).
319. **animation_combat_take_damage_3f**: Deformación lateral rápida del cuerpo, cabeza atrás por impacto y temblor (3 frames).
320. **animation_combat_death_fall_6f**: Caída hacia atrás de rodillas, golpe contra el suelo y reposo inmóvil (6 frames).
321. **animation_combat_death_dissolve_8f**: Desintegración del cuerpo pixelado de arriba a abajo aplicando dither de ceniza (8 frames).
322. **animation_combat_heavy_punch_5f**: Gancho de boxeo de gran alcance con giro completo del hombro del luchador (5 frames).
323. **animation_combat_roundhouse_kick_6f**: Patada giratoria lateral de artes marciales de gran extensión (6 frames).
324. **animation_combat_dodge_back_3f**: Retirada evasiva rápida de un paso atrás sin perder la pose de combate (3 frames).
325. **animation_combat_taunt_animation_6f**: Provocación de burla del héroe saludando con el brazo o gesticulando (6 frames).
326. **animation_combat_drink_potion_4f**: Acción de sacar frasco, beber líquido de maná y arrojar envase vacío (4 frames).
327. **animation_combat_draw_weapon_3f**: Desenfundar espada de la vaina del cinturón de forma ágil (3 frames).
328. **animation_combat_sheathe_weapon_3f**: Guardar el arma larga en la vaina de la espalda o hombro tras la victoria (3 frames).
329. **animation_combat_parry_strike_4f**: Desvío de ataque espada contra espada con destello de chispas simétrico (4 frames).
330. **animation_combat_throw_bomb_5f**: Lanzamiento de granada o consumible en parábola con inercia de brazo (5 frames).
331. **animation_combat_heal_self_5f**: Animación de recuperación con luz de energía verde envolviendo al personaje (5 frames).
332. **animation_combat_spell_meteor_8f**: Invocación cósmica con orbe cayendo del cielo e impacto expansivo en suelo (8 frames).
333. **animation_combat_awaken_power_6f**: Explosión de aura de energía ascendente alrededor del luchador (6 frames).
334. **animation_combat_aim_gun_3f**: Apuntar arma de fuego corta en dirección horizontal de forma firme (3 frames).
335. **animation_combat_stunned_loop_4f**: Ciclo de aturdimiento de personaje mareado con estrellas girando en su cabeza (4 frames).
336. **animation_combat_dash_attack_5f**: Embestida frontal veloz terminando con tajo de sable de precisión (5 frames).
337. **animation_combat_slide_kick_5f**: Patada deslizante baja por el suelo para derribo de enemigos en plataformas (5 frames).
338. **animation_combat_combo_dual_8f**: Secuencia de combate rápido de doble daga alternando izquierda y derecha (8 frames).
339. **animation_combat_reload_gun_5f**: Sacar cargador vacío, insertar uno nuevo y amartillar arma de fuego (5 frames).
340. **animation_combat_victory_jump_5f**: Salto alegre de celebración alzando puño y espada al final del nivel (5 frames).

---

## 🗺️ Categoría 7. Conjuntos de Terreno y Autotiling (60 Recursos)
*   **Identificador de Grupo**: `tileset_*`
*   **Finalidad**: Proporcionar conjuntos de baldosas que encajan perfectamente (autotile rules) para diseñar niveles completos sobre una rejilla de juego.

### 7.1 Natural Biomes (30 Recursos)
341. **tileset_biome_forest_grass**: Hierba musgosa superior, raíces nudosas laterales y tierra vegetal de relleno con 16-slice.
342. **tileset_biome_desert_dunes**: Dunas de arena suave ondulada por el viento, fósiles de un píxel y cactus decorativos.
343. **tileset_biome_snow_peaks**: Plataformas cubiertas con mantos de nieve esponjosa y carámbanos translúcidos de techo.
344. **tileset_biome_swamp_mud**: Ciénaga lodosa verde oliva, aguas tóxicas, raíces podridas y setas bioluminiscentes.
345. **tileset_biome_volcanic_basalt**: Bloques de basalto agrietado con venas ígneas de lava fluida naranja brillante.
346. **tileset_biome_coral_reef**: Arena de coral rosa, arrecifes de esponjas de colores, algas ondulantes y conchas de mar.
347. **tileset_biome_tundra_frost**: Tierra congelada con capas de liquen gris y hierba escarchada de alta visibilidad.
348. **tileset_biome_jungle_canopy**: Follaje verde denso, lianas colgantes, flores exóticas y madera tropical húmeda.
349. **tileset_biome_autumn_woods**: Suelo cubierto de hojas cobrizas secas, setas de bosque y troncos de abedul de siena.
350. **tileset_biome_crystal_cavern**: Piedra de cueva oscura con incrustaciones de gemas fluorescentes turquesas de 1px.
351. **tileset_biome_deep_ocean_floor**: Rocas marinas cubiertas de algas abisales, burbujas y arena gris de fosa abisal.
352. **tileset_biome_sky_island**: Nubes firmes flotantes que actúan como suelo esponjoso blanco y cascadas de agua pura.
353. **tileset_biome_toxic_wasteland**: Tierra muerta estéril de color gris plomo con charcos de lodo ácido verde fluorescente.
354. **tileset_biome_dead_desert**: Suelo de huesos secos molidos, dunas de ceniza gris y rocas volcánicas afiladas.
355. **tileset_biome_mystic_grove**: Césped mágico lavanda, flores de luz cian y raíces de árboles de cerezo místico.
356. **tileset_biome_alien_hatchery**: Suelo orgánico alienígena cubierto de venas purpúreas, capullos activos y quitina.
357. **tileset_biome_ice_glacier**: Bloques de hielo azul compactado con fracturas angulares y reflejos brillantes transparentes.
358. **tileset_biome_muddy_marsh**: Lodo arcilloso húmedo, juncos de un píxel de grosor, charcos marrones y piedras resbaladizas.
359. **tileset_biome_red_canyon**: Rocas sedimentarias de arenisca roja arcillosa, dunas naranjas y fósiles de dinosaurio.
360. **tileset_biome_petrified_forest**: Troncos de piedra fósil gris, tierra de ceniza y hojas cristalizadas de colores.
361. **tileset_biome_alpine_meadow**: Flores silvestres de montaña de colores, césped brillante y piedras de granito gris.
362. **tileset_biome_sulphur_spring**: Piedras amarillas de azufre, aguas termales humeantes y depósitos de sal cristalizada.
363. **tileset_biome_quicksand_pit**: Trampas de arena movediza con dither concéntrico de succión y rocas caídas.
364. **tileset_biome_mossy_ruins**: Ladrillos de sillar de templo antiguo cubiertos de capas de musgo húmedo verde oliva.
365. **tileset_biome_cliff_side**: Capas de roca verticales recortadas para acantilados con colgaduras de raíces y tierra suelta.
366. **tileset_biome_underground_river**: Orillas de grava subterránea, aguas oscuras en movimiento y estalactitas de techo goteando.
367. **tileset_biome_bamboo_forest**: Suelo de cañas de bambú caídas, brotes tiernos y piedras de río con pátina verde.
368. **tileset_biome_cloud_stairs**: Escalones de vapor condensado firme para niveles celestiales de plataformas flotantes.
369. **tileset_biome_fossil_quarry**: Capas de arenisca llenas de conchas marinas y huesos fosilizados visibles de 1 píxel.
370. **tileset_biome_rainbow_valley**: Hierba de colores pastel de fantasía, flores de cristal y cascadas de agua destellante.

### 7.2 Architectural & Themed Sets (30 Recursos)
371. **tileset_theme_castle_wall**: Ladrillos de sillería de piedra gris con arcos de medio punto, almenas y antorchas.
372. **tileset_theme_dungeon_jail**: Bloques de piedra húmeda agrietada, rejas de hierro de un píxel oxidado y cadenas.
373. **tileset_theme_gothic_cathedral**: Ventanas de arco apuntado con vitrales de colores, gárgolas e incrustaciones doradas.
374. **tileset_theme_temple_marble**: Columnas jónicas de mármol blanco pulido con vetas grises y suelos geométricos.
375. **tileset_theme_ruins_pillars**: Columnas derrumbadas rotas, escombros de piedra y enredaderas silvestres de escalada.
376. **tileset_theme_cyberpunk_neon**: Asfalto mojado con reflejos magenta de carteles de neón, cables colgados y rejillas.
377. **tileset_theme_steampunk_gears**: Suelos de rejillas de bronce, engranajes gigantes de latón de fondo y escapes de vapor.
378. **tileset_theme_scifi_corridor**: Paredes metálicas de titanio modular, puertas corredizas de seguridad y paneles LED.
379. **tileset_theme_industrial_factory**: Vigas de acero oxidadas naranjas, barriles de residuo verde y cintas transportadoras.
380. **tileset_theme_space_station**: Compuertas de esclusa de aire de metal blanco, placas solares en ventanas y fondo cósmico.
381. **tileset_theme_egyptian_tomb**: Ladrillos de arenisca amarilla de pirámide, jeroglíficos tallados y vasijas de barro.
382. **tileset_theme_pirate_ship**: Madera de roble de cubierta de barco, cuerdas de un píxel, cañones de hierro y escotillas.
383. **tileset_theme_sewer_pipes**: Tuberías de hierro verde goteando lodo, alcantarillas de ladrillo rojo y lodo verdoso.
384. **tileset_theme_western_saloon**: Tablones de pino secos de taberna, puertas batientes de bar, barricas de vino y polvo.
385. **tileset_theme_ancient_greece**: Templos de piedra caliza crema, relieves mitológicos, ánforas y suelos de mosaicos.
386. **tileset_theme_mayan_temple**: Bloques de piedra cubiertos de vegetación selvática, relieves de jaguares y calaveras talladas.
387. **tileset_theme_subway_station**: Azulejos de metro sucios, vías de tren de un píxel, andenes de cemento y graffitis.
388. **tileset_theme_mineshaft_rails**: Vías de vagoneta de madera sobre suelo de carbón agrietado, vigas de soporte y candiles.
389. **tileset_theme_laboratory_tesla**: Bobinas de Tesla de cobre con arcos eléctricos de 1px, frascos de reactivos y ordenadores.
390. **tileset_theme_greenhouse_glass**: Estructuras de invernadero de metal y cristal translúcido con plantas exóticas de fondo.
391. **tileset_theme_toy_land**: Bloques de construcción de plástico de colores brillantes (tipo Lego), dados de madera y trenecitos.
392. **tileset_theme_candy_palace**: Suelos de galleta de jengibre, columnas de bastón de caramelo, ríos de chocolate y piruletas.
393. **tileset_theme_clockwork_tower**: Esferas de reloj de latón gigantes con números romanos, engranajes y péndulos de oro.
394. **tileset_theme_ice_palace**: Muros tallados en bloques de hielo transparente, tronos congelados y arañas de hielo del techo.
395. **tileset_theme_graveyard_crypt**: Lápidas de piedra gris, criptas familiares de sillería, verjas oxidadas de hierro y niebla.
396. **tileset_theme_military_bunker**: Muros de hormigón reforzado gris con sacos de arena defensivos y cajas de munición de madera.
397. **tileset_theme_cloud_castle**: Torres de mármol blanco construidas sobre nubes firmes doradas con arcos celestes.
398. **tileset_theme_hive_colony**: Estructuras hexagonales de cera de abejas gigantes o avispas, miel goteando y capullos.
399. **tileset_theme_zen_dojo**: Suelos de tatami de paja, paneles corredizos de papel shoji de madera de cerezo y bonsáis.
400. **tileset_theme_junkyard_scrap**: Chatarra metálica de coches apilados, vigas oxidadas dobladas, neumáticos y barriles.

---

## 💻 Categoría 8. Interfaz de Usuario y Componentes HUD (60 Recursos)
*   **Identificador de Grupo**: `ui_*`
*   **Finalidad**: Ofrecer elementos gráficos de menús y HUDs alineados de forma ortogonal, que preservan el rigor de píxel perfecto bajo cualquier escala de pantalla.

### 8.1 9-Slice UI Frames & Windows (15 Recursos)
401. **ui_frame_gothic_stone**: Ventana de textura de piedra labrada gris con esquinas biseladas de 6x6 píxeles para RPG oscuros.
402. **ui_frame_scifi_hologram**: Esquinas cian brillante de 4x4 píxeles con líneas de escaneo (scanlines) translúcidas en el fondo.
403. **ui_frame_parchment_retro**: Marco de pergamino antiguo amarillento con bordes quemados marrones y textura arrugada.
404. **ui_frame_cyber_punk**: Esquinas de color rosa magenta neón asimétricas con decoraciones de un píxel de circuitos integrados.
405. **ui_frame_steampunk_brass**: Borde de metal de latón pulido con remaches de un píxel en las juntas y fondo de cuero marrón.
406. **ui_frame_arcade_neon**: Marco metálico negro con bordes brillantes de luces LED que cambian de color (azul/rojo).
407. **ui_frame_wood_cabin**: Marco de troncos de madera rústica unida con soga en las esquinas de un píxel de pixel art.
408. **ui_frame_metallic_steel**: Borde de acero de alta resistencia satinado gris con remaches industriales oscuros de fijación.
409. **ui_frame_royal_gold**: Borde de oro real con fileteado aristocrático rojo rubí y un fondo de terciopelo morado de menús.
410. **ui_frame_chalkboard_school**: Pizarra de escuela verde con marco de madera de pino y tiza blanca dibujada de guía.
411. **ui_frame_tamagotchi_plastic**: Carcasa de plástico de color rosa pastel con pantalla de cristal gris pixelado retro de 1 bit.
412. **ui_frame_classic_windows**: La icónica ventana gris de estilo Windows 95 con bisel tridimensional gris y barra azul de título.
413. **ui_frame_bubble_comic**: Bocadillo de diálogo de texto blanco de cómic con contorno negro grueso de 2px y flecha de dirección.
414. **ui_frame_mossy_bark**: Ventana de corteza de árbol antiguo cubierta de capas de musgo húmedo verde oliva de fantasía.
415. **ui_frame_crystal_ice**: Marco de cristal de hielo translúcido azul celeste con esquinas afiladas brillantes de luz.

### 8.2 Buttons & Controls (25 Recursos)
416. **ui_btn_classic_normal**: Botón rectangular gris con bisel tridimensional de 1px.
417. **ui_btn_classic_hover**: Botón clásico con iluminación amarilla en el contorno biselado.
418. **ui_btn_classic_pressed**: Botón clásico con desplazamiento físico de un píxel hacia abajo de pulsado.
419. **ui_btn_scifi_glow**: Botón metálico oscuro con un piloto LED cian encendido que parpadea.
420. **ui_btn_wood_carved**: Botón tallado en madera de pino rústica con letras pixeladas en relieve oscuro.
421. **ui_ctrl_checkbox_empty**: Casilla de verificación cuadrada de 9x9 con bisel gris oscuro vacía.
422. **ui_ctrl_checkbox_ticked**: Casilla de verificación con un tick de color rojo simétrico de pixel art de activado.
423. **ui_ctrl_radio_empty**: Círculo de opción múltiple de 9x9 píxeles con hueco central gris oscuro de desactivado.
424. **ui_ctrl_radio_selected**: Círculo de opción múltiple con un punto central activo de 3x3 de color amarillo brillante.
425. **ui_ctrl_slider_bar**: Pista de control deslizante gris con ranura de un píxel de profundidad de fondo de menús.
426. **ui_ctrl_slider_handle**: Tirador circular o en forma de flecha simétrica de 7x7 píxeles para el ajuste de valores.
427. **ui_ctrl_scrollbar_track**: Pista vertical de 4px para guiar barras de scroll largas en paneles de interfaz de usuario.
428. **ui_ctrl_scrollbar_handle**: Barra de arrastre de scroll de gran contraste con contorno oscuro de alta visibilidad.
429. **ui_ctrl_toggle_on**: Interruptor deslizante de estilo moderno con fondo verde brillante y tirador de un píxel a la derecha.
430. **ui_ctrl_toggle_off**: Interruptor deslizante con fondo gris oscuro apagado y tirador de un píxel a la izquierda de desactivado.
431. **ui_ctrl_dropdown_arrow**: Pequeño botón de flecha de un píxel apuntando hacia abajo para desplegar listas de opciones.
432. **ui_ctrl_tab_active**: Pestaña de navegación superior de color gris claro alineada con el borde del panel de visualización.
433. **ui_ctrl_tab_inactive**: Pestaña de navegación gris oscuro con bisel inferior cerrado, indicando estado secundario.
434. **ui_ctrl_text_input**: Caja de entrada de texto vacía con borde hundido de 1px y cursor de inserción "|" parpadeante.
435. **ui_ctrl_numeric_stepper**: Control de ajuste numérico con botones "+" y "-" de un píxel de tamaño para precisión.
436. **ui_btn_gold_nav**: Botón ovalado de oro labrado para navegación de menús principales de videojuegos de fantasía.
437. **ui_btn_neon_pink**: Botón de neón rosa brillante para interfaces cyberpunk modernas con letras blancas.
438. **ui_ctrl_color_swatch**: Celda de color de la paleta con borde blanco de un píxel de activo sobre fondo de interfaz.
439. **ui_ctrl_tool_active**: Casilla de herramienta activa con marco naranja de selección para la barra lateral (Toolbar).
440. **ui_ctrl_layer_row**: Fila de capa del manager con iconos de visibilidad (ojo) y bloqueo (candado) alineados a 1px.

### 8.3 HUD Components & Progress Bars (20 Recursos)
441. **ui_hud_health_bar_empty**: Contenedor metálico de hierro oscuro de 128x12 píxeles con ranura de reserva vacía.
442. **ui_hud_health_bar_full**: Barra llena con bloques de píxeles rojos de vida, segmentados cada 10 puntos de daño.
443. **ui_hud_mana_bar_full**: Barra llena con bloques de píxeles azules de maná y gradiente cian de refracción mágica.
444. **ui_hud_xp_bar_fill**: Barra de carga de experiencia del héroe con gradiente amarillo dorado de izquierda a derecha.
445. **ui_hud_shield_bubble**: Icono de escudo en forma de burbuja azul simétrica para la barra de estado de vida.
446. **ui_hud_heart_classic_full**: Corazón rojo de 9x9 píxeles con brillo blanco de un píxel de vida completa de héroe.
447. **ui_hud_heart_classic_empty**: Corazón negro de 9x9 píxeles con borde rojo de un píxel de vida perdida de héroe.
448. **ui_hud_heart_classic_half**: Corazón dividido simétricamente con mitad roja y mitad negra de media vida.
449. **ui_hud_mana_bottle_full**: Poción de cristal esférica de 16x16 píxeles llena de líquido mágico azul brillante.
450. **ui_hud_mana_bottle_empty**: Frasco de poción de cristal esférico vacío con reflejos de luz blanca en el cristal.
451. **ui_hud_gold_coin_icon**: Moneda de oro brillante de 7x7 píxeles con una marca de un píxel marrón de relieve central.
452. **ui_hud_level_badge**: Placa heráldica de bronce para mostrar el nivel del jugador sobre la interfaz de juego.
453. **ui_hud_boss_hp_frame**: Marco decorativo ornamental para la barra de vida de los jefes del juego, con gárgolas.
454. **ui_hud_ammo_bullet**: Bala de latón dorada de 3x7 píxeles utilizada para el contador de munición activa.
455. **ui_hud_key_icon_gold**: Llave de mazmorra de oro brillante de 16x16 píxeles para inventarios.
456. **ui_hud_key_icon_silver**: Llave de plata brillante de 16x16 píxeles de uso común en puertas de rejas.
457. **ui_hud_minimap_frame**: Marco circular o cuadrado de hierro con marcas de puntos cardinales para el mapa de esquina.
458. **ui_hud_clock_dial**: Brújula o reloj solar de interfaz para mostrar el ciclo de día y noche mediante un dial giratorio.
459. **ui_hud_hunger_meat**: Icono de chuleta de carne pixelada de 9x9 píxeles para barras de hambre de juegos de supervivencia.
460. **ui_hud_poison_drop**: Gota de veneno verde fluorescente utilizada para alertar sobre estados de salud alterados.

---

## 💥 Categoría 9. Partículas y Efectos Visuales (60 Recursos)
*   **Identificador de Grupo**: `vfx_*`
*   **Finalidad**: Hojas de sprites (Sprite sheets) secuenciales animadas listas para su renderización interactiva en el motor de juego o como capas dinámicas de decoración del editor.

### 9.1 Natural Elemental VFX (30 Recursos)
461. **vfx_element_fire_loop_6f**: Llama animada en bucle de 6 fotogramas con partículas de carbón flotantes hacia arriba.
462. **vfx_element_water_splash_5f**: Salpicadura de agua azul celeste saliendo en parábola simétrica tras un impacto (5 frames).
463. **vfx_element_ice_shatter_4f**: Rotura de carámbano de hielo con partículas poligonales afiladas dispersándose en 4 direcciones.
464. **vfx_element_smoke_puff_6f**: Nubes de humo circulares grises que se expanden levemente y se disuelven con dither (6 frames).
465. **vfx_element_lava_bubble_5f**: Burbuja de magma caliente que se infla de forma esférica y explota liberando lava (5 frames).
466. **vfx_element_dust_kick_4f**: Bocanada de polvo horizontal generada por la fricción de frenado del jugador contra el suelo.
467. **vfx_element_lightning_strike_4f**: Rayo vertical zigzagueante blanco y cian de gran velocidad de impacto (4 frames).
468. **vfx_element_wind_slash_4f**: Ráfaga de aire horizontal translúcida blanca, ideal para proyectiles de viento.
469. **vfx_element_leaves_swirl_6f**: Remolino de hojas secas otoñales girando en espiral circular por ráfaga de viento (6 frames).
470. **vfx_element_mud_splat_4f**: Salpicadura de barro marrón viscoso extendiéndose de forma asimétrica tras colisión.
471. **vfx_element_fire_spark_4f**: Chispas calientes saliendo disparadas de una hoguera en parábolas asimétricas (4 frames).
472. **vfx_element_snow_flakes_6f**: Caída suave de copos de nieve geométricos de un píxel oscilando de lado a lado (6 frames).
473. **vfx_element_water_bubbles_5f**: Burbujas de aire ascendiendo y expandiéndose bajo el agua de forma cíclica (5 frames).
474. **vfx_element_geyser_spray_6f**: Chorro vertical de agua a alta presión y vapor caliente saliendo del suelo (6 frames).
475. **vfx_element_sand_tornado_6f**: Remolino vertical de arena caliente girando y desplazándose de lado a lado (6 frames).
476. **vfx_element_acid_drip_4f**: Gota de ácido verde goteando de una tubería y disolviéndose al tocar el suelo (4 frames).
477. **vfx_element_coal_ember_5f**: Carbón incandescente parpadeando y apagándose de forma progresiva en ceniza (5 frames).
478. **vfx_element_fog_drift_8f**: Niebla baja deslizándose horizontalmente con transparencia en bucle (8 frames).
479. **vfx_element_rain_drops_4f**: Gotas de lluvia impactando contra el suelo y abriéndose en pequeñas ondas de agua (4 frames).
480. **vfx_element_steam_exhaust_4f**: Chorro lateral de vapor de agua caliente saliendo de una válvula industrial (4 frames).
481. **vfx_element_lava_plume_6f**: Columna de lava densa saliendo de un volcán con caídas de fragmentos ígneos (6 frames).
482. **vfx_element_ice_spikes_5f**: Pinchos de hielo afilados emergiendo rápidamente del suelo en dirección vertical (5 frames).
483. **vfx_element_dust_trail_5f**: Estela de polvo continua que deja el jugador al correr a alta velocidad por suelo seco (5 frames).
484. **vfx_element_fire_ring_6f**: Anillo expansivo de fuego giratorio utilizado para escudos térmicos de héroes (6 frames).
485. **vfx_element_water_wave_6f**: Ola de agua marina desplazándose horizontalmente con cresta de espuma blanca (6 frames).
486. **vfx_element_lightning_ball_5f**: Esfera concentrada de electricidad estática cian parpadeante en bucle (5 frames).
487. **vfx_element_poison_gas_6f**: Nube de gas tóxico purpúreo expandiéndose lentamente de forma asimétrica (6 frames).
488. **vfx_element_earth_quake_5f**: Fractura de baldosas de suelo con rocas y polvo saltando por impacto sísmico (5 frames).
489. **vfx_element_snow_avalanche_6f**: Alud de nieve esponjosa cayendo en cascada por pendiente inclinada de nivel (6 frames).
490. **vfx_element_geothermal_vent_5f**: Fisura en el suelo liberando calor y gases parpadeantes de color amarillo.

### 9.2 Magical & Sci-Fi Effects (30 Recursos)
491. **vfx_magic_explosion_8f**: Explosión esférica de 8 fotogramas que transiciona desde blanco puro hasta humo negro.
492. **vfx_magic_healing_cross_5f**: Cruces verdes simétricas flotando y ascendiendo en espiral alrededor del personaje.
493. **vfx_magic_portal_loop_8f**: Portal elíptico en bucle con remolino concéntrico de colores cian y púrpura.
494. **vfx_magic_sparkles_6f**: Polvo de estrellas de cuatro puntas de color amarillo brillante destellando y apagándose.
495. **vfx_magic_dark_void_6f**: Agujero negro en miniatura succionando píxeles del contorno hacia su centro de gravedad.
496. **vfx_magic_shield_hit_3f**: Barrera de energía circular parpadeando al recibir el impacto de un proyectil (3 frames).
497. **vfx_magic_laser_beam_4f**: Rayo de luz lineal horizontal continuo de color rojo neón con destellos de salida.
498. **vfx_magic_teleport_beams_5f**: Columnas de luz blanca cayendo del cielo y envolviendo al héroe al desvanecerse.
499. **vfx_magic_rune_glow_6f**: Sello rúnico antiguo en el suelo iluminándose progresivamente en color oro brillante.
500. **vfx_magic_buff_arrows_4f**: Flechas amarillas simétricas ascendiendo por los márgenes del sprite del personaje.
501. **vfx_magic_debuff_skulls_4f**: Micro-calaveras purpúreas flotantes desprendiéndose del héroe al sufrir alteración.
502. **vfx_magic_lens_flare_4f**: Brillo óptico circular de lente con destellos horizontales y reflejos simétricos de un píxel.
503. **vfx_magic_pixel_burst_5f**: Explosión cibernética de bloques cuadrados de colores dispersándose por la pantalla.
504. **vfx_magic_time_warp_6f**: Ondas concéntricas de color turquesa distorsionando el espacio temporal del personaje (6 frames).
505. **vfx_magic_necromancy_hand_6f**: Mano esquelética de humo purpúreo emergiendo del suelo para agarrar enemigos (6 frames).
506. **vfx_magic_plasma_projectile_4f**: Esfera de plasma rosa neón con estela ondulada de movimiento rápido (4 frames).
507. **vfx_magic_angelic_wings_6f**: Alas de luz blanca divina batiendo temporalmente en la espalda del héroe (6 frames).
508. **vfx_magic_digital_glitch_4f**: Desplazamientos horizontales de franjas de píxeles simulando un fallo de visualización.
509. **vfx_magic_frozen_shackle_5f**: Cadenas de hielo azul formándose y aprisionando los pies del luchador (5 frames).
510. **vfx_magic_poison_spores_6f**: Esporas verdes bioluminiscentes flotantes que explotan en pequeñas nubes venenosas (6 frames).

---

## 🔬 Categoría 10. Pixel Art Academy y Guías Educativas (10 Recursos)
*   **Identificador de Grupo**: `academy_*`
*   **Finalidad**: Proporcionar tutoriales y esquemas de proporciones cargados como capas del canvas para la práctica directa del artista digital.

511. **academy_guide_anatomy_biped**: Esquemas y medidas de proporciones de esqueletos humanos de 8, 16, 32 y 64 píxeles de altura.
512. **academy_guide_lighting_spheres**: Lección práctica que demuestra cómo sombrear volumen de esferas y evitar el pillow shading.
513. **academy_guide_color_hue_shift**: Ejemplos interactivos de rampas de color planas vs rampas profesionales con cambio de matiz (Hue Shift).
514. **academy_guide_rocks_stepbyset**: Tutorial de diseño de rocas: modelado de bloques angulares, luces de borde y grietas finas de un píxel.
515. **academy_guide_trees_foliage**: Instrucciones para agrupar ramas en "esferas de volumen" antes de pincelar hojas asimétricas.
516. **academy_guide_clouds_shapes**: Explicación del renderizado de nubes de base plana y arcos de círculos perfectos sin pillow shading.
517. **academy_guide_water_reflections**: Guía de dibujo de olas y espuma de mar con patrones alternos de reflejos de agua horizontales.
518. **academy_guide_fire_core**: Tutorial de fuego: formas de llama en gota, núcleos térmicos incandescentes y chispas.
519. **academy_guide_hair_volume**: Cómo modelar cabello y flequillos de personajes en grandes mechones de volumen unificados en vez de hilos de pelo.
520. **academy_guide_eyes_expressions**: Micro-diseños de ojos expresivos para personajes en resoluciones bajas de 1x2, 2x2, 3x3 y 4x4 píxeles.

---
## 🏁 Certificación Oficial del Catálogo de la Biblioteca
Este catálogo maestro y su arquitectura técnica asociada han sido completamente certificados por la Dirección de Arte y el Equipo de Ingeniería de OnePixel Studio para asegurar la consistencia estética y el máximo rendimiento del editor.

*Documento técnico oficial. Todos los recursos quedan integrados y bloqueados de forma definitiva para su uso.*
