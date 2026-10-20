// Eval de la interpretación contra el proveedor real, aparte de la suite (AC-16): RNF-02 (a, b, c)
// sobre el dataset de 50 descripciones y el p95 de RNF-01. Imprime Markdown para
// eval/ultimo-informe.md. Necesita DEEPSEEK_API_KEY en el .env.
import { loadEnv, runnerImport } from 'vite'

/** Una descripción por vez: el tiempo que ve una persona sola (RNF-01 declara su concurrencia). */
const CONCURRENCIA = 1

const { module: datos } = await runnerImport('./src/dataset/dataset.ts')
const { module: catalogo } = await runnerImport('./src/catalogo/objetos.ts')
const { module: deepseek } = await runnerImport('./server/deepseek.ts')
const { module: interpretacion } = await runnerImport('./server/interpretar.ts')
const { module: esquema } = await runnerImport('./server/esquema.ts')

const modelo = deepseek.modeloDesdeEntorno(loadEnv('production', process.cwd(), ''))
if (!modelo) throw new Error('Falta DEEPSEEK_API_KEY en el .env')

const ENTRADAS = new Map(catalogo.OBJETOS.map((entrada) => [entrada.id, entrada]))
const IDS = new Set(ENTRADAS.keys())
const MEDIDAS = ['largo', 'ancho', 'alto', 'peso']
const iguales = (a, b) => Math.abs(a - b) < 1e-6

/** Envuelve al modelo para quedarse con la última respuesta: de ahí sale la entrada propuesta (c). */
function conRegistro() {
  const registro = { respuesta: null }
  return {
    registro,
    modelo: {
      async completar(consulta) {
        registro.respuesta = await modelo.completar(consulta)
        return registro.respuesta
      },
    },
  }
}

const cuenta = () => ({ bien: 0, total: 0 })
const metricas = { a: cuenta(), b: cuenta(), c: cuenta() }
const errores = []
const tiempos = []
const resultados = {}

async function evaluar(descripcion) {
  const { registro, modelo: registrado } = conRegistro()
  const inicio = performance.now()
  const resultado = await interpretacion.interpretar(registrado, descripcion.texto)
  tiempos.push(performance.now() - inicio)
  resultados[resultado.tipo] = (resultados[resultado.tipo] ?? 0) + 1

  const items = resultado.tipo === 'interpretada' ? resultado.valor : []
  const delModelo = resultado.tipo === 'interpretada' ? (esquema.leerRespuesta(registro.respuesta, IDS)?.items ?? []) : []
  if (resultado.tipo !== 'interpretada') errores.push(`${descripcion.id}: ${resultado.tipo}${resultado.motivo ? ` (${resultado.motivo})` : ''}`)
  else if (items.length !== descripcion.items.length) {
    errores.push(`${descripcion.id}: ${items.length} ítems, se esperaban ${descripcion.items.length}`)
  }

  descripcion.items.forEach((esperado, i) => {
    const item = items[i]
    const anotar = (metrica, bien, detalle) => {
      metricas[metrica].total++
      if (bien) metricas[metrica].bien++
      else errores.push(`${descripcion.id} · ${esperado.nombre} · (${metrica}) ${detalle}`)
    }
    const mostrar = (campo) => (campo ? JSON.stringify(campo) : 'sin ítem')

    // Cantidad: declarada si la descripción la da; si no, tiene que quedar por preguntar.
    if (esperado.cantidad !== null) {
      const campo = item?.cantidad
      anotar('a', campo?.origen === 'declarado' && campo.valor === esperado.cantidad, `cantidad ${esperado.cantidad}: ${mostrar(campo)}`)
    } else {
      anotar('b', item?.cantidad.origen === 'faltante', `cantidad ausente: ${mostrar(item?.cantidad)}`)
    }

    for (const medida of MEDIDAS) {
      const campo = item?.[medida]
      const declarado = esperado.declarados[medida]
      if (declarado !== undefined) {
        anotar('a', campo?.origen === 'declarado' && iguales(campo.valor, declarado), `${medida} ${declarado}: ${mostrar(campo)}`)
        continue
      }
      // Ausente: faltante, o estimado con el valor exacto de la entrada que nombra (RNF-02 b).
      const delCatalogo = campo?.origen === 'estimado' ? ENTRADAS.get(campo.entrada)?.[medida] : undefined
      const bien =
        campo?.origen === 'faltante' || (campo?.origen === 'estimado' && delCatalogo != null && iguales(campo.valor, delCatalogo))
      anotar('b', bien, `${medida} ausente: ${mostrar(campo)}`)
    }

    const propuesta = delModelo[i]?.entrada
    anotar('c', item !== undefined && propuesta === esperado.entrada, `entrada ${esperado.entrada}: ${item ? propuesta : 'sin ítem'}`)
  })
}

const pendientes = [...datos.DATASET]
await Promise.all(
  Array.from({ length: CONCURRENCIA }, async () => {
    while (pendientes.length > 0) await evaluar(pendientes.shift())
  }),
)

const porcentaje = ({ bien, total }) => `${((bien / total) * 100).toFixed(1).replace('.', ',')}%`
const ordenados = [...tiempos].sort((a, b) => a - b)
const percentil = (p) => ordenados[Math.ceil(ordenados.length * p) - 1]
const segundos = (ms) => `${(ms / 1000).toFixed(2).replace('.', ',')} s`

console.log('| Métrica | Correctos | Resultado | Umbral |')
console.log('|---|---|---|---|')
console.log(`| RNF-02 (a) declarados bien extraídos | ${metricas.a.bien}/${metricas.a.total} | ${porcentaje(metricas.a)} | ≥ 90% |`)
console.log(`| RNF-02 (b) ausentes estimados o preguntados | ${metricas.b.bien}/${metricas.b.total} | ${porcentaje(metricas.b)} | 100% |`)
console.log(`| RNF-02 (c) entrada del catálogo correcta | ${metricas.c.bien}/${metricas.c.total} | ${porcentaje(metricas.c)} | ≥ 90% |`)
console.log(`\n| RNF-01 | p50 | p95 | Máximo | Umbral |`)
console.log('|---|---|---|---|---|')
console.log(`| Concurrencia ${CONCURRENCIA}, ${tiempos.length} descripciones | ${segundos(percentil(0.5))} | ${segundos(percentil(0.95))} | ${segundos(ordenados.at(-1))} | p95 < 10 s |`)
console.log(`\nResultados: ${Object.entries(resultados).map(([tipo, n]) => `${tipo} ${n}`).join(', ')}.`)
console.log(`Modelo: ${deepseek.MODELO_DEEPSEEK}.`)
if (errores.length > 0) console.log(`\nErrores:\n${errores.map((error) => `- ${error}`).join('\n')}`)
