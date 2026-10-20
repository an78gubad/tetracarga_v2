import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Connect, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { modeloDesdeEntorno } from './server/deepseek.js'
import { manejar } from './server/manejador.js'

/**
 * En desarrollo, Vite sirve el proxy como middleware en la misma ruta que la función de Vercel:
 * `npm run dev` alcanza. La key se lee del .env sin prefijo VITE_, así nunca llega al bundle (RNF-07).
 */
function proxyDelModelo(entorno: Record<string, string>): Plugin {
  const atender: Connect.NextHandleFunction = (pedido: IncomingMessage, respuesta: ServerResponse) => {
    if (pedido.method !== 'POST') {
      respuesta.writeHead(405, { Allow: 'POST' }).end()
      return
    }
    const partes: Buffer[] = []
    pedido.on('data', (parte: Buffer) => partes.push(parte))
    pedido.on('end', async () => {
      const { estado, cuerpo } = await manejar(Buffer.concat(partes).toString('utf8'), () => modeloDesdeEntorno(entorno))
      respuesta.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(cuerpo))
    })
  }
  return {
    name: 'proxy-del-modelo',
    configureServer: (servidor) => void servidor.middlewares.use('/api/interpretar', atender),
    configurePreviewServer: (servidor) => void servidor.middlewares.use('/api/interpretar', atender),
  }
}

export default defineConfig(({ mode }) => ({
  // El tercer argumento vacío carga también las variables sin prefijo, solo de este lado.
  plugins: [react(), proxyDelModelo(loadEnv(mode, process.cwd(), ''))],
  test: {
    include: ['*.test.ts', 'src/**/*.test.ts', 'server/**/*.test.ts'],
  },
}))
