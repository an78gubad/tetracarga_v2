# Último informe

Números medidos. Cada sección dice cuándo y con qué comando salieron; no se completan a mano.

## Consolidación de los 10 escenarios

- Fecha: 2026-10-07, al congelar la línea base (`src/escenarios/linea-base.json`).
- Comando: `npm run informe:consolidacion`
- Entorno: Node 22.20.0, Windows 11, escritorio.

| Escenario | Contenedor | Colocados | Afuera por volumen | Afuera por peso | Volumen | Peso | p95 |
|---|---|---|---|---|---|---|---|
| 01-cajas-mixtas | 20' estándar | 114/148 | 34 | 0 | 80,0% | 8,0% | 232 ms |
| 02-tambores-y-cajas | 20' estándar | 79/93 | 14 | 0 | 71,4% | 34,0% | 74 ms |
| 03-fragiles | 40' estándar | 144/160 | 16 | 0 | 65,9% | 18,3% | 173 ms |
| 04-no-apilables | 40' estándar | 107/112 | 5 | 0 | 52,8% | 34,9% | 67 ms |
| 05-pallets | 40' estándar | 36/42 | 6 | 0 | 62,9% | 52,0% | 15 ms |
| 06-sobrecarga-de-peso | 20' estándar | 133/157 | 0 | 24 | 50,5% | 99,4% | 211 ms |
| 07-altos | 40' high cube | 68/74 | 6 | 0 | 78,9% | 24,5% | 35 ms |
| 08-doscientos-bultos | 40' estándar | 181/200 | 19 | 0 | 82,8% | 15,4% | 372 ms |
| 09-peso-encima | 20' estándar | 101/135 | 34 | 0 | 68,4% | 14,2% | 267 ms |
| 10-todo-junto | 40' high cube | 109/114 | 5 | 0 | 65,2% | 44,1% | 207 ms |

Tiempo: p95 de 20 corridas de consolidar() por escenario, una por vez, con el validador incluido.

## Vista 3D en el navegador (RNF-06, AC-13)

- Fecha: 2026-10-20, paso 16 del plan.
- Comando: `npm run dev` y medición en la página con `requestAnimationFrame`, 8 s por corrida; los
  draw calls, contando las llamadas de dibujo de WebGL2 en cada cuadro.
- Entorno: Chrome 155 de escritorio, Windows 11, AMD Radeon integrada (ANGLE, Direct3D 11),
  16 núcleos, monitor de 60 Hz, lienzo de 1231×478 px con devicePixelRatio 1.
- Confirmado con el panel Rendimiento de DevTools, la herramienta que nombra RNF-06 (abajo).

### RNF-06: fps con 200 bultos

Escenario `08-doscientos-bultos` en el 40' high cube, donde entran los 200 bultos (3 tipos), con
la carga completa a la vista.

| Corrida | Cuadros | fps promedio | fps del cuadro p95 | Cuadro p50 | Peor cuadro |
|---|---|---|---|---|---|
| 1 | 479 | 60,0 | 59,5 | 16,7 ms | 17,4 ms |
| 2 | 478 | 60,0 | 59,2 | 16,7 ms | 17,4 ms |
| 3 | 478 | 60,0 | 59,5 | 16,7 ms | 17,3 ms |

60 fps es el tope del monitor. Una corrida previa dio 53,5 fps promedio con el p95 en 29,9, y en
la misma tanda la escena vacía (control en 0) bajó a 42 fps: el ruido era del entorno y no de la
escena. Se descartó esa tanda y se repitió.

Con el panel Rendimiento de DevTools, el mismo día y la misma carga: grabación de 4,43 s girando
la vista con el mouse. La pista de cuadros queda toda verde, sin cuadros perdidos ni parciales;
con zoom sobre 920–1.120 ms, cada cuadro dura entre 16,6 y 16,7 ms. Hilo principal en esos
4.430 ms: 193 ms de scripts, 111 ms de sistema, 30 ms de pintura y 17 ms de renderización. INP:
60 ms. Había extensiones del navegador activas, que suman a esos tiempos.

Draw calls por cuadro: 3 fijos (piso, aristas del contenedor, contornos de los bultos) más uno por
tipo. 200 bultos de 3 tipos dan 6; 109 bultos de 5 tipos (`10-todo-junto`) dan 8.

### AC-13: recalcular al cambiar de contenedor

Escenario `10-todo-junto`:

| Contenedor | Entran | Peso | Carga útil |
|---|---|---|---|
| 40' high cube | 109 de 114 | 44,1% | 28.690 kg |
| 20' estándar | 34 de 114 | 21,3% | 28.300 kg |
| 40' high cube, de vuelta | 109 de 114 | 44,1% | 28.690 kg |

Al editar la cantidad de heladeras de 14 a 4, recalcula: entran 103 de 104.

## Interpretación contra el proveedor real (RNF-02, RNF-01)

- Fecha: 2026-10-20, paso 22 del plan.
- Comando: `npm run eval:interpretacion`, aparte de la suite (AC-16).
- Entorno: Node 22.20.0, Windows 11; DeepSeek `deepseek-flash`, sin razonamiento, temperatura 0.
- Cómo se cuenta, ítem por ítem y emparejado por orden de aparición, como está etiquetado el
  dataset: (a) cada campo que la descripción da, cantidad incluida, tiene que quedar declarado con
  ese valor; (b) cada campo ausente tiene que quedar faltante, o estimado con el valor exacto de la
  entrada que nombra, y la cantidad ausente solo faltante; (c) la entrada que propone el modelo,
  `null` incluido, tiene que ser la etiquetada. Una descripción que no se interpreta, o un ítem que
  no aparece, cuentan como error en las tres.
- RNF-01: tiempo de `interpretar()` de punta a punta, reintentos incluidos, sin pasar por HTTP.
  Concurrencia 1: una descripción por vez, lo que ve una persona sola.

| Métrica | Correctos | Resultado | Umbral |
|---|---|---|---|
| RNF-02 (a) declarados bien extraídos | 269/273 | 98,5% | ≥ 90% |
| RNF-02 (b) ausentes estimados o preguntados | 117/117 | 100,0% | 100% |
| RNF-02 (c) entrada del catálogo correcta | 78/78 | 100,0% | ≥ 90% |

| RNF-01 | p50 | p95 | Máximo | Umbral |
|---|---|---|---|---|
| Concurrencia 1, 50 descripciones | 1,29 s | 1,76 s | 2,25 s | p95 < 10 s |

Resultados: interpretada 50.
Modelo: deepseek-flash.

Errores:
- d22 · tablero eléctrico · (a) cantidad 1: {"origen":"faltante","motivo":"no-declarado"}
- d33 · bobinas de papel · (a) largo 1000: {"origen":"faltante","motivo":"sin-entrada"}
- d33 · bobinas de papel · (a) ancho 1000: {"origen":"faltante","motivo":"sin-entrada"}
- d41 · tanque de agua · (a) cantidad 1: {"origen":"faltante","motivo":"no-declarado"}

### Después del paso 24: prompt ajustado y verificación de lo escrito

- Fecha: 2026-10-20. Comando: `npm run eval:interpretacion`, una corrida por fila, mismas
  condiciones que arriba.
- Cambios: el prompt toma "un"/"una" como cantidad 1 y el diámetro como largo y ancho; y el código
  descarta todo valor que el modelo dice haber copiado y no está escrito en la descripción
  (`server/escrito.ts`).
- Con temperatura 0 el modelo no es determinista: el mismo prompt dio (b) 100% y 96,6% en dos
  corridas seguidas. En la segunda, d18 trajo largo y ancho del europallet (1200 × 800) como
  declarados sin que la descripción los diera. Por eso la verificación va en el código.

| Corrida | Prompt | Verificación | (a) | (b) | (c) | p95 RNF-01 |
|---|---|---|---|---|---|---|
| 18:09 | "un" sin "cada uno" | no | 100,0% | 99,1% | 100,0% | 1,66 s |
| 18:10 | final | no | 100,0% | 100,0% | 100,0% | 1,66 s |
| 18:11 | final | no | 99,6% | 96,6% | 100,0% | 1,82 s |
| 18:15 | final | sí | 99,6% | 100,0% | 100,0% | 1,62 s |
| 18:16 | final | sí | 100,0% | 100,0% | 100,0% | 1,64 s |
| 18:17 | final | sí | 100,0% | 100,0% | 100,0% | 1,62 s |

Errores con la verificación: uno solo, en 18:15, d22 "Un tablero…" con la cantidad por preguntar
en vez de 1: no inventa nada, pregunta de más. Límite conocido: la verificación mira que el número
esté escrito, no a qué campo corresponde; un valor inventado que coincide con otro número de la
descripción pasa.

### Después del paso 26: estética del Tetris

- Fecha: 2026-10-20. Comando: `npm run dev` y la misma medición en la página, 5 s por etapa.
- Escenario `08-doscientos-bultos` en el 40' high cube, reproduciendo la secuencia: cae un bulto
  cada 140 ms, el peor caso de la animación.

| Etapa | fps promedio | Cuadro p50 | Peor cuadro |
|---|---|---|---|
| En pausa | 30,0 | 33,3 ms | 34,1 ms |
| Reproduciendo | 30,0 | 33,3 ms | 34,0 ms |
| En pausa otra vez | 30,0 | 33,3 ms | 33,8 ms |

En esta tanda el navegador limitó los cuadros a 30 por segundo, también con la escena quieta: la
animación no agrega costo medible dentro de ese tope, pero el margen por encima de 30 no se pudo
medir. Falta repetirlo con el panel Rendimiento de DevTools. Draw calls por cuadro: 4 fijos (piso,
grilla, aristas del contenedor, contornos) más uno por tipo con bultos a la vista; con los 3 tipos,
7.

Segundo intento, mismo día, sobre el deploy de Vercel (`tetracarga-v2.vercel.app`): también limitado
a 30 cuadros por segundo, y más irregular en pausa (p95 de 10 fps) que reproduciendo (p95 de 29,9).
Sigue siendo el entorno y no la escena; una causa probable es el modo de ahorro de energía de
Chrome, que limita a 30 fps. Queda sin confirmar el margen por encima de 30 con la animación.
