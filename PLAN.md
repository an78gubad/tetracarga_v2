# Plan

Tres features core, en este orden: consolidación, vista 3D, interpretación. Antes, la base y
los tres artefactos versionados, que el PRD pide como primer entregable. Un paso por vez; cada
paso cierra con tests y chequeo de tipos en verde, commit y push.

## 0. Base
- [x] 1. Andamiaje: Vite, React, TypeScript 6, Vitest, Node 22, chequeo de tipos y CI.
- [x] 2. Tipos de dominio: ítem, campo con su origen (declarado / estimado con su entrada /
  faltante con su motivo), contenedor, bulto colocado, disposición. Milímetros enteros, ejes
  de RF-07.

## 1. Artefactos versionados
- [x] 3. Catálogo de contenedores: 20', 40' y 40' HC, medidas internas y carga útil, cada uno
  con la ficha exacta de la naviera.
- [x] 4. Catálogo de objetos, cada entrada con su fuente; sin fuente no entra. Al menos una
  entrada con medidas y sin peso (AC-18).
- [x] 5. Los 10 escenarios: ~115% de lo que entra salvo los de sobrecarga, sin ningún tipo que
  llene el contenedor solo.
- [x] 6. Dataset de 50 descripciones, etiquetado por ítem.

## 2. Feature A — Consolidación (RF-05, RF-07, RF-08, RF-09)
- [x] 7. Validador en `src/validador/`, sin traer código de fuera de su carpeta: límites,
  superposición, apoyo del 80% contra bultos anteriores (AC-24), carga máxima, no apilable,
  orientación, peso encima propagado. Tests con disposiciones armadas a mano.
- [x] 8. Acomodador en `src/acomodador/`, con el orden de colocación de `CONTEXTO.md`;
  determinístico, con motivos "peso" y "volumen". AC-04 a AC-07, AC-15, AC-21, AC-23.
- [x] 9. Informe de aprovechamiento (RF-09) y validador bloqueante antes de devolver (RNF-03).
- [ ] 10. Suite sobre los 10 escenarios: AC-10 y tiempo con 200 bultos (RNF-04).
- [ ] 11. Congelar la línea base una única vez, en un archivo propio y no en snapshots de
  Vitest, y test bulto por bulto (AC-14). Números a `eval/ultimo-informe.md`.

## 3. Feature B — Pantalla y vista 3D (RF-04, RF-05, RF-06, RF-10)
- [ ] 12. Lista de ítems editable a mano: agregar, editar, eliminar, marcas de RF-06, estimado
  → declarado al editar (AC-12), selector de contenedor, consolidar bloqueado si falta algo.
- [ ] 13. Escena Three.js: contenedor más un `InstancedMesh` por tipo, cámara orbital.
- [ ] 14. Color por id estable del ítem (AC-09) y distinción entre bultos del mismo tipo.
- [ ] 15. Control deslizante de la secuencia (AC-08).
- [ ] 16. Verificación en el navegador: recalcular al editar o cambiar contenedor (AC-13) y
  fps con 200 bultos (RNF-06) al informe.

## 4. Feature C — Interpretación (RF-01, RF-02, RF-03, RNF-07, RNF-08, RNF-09)
- [ ] 17. Interfaz del modelo en `server/`: falla del proveedor (transitoria o no) frente a
  error de interpretación, reintentos acotados, implementación de prueba. AC-20.
- [ ] 18. Post-proceso determinístico: unidades, "AxBxC", peso total ÷ cantidad, respuesta
  fuera del esquema descartada entera (AC-26), id inexistente descartado (AC-17), completar
  solo desde el catálogo. AC-01 a AC-03, AC-11, AC-16, AC-18, AC-22.
- [ ] 19. Implementación DeepSeek y proxy: manejador en `server/`, función en `api/`,
  middleware en Vite, key en `.env` sin `VITE_`. Rechazo de más de 2.000 caracteres sin
  llamar al modelo (AC-25) y longitud de respuesta acotada (RNF-09).
- [ ] 20. Campo de texto libre que carga la lista del paso 12, con "estimado — entrada X" y
  las preguntas pendientes.
- [ ] 21. AC-19: el test arma su propio bundle y busca la key, la URL y el encabezado reales.
- [ ] 22. Eval aparte: RNF-02 (a, b, c) y p95 de RNF-01 con concurrencia declarada, al
  informe con fecha y comando.

## Dependencias
Acordadas: React, React DOM, Vite, `@vitejs/plugin-react`, TypeScript 6, Vitest y los tipos
de React y Node. Cualquier otra se acuerda en el paso que la necesite (Three.js en el 13).
