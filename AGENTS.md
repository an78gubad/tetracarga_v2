# AGENTS.md — Tetracarga

El alcance está en `PRD.md`.

@CONTEXTO.md

@INSTRUCCIONES.md

## Stack
- TypeScript 6, no 7: Vercel compila las funciones con la API JavaScript de `typescript`, que la 7 no trae.

## Dónde vive cada cosa
- `src/`: todo lo que llega al navegador. Nada de acá habla con el proveedor.
- `server/`: la interfaz del modelo, sus implementaciones y el manejador del proxy. No sabe de Vercel ni de Vite.
- `api/`: la función de Vercel, que solo envuelve al manejador. En desarrollo lo sirve Vite como middleware, así que `npm run dev` alcanza.
- En `server/` y `api/` los imports relativos llevan extensión `.js`: Vercel compila archivo por archivo y Node, en ESM, no completa extensiones.

## Qué NO hacer
- **No usar variables con prefijo `VITE_` para nada secreto.** Vite las mete en el bundle del navegador; la API key va en `.env` sin prefijo.
- **No probar AC-19 con patrones genéricos.** El test busca la clave, la URL del proveedor y el encabezado de autorización reales: patrones como `sk-` dan falsos positivos con el código de React.
