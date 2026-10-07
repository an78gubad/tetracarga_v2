import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

// RF-08: el validador no comparte código con el acomodador, ni siquiera constantes. Cada uno
// solo trae código de su propia carpeta; de afuera, solo tipos.
const CARPETAS = ['src/validador', 'src/acomodador']

const IMPORTACION = /^\s*(?:import|export)\s+(type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/gm

function importacionesProhibidas(carpeta: string): string[] {
  return readdirSync(carpeta)
    .filter((archivo) => archivo.endsWith('.ts') && !archivo.endsWith('.test.ts'))
    .flatMap((archivo) => {
      const codigo = readFileSync(join(carpeta, archivo), 'utf8')
      return [...codigo.matchAll(IMPORTACION)]
        .filter(([, soloTipos, ruta]) => !soloTipos && !(ruta!.startsWith('./') && !ruta!.includes('..')))
        .map(([, , ruta]) => `${archivo}: ${ruta}`)
    })
}

describe.each(CARPETAS)('%s', (carpeta) => {
  test('solo trae código de su propia carpeta', () => {
    expect(importacionesProhibidas(carpeta)).toEqual([])
  })
})
