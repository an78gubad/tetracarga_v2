import type { ContenedorId, ItemListo, Kilos, Milimetros } from '../dominio/tipos'

/**
 * Los 10 escenarios de la línea base (RNF-05). Cada uno trae más carga de la que entra, ninguno
 * de sus tipos alcanza solo para llenar el contenedor, y no pasan de 200 bultos (RNF-04). Van
 * calibrados a ~115% de lo que entra: el volumen de la carga ronda 1,15 veces el que el
 * acomodador coloca, sin tipos enteros afuera. La sobrecarga de peso trae ~115% de la carga
 * útil. Medidas y pesos son declarados, como los describiría un usuario.
 *
 * No se tocan para que algo pase: cambiarlos lo decide el usuario.
 */
export interface Escenario {
  readonly id: string
  readonly nombre: string
  readonly contenedor: ContenedorId
  /** Si mide la sobrecarga de peso en vez de la de volumen. */
  readonly sobrecargaDePeso: boolean
  readonly items: readonly ItemListo[]
}

interface Marcas {
  readonly noApilable?: boolean
  readonly orientacionObligatoria?: boolean
  readonly pesoMaximoEncima?: Kilos
}

function item(
  id: string,
  nombre: string,
  cantidad: number,
  [largo, ancho, alto]: readonly [Milimetros, Milimetros, Milimetros],
  peso: Kilos,
  marcas: Marcas = {},
): ItemListo {
  return {
    id,
    nombre,
    cantidad,
    largo,
    ancho,
    alto,
    peso,
    noApilable: marcas.noApilable ?? false,
    orientacionObligatoria: marcas.orientacionObligatoria ?? false,
    pesoMaximoEncima: marcas.pesoMaximoEncima ?? null,
  }
}

export const ESCENARIOS: readonly Escenario[] = [
  {
    id: '01-cajas-mixtas',
    nombre: 'Tres tamaños de caja',
    contenedor: '20',
    sobrecargaDePeso: false,
    items: [
      item('caja-chica', 'cajas chicas', 78, [600, 400, 400], 12),
      item('caja-mediana', 'cajas medianas', 47, [800, 600, 500], 20),
      item('caja-grande', 'cajas grandes', 23, [1000, 800, 600], 35),
    ],
  },
  {
    id: '02-tambores-y-cajas',
    nombre: 'Tambores con orientación obligatoria y cajas',
    contenedor: '20',
    sobrecargaDePeso: false,
    items: [
      item('tambor', 'tambores de 200 litros', 43, [585, 585, 877], 190, { orientacionObligatoria: true }),
      item('caja', 'cajas', 50, [1000, 600, 500], 40),
    ],
  },
  {
    id: '03-fragiles',
    nombre: 'Electrodomésticos frágiles y cajas',
    contenedor: '40',
    sobrecargaDePeso: false,
    items: [
      item('heladera', 'heladeras', 30, [700, 700, 1800], 75, { orientacionObligatoria: true, pesoMaximoEncima: 50 }),
      item('lavarropas', 'lavarropas', 40, [600, 600, 850], 70, { orientacionObligatoria: true, pesoMaximoEncima: 50 }),
      item('caja', 'cajas', 90, [600, 500, 400], 15),
    ],
  },
  {
    id: '04-no-apilables',
    nombre: 'IBC no apilables, bidones y cajas',
    contenedor: '40',
    sobrecargaDePeso: false,
    items: [
      item('ibc', 'contenedores IBC de 1000 litros', 12, [1200, 1000, 1160], 1050, { noApilable: true }),
      item('bidon', 'bidones de 20 litros', 30, [290, 246, 385], 21),
      item('caja', 'cajas', 70, [1000, 600, 600], 30),
    ],
  },
  {
    id: '05-pallets',
    nombre: 'Europallets y pallets ARLOG cargados',
    contenedor: '40',
    sobrecargaDePeso: false,
    items: [
      item('europallet', 'europallets cargados', 18, [1200, 800, 1200], 450),
      item('pallet-arlog', 'pallets ARLOG cargados', 24, [1200, 1000, 1000], 400, { pesoMaximoEncima: 500 }),
    ],
  },
  {
    id: '06-sobrecarga-de-peso',
    nombre: 'Cajas pesadas que superan la carga útil',
    contenedor: '20',
    sobrecargaDePeso: true,
    items: [
      item('pieza', 'cajas de piezas metálicas', 97, [600, 400, 300], 180),
      item('motor', 'cajas de motores', 60, [800, 600, 400], 250),
    ],
  },
  {
    id: '07-altos',
    nombre: 'Bultos altos con orientación obligatoria',
    contenedor: '40hc',
    sobrecargaDePeso: false,
    items: [
      item('tablero', 'tableros eléctricos', 12, [1200, 800, 2500], 300, { orientacionObligatoria: true }),
      item('caja-alta', 'cajas altas', 12, [1000, 1000, 2200], 250, { orientacionObligatoria: true }),
      item('caja', 'cajas', 50, [800, 600, 600], 30),
    ],
  },
  {
    id: '08-doscientos-bultos',
    nombre: '200 cajas de varios tamaños',
    contenedor: '40',
    sobrecargaDePeso: false,
    items: [
      item('caja-grande', 'cajas grandes', 50, [1200, 800, 600], 35),
      item('caja-mediana', 'cajas medianas', 66, [1000, 600, 600], 25),
      item('caja-chica', 'cajas chicas', 84, [600, 500, 400], 18),
    ],
  },
  {
    id: '09-peso-encima',
    nombre: 'Pilas con peso encima que se propaga',
    contenedor: '20',
    sobrecargaDePeso: false,
    items: [
      item('vidrio', 'cajas de vidrio', 60, [600, 500, 400], 20, { pesoMaximoEncima: 40 }),
      item('caja-mediana', 'cajas medianas', 50, [800, 600, 400], 30, { pesoMaximoEncima: 100 }),
      item('caja-pesada', 'cajas pesadas', 25, [1000, 800, 500], 80),
    ],
  },
  {
    id: '10-todo-junto',
    nombre: 'Mezcla con todas las restricciones',
    contenedor: '40hc',
    sobrecargaDePeso: false,
    items: [
      item('tambor', 'tambores de 200 litros', 24, [585, 585, 877], 190, { orientacionObligatoria: true }),
      item('ibc', 'contenedores IBC de 1000 litros', 6, [1200, 1000, 1160], 1050, { noApilable: true }),
      item('heladera', 'heladeras', 14, [700, 700, 1800], 75, { orientacionObligatoria: true, pesoMaximoEncima: 50 }),
      item('europallet', 'europallets cargados', 10, [1200, 800, 1500], 450),
      item('caja', 'cajas', 60, [800, 600, 500], 25),
    ],
  },
]
