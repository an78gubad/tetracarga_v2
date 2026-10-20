import { describe, expect, test } from 'vitest'
import { aListo, faltantes } from '../src/dominio/item.js'
import type { Item } from '../src/dominio/tipos.js'
import type { ItemDelModelo } from './esquema.js'
import { armarConsulta, interpretar, MAX_TOKENS_RESPUESTA } from './interpretar.js'
import { ModeloDePrueba } from './modelo-de-prueba.js'

const vacio: ItemDelModelo = { nombre: '', cantidad: null, largo: null, ancho: null, alto: null, peso: null, entrada: null }

/** Una respuesta del modelo con los ítems dados, completando con null lo que no se dice. */
const respuesta = (...items: Partial<ItemDelModelo>[]) => JSON.stringify({ items: items.map((item) => ({ ...vacio, ...item })) })

const cm = (valor: number) => ({ valor, unidad: 'cm' as const })
const kilos = (valor: number, alcance: 'unitario' | 'total' = 'unitario') => ({ valor, unidad: 'kg' as const, alcance })

async function interpretarCon(...respuestas: string[]): Promise<Item[]> {
  let siguiente = 0
  const resultado = await interpretar(new ModeloDePrueba(respuestas), 'descripción', {
    nuevoId: () => `item-${++siguiente}`,
    esperar: async () => {},
  })
  if (resultado.tipo !== 'interpretada') throw new Error(`no se interpretó: ${resultado.tipo}`)
  return resultado.valor
}

test('AC-01: dos ítems con sus cantidades, y las cajas en milímetros y kilos', async () => {
  const [cajas, tambores] = await interpretarCon(
    respuesta(
      { nombre: 'cajas', cantidad: 40, largo: cm(60), ancho: cm(40), alto: cm(30), peso: kilos(12) },
      { nombre: 'tambores de 200 litros', cantidad: 15, entrada: 'tambor-200l' },
    ),
  )
  expect(cajas).toMatchObject({
    cantidad: { origen: 'declarado', valor: 40 },
    largo: { origen: 'declarado', valor: 600 },
    ancho: { origen: 'declarado', valor: 400 },
    alto: { origen: 'declarado', valor: 300 },
    peso: { origen: 'declarado', valor: 12 },
  })
  expect(tambores!.cantidad).toEqual({ origen: 'declarado', valor: 15 })
})

test('AC-02: sin medidas y con entrada, se completan desde el catálogo marcadas con la entrada usada', async () => {
  const [tambores] = await interpretarCon(respuesta({ nombre: 'tambores de 200 litros', cantidad: 15, entrada: 'tambor-200l' }))
  expect(tambores).toMatchObject({
    largo: { origen: 'estimado', valor: 585, entrada: 'tambor-200l' },
    ancho: { origen: 'estimado', valor: 585, entrada: 'tambor-200l' },
    alto: { origen: 'estimado', valor: 877, entrada: 'tambor-200l' },
  })
})

test('AC-03: sin entrada y sin medidas, los campos quedan vacíos con su motivo y la consolidación se bloquea', async () => {
  const [item] = await interpretarCon(respuesta({ nombre: 'esculturas', cantidad: 3 }))
  for (const campo of ['largo', 'ancho', 'alto', 'peso'] as const) {
    expect(item![campo]).toEqual({ origen: 'faltante', motivo: 'sin-entrada' })
  }
  expect(faltantes(item!).map((faltante) => faltante.campo)).toEqual(['largo', 'ancho', 'alto', 'peso'])
  expect(aListo(item!)).toBeNull()
})

test('AC-18: una entrada con medidas y sin peso deja las medidas estimadas y el peso faltante con otro motivo', async () => {
  const [tambores] = await interpretarCon(respuesta({ nombre: 'tambores', cantidad: 15, entrada: 'tambor-200l' }))
  expect(tambores!.largo.origen).toBe('estimado')
  expect(tambores!.peso).toEqual({ origen: 'faltante', motivo: 'entrada-sin-dato' })
  expect(aListo(tambores!)).toBeNull()
})

test('AC-22: sin cantidad, la cantidad queda faltante y la consolidación se bloquea', async () => {
  const [cajas] = await interpretarCon(
    respuesta({ nombre: 'cajas', largo: cm(60), ancho: cm(40), alto: cm(30), peso: kilos(12) }),
  )
  expect(cajas!.cantidad).toEqual({ origen: 'faltante', motivo: 'no-declarado' })
  expect(aListo(cajas!)).toBeNull()
})

test('lo declarado manda sobre el catálogo, y lo que la entrada no trae se pregunta', async () => {
  const [pallets] = await interpretarCon(
    respuesta({ nombre: 'europallets', cantidad: 10, alto: { valor: 1.5, unidad: 'm' }, peso: kilos(600), entrada: 'europallet' }),
  )
  expect(pallets).toMatchObject({
    largo: { origen: 'estimado', valor: 1200, entrada: 'europallet' },
    ancho: { origen: 'estimado', valor: 800, entrada: 'europallet' },
    alto: { origen: 'declarado', valor: 1500 },
    peso: { origen: 'declarado', valor: 600 },
  })
})

describe('AC-17: id de catálogo inexistente', () => {
  test('descarta la respuesta entera en lugar de completar con algo parecido, y vuelve a preguntar', async () => {
    const items = await interpretarCon(
      respuesta({ nombre: 'cajas', cantidad: 5, largo: cm(60), ancho: cm(40), alto: cm(30) }, { nombre: 'tambores', cantidad: 15, entrada: 'tambor-200-litros' }),
      respuesta({ nombre: 'tambores', cantidad: 15, entrada: 'tambor-200l' }),
    )
    expect(items.map((item) => item.nombre)).toEqual(['tambores'])
  })

  test('si siempre lo inventa, no se muestra ningún ítem', async () => {
    const respuestas = Array(3).fill(respuesta({ nombre: 'tambores', cantidad: 15, entrada: 'tambor-chico' }))
    const resultado = await interpretar(new ModeloDePrueba(respuestas), 'descripción', { esperar: async () => {} })
    expect(resultado).toEqual({ tipo: 'sin-interpretacion', intentos: 3 })
  })
})

describe('AC-26: respuesta fuera del esquema', () => {
  test.each([
    ['no es JSON', 'Acá tenés los ítems: cajas'],
    ['sin lista de ítems', '{"bultos": []}'],
    ['un ítem sin nombre', respuesta({ cantidad: 3 })],
    ['cantidad con decimales', respuesta({ nombre: 'cajas', cantidad: 2.5 })],
    ['cantidad en texto', JSON.stringify({ items: [{ ...vacio, nombre: 'cajas', cantidad: '40' }] })],
    ['medida negativa', respuesta({ nombre: 'cajas', cantidad: 1, largo: cm(-60) })],
    ['unidad desconocida', respuesta({ nombre: 'cajas', cantidad: 1, largo: { valor: 24, unidad: 'in' as 'cm' } })],
    ['peso sin alcance', JSON.stringify({ items: [{ ...vacio, nombre: 'cajas', peso: { valor: 3, unidad: 'kg' } }] })],
    ['un campo ausente', JSON.stringify({ items: [{ nombre: 'cajas', cantidad: 3 }] })],
  ])('%s: no se muestra ningún ítem de esa respuesta y se vuelve a preguntar', async (_, invalida) => {
    // Un ítem válido junto al inválido tampoco se muestra: se descarta la respuesta entera.
    const conValido = invalida.startsWith('{"items":[') ? invalida.replace('{"items":[', `{"items":[${JSON.stringify({ ...vacio, nombre: 'bidones', cantidad: 4 })},`) : invalida
    const items = await interpretarCon(conValido, respuesta({ nombre: 'cajas', cantidad: 3 }))
    expect(items.map((item) => item.nombre)).toEqual(['cajas'])
  })

  test('un bloque de código alrededor del JSON se acepta', async () => {
    const items = await interpretarCon('```json\n' + respuesta({ nombre: 'cajas', cantidad: 3 }) + '\n```')
    expect(items).toHaveLength(1)
  })
})

describe('RF-02: unidades y peso', () => {
  test('una medida sin unidad está en centímetros', async () => {
    const [cajas] = await interpretarCon(respuesta({ nombre: 'cajas', cantidad: 1, largo: { valor: 60, unidad: null } }))
    expect(cajas!.largo).toEqual({ origen: 'declarado', valor: 600 })
  })

  test('metros y milímetros se pasan a milímetros enteros', async () => {
    const [motores] = await interpretarCon(
      respuesta({ nombre: 'motores', cantidad: 3, largo: { valor: 1.2, unidad: 'm' }, ancho: { valor: 805, unidad: 'mm' }, alto: { valor: 0.9, unidad: 'm' } }),
    )
    expect([motores!.largo, motores!.ancho, motores!.alto]).toEqual([
      { origen: 'declarado', valor: 1200 },
      { origen: 'declarado', valor: 805 },
      { origen: 'declarado', valor: 900 },
    ])
  })

  test('un peso total se divide por la cantidad', async () => {
    const [cajas] = await interpretarCon(respuesta({ nombre: 'cajas', cantidad: 3, peso: kilos(1000, 'total') }))
    expect(cajas!.peso).toEqual({ origen: 'declarado', valor: 333.333 })
  })

  test('toneladas y gramos se pasan a kilos', async () => {
    const [bobinas, sobres] = await interpretarCon(
      respuesta(
        { nombre: 'bobinas', cantidad: 4, peso: { valor: 2, unidad: 't', alcance: 'total' } },
        { nombre: 'sobres', cantidad: 100, peso: { valor: 250, unidad: 'g', alcance: 'unitario' } },
      ),
    )
    expect(bobinas!.peso).toEqual({ origen: 'declarado', valor: 500 })
    expect(sobres!.peso).toEqual({ origen: 'declarado', valor: 0.25 })
  })

  test('un peso sin unidad está en kilos', async () => {
    const [cajas] = await interpretarCon(respuesta({ nombre: 'cajas', cantidad: 1, peso: { valor: 12, unidad: null, alcance: 'unitario' } }))
    expect(cajas!.peso).toEqual({ origen: 'declarado', valor: 12 })
  })

  test('un peso total sin cantidad no se divide ni se completa: se pregunta', async () => {
    const [tambores] = await interpretarCon(respuesta({ nombre: 'tambores', peso: kilos(3000, 'total'), entrada: 'tambor-200l' }))
    expect(tambores!.peso).toEqual({ origen: 'faltante', motivo: 'no-declarado' })
  })
})

test('AC-11: la descripción va entera en una sola consulta, sin pedir que se reformatee', async () => {
  const texto = 'mandamos 40 cajas de 60x40x30 de 12 kilos y 15 tambores de 200 litros y también 3 motores de 400 kg'
  const modelo = new ModeloDePrueba([
    respuesta({ nombre: 'cajas', cantidad: 40 }, { nombre: 'tambores', cantidad: 15, entrada: 'tambor-200l' }, { nombre: 'motores', cantidad: 3 }),
  ])
  const resultado = await interpretar(modelo, texto)
  expect(modelo.consultas).toHaveLength(1)
  expect(modelo.consultas[0]!.usuario).toBe(texto)
  expect(resultado.tipo === 'interpretada' && resultado.valor).toHaveLength(3)
})

test('la consulta acota la respuesta y lista todos los ids del catálogo', () => {
  const consulta = armarConsulta('10 cajas')
  expect(consulta.maxTokens).toBe(MAX_TOKENS_RESPUESTA)
  for (const id of ['tambor-200l', 'ibc-1000l', 'bidon-20l', 'europallet', 'pallet-arlog']) expect(consulta.sistema).toContain(`- ${id}:`)
})

test('cada ítem recibe un id propio', async () => {
  const resultado = await interpretar(new ModeloDePrueba([respuesta({ nombre: 'a', cantidad: 1 }, { nombre: 'b', cantidad: 1 })]), 'a y b')
  const ids = resultado.tipo === 'interpretada' ? resultado.valor.map((item) => item.id) : []
  expect(new Set(ids).size).toBe(2)
})
