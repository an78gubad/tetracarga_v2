// Congela la disposición de los 10 escenarios (RNF-05). Se corre una única vez, cuando los
// escenarios están cerrados: si el archivo ya existe, no lo toca. Rehacerlo lo decide el
// usuario, borrándolo a mano.
import { existsSync, writeFileSync } from 'node:fs'
import { runnerImport } from 'vite'

const DESTINO = 'src/escenarios/linea-base.json'

if (existsSync(DESTINO)) {
  console.error(`${DESTINO} ya existe: la línea base se registra una única vez.`)
  process.exit(1)
}

const { module } = await runnerImport('./src/escenarios/linea-base.ts')
writeFileSync(DESTINO, module.serializar(module.calcularLineaBase()))
console.log(`Registrada en ${DESTINO}.`)
