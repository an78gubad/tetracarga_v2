import type { Consulta, FallaDelProveedor, Modelo } from './modelo.js'

/**
 * Implementación de prueba de la interfaz del modelo (AC-16): devuelve, en orden, las respuestas
 * o fallas que se le dan, y anota cada consulta. Sin red ni API key.
 */
export class ModeloDePrueba implements Modelo {
  readonly consultas: Consulta[] = []
  private readonly guion: (string | FallaDelProveedor)[]

  constructor(guion: readonly (string | FallaDelProveedor)[]) {
    this.guion = [...guion]
  }

  async completar(consulta: Consulta): Promise<string> {
    this.consultas.push(consulta)
    const siguiente = this.guion.shift()
    if (siguiente === undefined) throw new Error('El modelo de prueba se quedó sin respuestas')
    if (typeof siguiente !== 'string') throw siguiente
    return siguiente
  }
}
