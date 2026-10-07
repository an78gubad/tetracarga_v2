import { acomodar } from '../acomodador/acomodar'
import { CONTENEDORES } from '../catalogo/contenedores'
import type { Disposicion } from '../dominio/tipos'
import { ESCENARIOS } from './escenarios'

/** La disposición de cada escenario, por id: lo que se congela en linea-base.json (RNF-05). */
export function calcularLineaBase(): Record<string, Disposicion> {
  return Object.fromEntries(
    ESCENARIOS.map((escenario) => [escenario.id, acomodar(escenario.items, CONTENEDORES[escenario.contenedor])]),
  )
}

/** Un bulto por línea, para que un cambio se lea en el diff. */
export function serializar(lineaBase: Record<string, Disposicion>): string {
  const linea = (valor: unknown) => `      ${JSON.stringify(valor)}`
  const escenarios = Object.entries(lineaBase).map(
    ([id, disposicion]) =>
      `  ${JSON.stringify(id)}: {\n` +
      `    "contenedor": ${JSON.stringify(disposicion.contenedor)},\n` +
      `    "colocados": [\n${disposicion.colocados.map(linea).join(',\n')}\n    ],\n` +
      `    "afuera": [\n${disposicion.afuera.map(linea).join(',\n')}\n    ]\n` +
      `  }`,
  )
  return `{\n${escenarios.join(',\n')}\n}\n`
}
