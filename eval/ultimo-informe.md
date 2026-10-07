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
