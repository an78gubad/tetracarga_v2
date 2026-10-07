// Mide la consolidación de los 10 escenarios y lo imprime en Markdown, para
// eval/ultimo-informe.md: aprovechamiento (RF-09), validez (RNF-03) y tiempo (RNF-04).
import { runnerImport } from 'vite'

const CORRIDAS = 20

const { module: escenarios } = await runnerImport('./src/escenarios/escenarios.ts')
const { module: contenedores } = await runnerImport('./src/catalogo/contenedores.ts')
const { module: consolidacion } = await runnerImport('./src/consolidacion/consolidar.ts')

const porcentaje = (fraccion) => `${(fraccion * 100).toFixed(1).replace('.', ',')}%`

console.log('| Escenario | Contenedor | Colocados | Afuera por volumen | Afuera por peso | Volumen | Peso | p95 |')
console.log('|---|---|---|---|---|---|---|---|')
for (const escenario of escenarios.ESCENARIOS) {
  const contenedor = contenedores.CONTENEDORES[escenario.contenedor]
  const tiempos = []
  let resultado
  for (let i = 0; i < CORRIDAS; i++) {
    const inicio = performance.now()
    resultado = consolidacion.consolidar(escenario.items, contenedor)
    tiempos.push(performance.now() - inicio)
  }
  if (!resultado.valida) throw new Error(`${escenario.id}: la disposición no pasa el validador`)
  tiempos.sort((a, b) => a - b)
  const p95 = tiempos[Math.ceil(CORRIDAS * 0.95) - 1]
  const { informe } = resultado
  const total = escenario.items.reduce((suma, item) => suma + item.cantidad, 0)
  const porMotivo = (motivo) => informe.afuera.filter((bulto) => bulto.motivo === motivo).length
  console.log(
    `| ${escenario.id} | ${contenedor.nombre} | ${informe.bultosColocados}/${total} | ${porMotivo('volumen')} | ${porMotivo('peso')} | ` +
      `${porcentaje(informe.aprovechamientoDeVolumen)} | ${porcentaje(informe.aprovechamientoDePeso)} | ${Math.round(p95)} ms |`,
  )
}
console.log(`\nTiempo: p95 de ${CORRIDAS} corridas de consolidar() por escenario, una por vez, con el validador incluido.`)
