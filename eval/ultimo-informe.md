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
