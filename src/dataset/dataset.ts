import type { Kilos, Milimetros } from '../dominio/tipos'

/**
 * El dataset de RNF-02: 50 descripciones etiquetadas por ítem, sin casos ambiguos. Los ítems van
 * en el orden en que aparecen en el texto.
 *
 * No se tocan para que el eval llegue: cambiarlas lo decide el usuario.
 */
export interface ItemEtiquetado {
  /** Como lo nombra el texto; sirve para leer el dataset, no se mide. */
  readonly nombre: string
  /** null: la descripción no la dice y hay que preguntarla (RF-03). */
  readonly cantidad: number | null
  /**
   * Lo que la descripción dice, ya normalizado (RF-02): milímetros enteros, peso unitario en
   * kilos. Un campo ausente acá tiene que salir del catálogo o preguntarse.
   */
  readonly declarados: {
    readonly largo?: Milimetros
    readonly ancho?: Milimetros
    readonly alto?: Milimetros
    readonly peso?: Kilos
  }
  /** La entrada del catálogo que corresponde, o null si ninguna. */
  readonly entrada: string | null
}

export interface Descripcion {
  readonly id: string
  readonly texto: string
  readonly items: readonly ItemEtiquetado[]
}

export const DATASET: readonly Descripcion[] = [
  {
    id: 'd01',
    texto: '40 cajas de 60x40x30 de 12 kilos y 15 tambores de 200 litros',
    items: [
      { nombre: 'cajas', cantidad: 40, declarados: { largo: 600, ancho: 400, alto: 300, peso: 12 }, entrada: null },
      { nombre: 'tambores de 200 litros', cantidad: 15, declarados: {}, entrada: 'tambor-200l' },
    ],
  },
  {
    id: 'd02',
    texto: 'cajas de 60x40x30 de 12 kilos',
    items: [
      { nombre: 'cajas', cantidad: null, declarados: { largo: 600, ancho: 400, alto: 300, peso: 12 }, entrada: null },
    ],
  },
  {
    id: 'd03',
    texto:
      'Mandamos 20 heladeras de 70 por 70 por 180 centímetros, 75 kilos cada una, y 12 lavarropas de 60x60x85 de 68 kg',
    items: [
      { nombre: 'heladeras', cantidad: 20, declarados: { largo: 700, ancho: 700, alto: 1800, peso: 75 }, entrada: null },
      { nombre: 'lavarropas', cantidad: 12, declarados: { largo: 600, ancho: 600, alto: 850, peso: 68 }, entrada: null },
    ],
  },
  {
    id: 'd04',
    texto: 'Tengo 8 IBC de 1000 litros con 1050 kg cada uno y 50 bidones de 20 litros de 21 kilos',
    items: [
      { nombre: 'IBC de 1000 litros', cantidad: 8, declarados: { peso: 1050 }, entrada: 'ibc-1000l' },
      { nombre: 'bidones de 20 litros', cantidad: 50, declarados: { peso: 21 }, entrada: 'bidon-20l' },
    ],
  },
  {
    id: 'd05',
    texto: '10 europallets cargados de 1,5 m de alto, 600 kilos cada uno',
    items: [{ nombre: 'europallets', cantidad: 10, declarados: { alto: 1500, peso: 600 }, entrada: 'europallet' }],
  },
  {
    id: 'd06',
    texto: '6 pallets universales de 1,2 metros de alto y 450 kg',
    items: [
      { nombre: 'pallets universales', cantidad: 6, declarados: { alto: 1200, peso: 450 }, entrada: 'pallet-arlog' },
    ],
  },
  {
    id: 'd07',
    texto: '3 motores eléctricos de 1,2 x 0,8 x 0,9 m que pesan 400 kilos cada uno',
    items: [
      { nombre: 'motores eléctricos', cantidad: 3, declarados: { largo: 1200, ancho: 800, alto: 900, peso: 400 }, entrada: null },
    ],
  },
  {
    id: 'd08',
    texto: '25 bolsas de cemento de 50 kilos',
    items: [{ nombre: 'bolsas de cemento', cantidad: 25, declarados: { peso: 50 }, entrada: null }],
  },
  {
    id: 'd09',
    texto:
      'Hay que cargar 100 cajas de zapatos de 35x25x15 cm, 2,5 kg cada una, y 30 cajas grandes de 80x60x60 de 22 kilos',
    items: [
      { nombre: 'cajas de zapatos', cantidad: 100, declarados: { largo: 350, ancho: 250, alto: 150, peso: 2.5 }, entrada: null },
      { nombre: 'cajas grandes', cantidad: 30, declarados: { largo: 800, ancho: 600, alto: 600, peso: 22 }, entrada: null },
    ],
  },
  {
    id: 'd10',
    texto:
      'Son 18 tambores de 200 litros de aceite, de 190 kg cada uno, y 40 cajas de 50x40x40 que pesan 480 kilos en total',
    items: [
      { nombre: 'tambores de 200 litros', cantidad: 18, declarados: { peso: 190 }, entrada: 'tambor-200l' },
      { nombre: 'cajas', cantidad: 40, declarados: { largo: 500, ancho: 400, alto: 400, peso: 12 }, entrada: null },
    ],
  },
  {
    id: 'd11',
    texto: '4 rollos de tela de 1,6 m de largo por 40 cm de ancho y 40 cm de alto, de 60 kg',
    items: [
      { nombre: 'rollos de tela', cantidad: 4, declarados: { largo: 1600, ancho: 400, alto: 400, peso: 60 }, entrada: null },
    ],
  },
  {
    id: 'd12',
    texto: '12 sillones',
    items: [{ nombre: 'sillones', cantidad: 12, declarados: {}, entrada: null }],
  },
  {
    id: 'd13',
    texto: 'Mandamos 30 bidones de 20 litros, 10 tambores de 200 litros y 5 IBC de 1000 litros, todo con agua destilada',
    items: [
      { nombre: 'bidones de 20 litros', cantidad: 30, declarados: {}, entrada: 'bidon-20l' },
      { nombre: 'tambores de 200 litros', cantidad: 10, declarados: {}, entrada: 'tambor-200l' },
      { nombre: 'IBC de 1000 litros', cantidad: 5, declarados: {}, entrada: 'ibc-1000l' },
    ],
  },
  {
    id: 'd14',
    texto: '200 cajas de 30x30x30 de 8 kilos',
    items: [
      { nombre: 'cajas', cantidad: 200, declarados: { largo: 300, ancho: 300, alto: 300, peso: 8 }, entrada: null },
    ],
  },
  {
    id: 'd15',
    texto:
      '2 máquinas de coser industriales de 120 cm x 60 cm x 130 cm, 90 kg cada una, y 1 compresor de 900 x 600 x 800 mm de 150 kg',
    items: [
      { nombre: 'máquinas de coser industriales', cantidad: 2, declarados: { largo: 1200, ancho: 600, alto: 1300, peso: 90 }, entrada: null },
      { nombre: 'compresor', cantidad: 1, declarados: { largo: 900, ancho: 600, alto: 800, peso: 150 }, entrada: null },
    ],
  },
  {
    id: 'd16',
    texto: '16 tambores de 50 litros de 55 kilos',
    items: [{ nombre: 'tambores de 50 litros', cantidad: 16, declarados: { peso: 55 }, entrada: null }],
  },
  {
    id: 'd17',
    texto: 'cajas de vino, 120 en total, de 34x26x18 y 9 kilos cada una',
    items: [
      { nombre: 'cajas de vino', cantidad: 120, declarados: { largo: 340, ancho: 260, alto: 180, peso: 9 }, entrada: null },
    ],
  },
  {
    id: 'd18',
    texto:
      'Tengo que mandar 7 europallets de 1,8 metros de alto con 520 kg y 7 pallets universales de 1,5 m de alto con 480 kg',
    items: [
      { nombre: 'europallets', cantidad: 7, declarados: { alto: 1800, peso: 520 }, entrada: 'europallet' },
      { nombre: 'pallets universales', cantidad: 7, declarados: { alto: 1500, peso: 480 }, entrada: 'pallet-arlog' },
    ],
  },
  {
    id: 'd19',
    texto: '15 bidones de 10 litros de 11 kilos',
    items: [{ nombre: 'bidones de 10 litros', cantidad: 15, declarados: { peso: 11 }, entrada: null }],
  },
  {
    id: 'd20',
    texto:
      'Van 60 cajas de 40x30x30 de 10 kilos, 25 cajas de 60x50x40 de 18 kilos y 10 cajas de 100x80x60 de 40 kilos',
    items: [
      { nombre: 'cajas de 40x30x30', cantidad: 60, declarados: { largo: 400, ancho: 300, alto: 300, peso: 10 }, entrada: null },
      { nombre: 'cajas de 60x50x40', cantidad: 25, declarados: { largo: 600, ancho: 500, alto: 400, peso: 18 }, entrada: null },
      { nombre: 'cajas de 100x80x60', cantidad: 10, declarados: { largo: 1000, ancho: 800, alto: 600, peso: 40 }, entrada: null },
    ],
  },
  {
    id: 'd21',
    texto: '8 heladeras',
    items: [{ nombre: 'heladeras', cantidad: 8, declarados: {}, entrada: null }],
  },
  {
    id: 'd22',
    texto: 'Un tablero eléctrico de 120x80x250 cm de 300 kilos',
    items: [
      { nombre: 'tablero eléctrico', cantidad: 1, declarados: { largo: 1200, ancho: 800, alto: 2500, peso: 300 }, entrada: null },
    ],
  },
  {
    id: 'd23',
    texto: '40 bolsas de harina de 25 kg y 20 cajas de 50x30x30 de 7 kilos',
    items: [
      { nombre: 'bolsas de harina', cantidad: 40, declarados: { peso: 25 }, entrada: null },
      { nombre: 'cajas', cantidad: 20, declarados: { largo: 500, ancho: 300, alto: 300, peso: 7 }, entrada: null },
    ],
  },
  {
    id: 'd24',
    texto: 'IBC de 1000 litros con 1000 kilos cada uno',
    items: [{ nombre: 'IBC de 1000 litros', cantidad: null, declarados: { peso: 1000 }, entrada: 'ibc-1000l' }],
  },
  {
    id: 'd25',
    texto: '22 tambores de 200 litros de 210 kilos y 6 motores de 1 m x 70 cm x 80 cm de 350 kg',
    items: [
      { nombre: 'tambores de 200 litros', cantidad: 22, declarados: { peso: 210 }, entrada: 'tambor-200l' },
      { nombre: 'motores', cantidad: 6, declarados: { largo: 1000, ancho: 700, alto: 800, peso: 350 }, entrada: null },
    ],
  },
  {
    id: 'd26',
    texto: '35 cajas de 45x35x40 que pesan en total 700 kilos',
    items: [
      { nombre: 'cajas', cantidad: 35, declarados: { largo: 450, ancho: 350, alto: 400, peso: 20 }, entrada: null },
    ],
  },
  {
    id: 'd27',
    texto: '5 cocinas de 76x60x90 de 55 kg, 5 heladeras de 60x65x170 de 62 kg y 5 microondas',
    items: [
      { nombre: 'cocinas', cantidad: 5, declarados: { largo: 760, ancho: 600, alto: 900, peso: 55 }, entrada: null },
      { nombre: 'heladeras', cantidad: 5, declarados: { largo: 600, ancho: 650, alto: 1700, peso: 62 }, entrada: null },
      { nombre: 'microondas', cantidad: 5, declarados: {}, entrada: null },
    ],
  },
  {
    id: 'd28',
    texto: '12 europallets de 1,4 m de alto',
    items: [{ nombre: 'europallets', cantidad: 12, declarados: { alto: 1400 }, entrada: 'europallet' }],
  },
  {
    id: 'd29',
    texto: '90 bidones de 20 litros de 20,5 kilos cada uno',
    items: [{ nombre: 'bidones de 20 litros', cantidad: 90, declarados: { peso: 20.5 }, entrada: 'bidon-20l' }],
  },
  {
    id: 'd30',
    texto: '3 cajones de madera de 2 x 1,2 x 1 metros, 800 kilos cada uno',
    items: [
      { nombre: 'cajones de madera', cantidad: 3, declarados: { largo: 2000, ancho: 1200, alto: 1000, peso: 800 }, entrada: null },
    ],
  },
  {
    id: 'd31',
    texto: '48 cajas de 40x40x40 de 15 kilos y 48 cajas de 60x40x40 de 20 kilos',
    items: [
      { nombre: 'cajas de 40x40x40', cantidad: 48, declarados: { largo: 400, ancho: 400, alto: 400, peso: 15 }, entrada: null },
      { nombre: 'cajas de 60x40x40', cantidad: 48, declarados: { largo: 600, ancho: 400, alto: 400, peso: 20 }, entrada: null },
    ],
  },
  {
    id: 'd32',
    texto: 'Tengo 10 tambores de 200 litros vacíos de 18 kilos',
    items: [{ nombre: 'tambores de 200 litros', cantidad: 10, declarados: { peso: 18 }, entrada: 'tambor-200l' }],
  },
  {
    id: 'd33',
    texto: '20 bobinas de papel de 100 cm de diámetro y 120 cm de alto, de 500 kg',
    items: [
      // Un cilindro va por su caja envolvente: el diámetro es el largo y el ancho.
      { nombre: 'bobinas de papel', cantidad: 20, declarados: { largo: 1000, ancho: 1000, alto: 1200, peso: 500 }, entrada: null },
    ],
  },
  {
    id: 'd34',
    texto: '6 IBC de 1000 litros y 30 cajas de 1 m x 80 cm x 60 cm de 35 kilos',
    items: [
      { nombre: 'IBC de 1000 litros', cantidad: 6, declarados: {}, entrada: 'ibc-1000l' },
      { nombre: 'cajas', cantidad: 30, declarados: { largo: 1000, ancho: 800, alto: 600, peso: 35 }, entrada: null },
    ],
  },
  {
    id: 'd35',
    texto: 'Son 150 cajas de 25x20x15 de 3 kilos',
    items: [
      { nombre: 'cajas', cantidad: 150, declarados: { largo: 250, ancho: 200, alto: 150, peso: 3 }, entrada: null },
    ],
  },
  {
    id: 'd36',
    texto: '4 pallets universales con 400 kg cada uno',
    items: [{ nombre: 'pallets universales', cantidad: 4, declarados: { peso: 400 }, entrada: 'pallet-arlog' }],
  },
  {
    id: 'd37',
    texto:
      'Mandamos 2 grupos electrógenos de 2,2 x 1 x 1,4 m de 1200 kg y 8 tambores de 200 litros de gasoil de 175 kilos',
    items: [
      { nombre: 'grupos electrógenos', cantidad: 2, declarados: { largo: 2200, ancho: 1000, alto: 1400, peso: 1200 }, entrada: null },
      { nombre: 'tambores de 200 litros', cantidad: 8, declarados: { peso: 175 }, entrada: 'tambor-200l' },
    ],
  },
  {
    id: 'd38',
    texto: '25 sillas de 45x50x90 de 6 kg y 5 mesas de 160x90x75 de 40 kg',
    items: [
      { nombre: 'sillas', cantidad: 25, declarados: { largo: 450, ancho: 500, alto: 900, peso: 6 }, entrada: null },
      { nombre: 'mesas', cantidad: 5, declarados: { largo: 1600, ancho: 900, alto: 750, peso: 40 }, entrada: null },
    ],
  },
  {
    id: 'd39',
    texto: '70 cajas de 50x50x50',
    items: [{ nombre: 'cajas', cantidad: 70, declarados: { largo: 500, ancho: 500, alto: 500 }, entrada: null }],
  },
  {
    id: 'd40',
    texto: '18 bidones de 20 litros y 18 cajas de 30x20x20 de 4 kilos',
    items: [
      { nombre: 'bidones de 20 litros', cantidad: 18, declarados: {}, entrada: 'bidon-20l' },
      { nombre: 'cajas', cantidad: 18, declarados: { largo: 300, ancho: 200, alto: 200, peso: 4 }, entrada: null },
    ],
  },
  {
    id: 'd41',
    texto: 'Un tanque de agua de 1,1 m de diámetro y 1,3 m de alto, de 45 kg',
    items: [
      // Un cilindro va por su caja envolvente: el diámetro es el largo y el ancho.
      { nombre: 'tanque de agua', cantidad: 1, declarados: { largo: 1100, ancho: 1100, alto: 1300, peso: 45 }, entrada: null },
    ],
  },
  {
    id: 'd42',
    texto: '40 cajas de 0,6 x 0,4 x 0,4 metros de 14 kg',
    items: [
      { nombre: 'cajas', cantidad: 40, declarados: { largo: 600, ancho: 400, alto: 400, peso: 14 }, entrada: null },
    ],
  },
  {
    id: 'd43',
    texto: '9 europallets y 9 pallets universales, todos de 1,6 m de alto y 550 kg',
    items: [
      { nombre: 'europallets', cantidad: 9, declarados: { alto: 1600, peso: 550 }, entrada: 'europallet' },
      { nombre: 'pallets universales', cantidad: 9, declarados: { alto: 1600, peso: 550 }, entrada: 'pallet-arlog' },
    ],
  },
  {
    id: 'd44',
    texto:
      '12 tambores de 200 litros de 200 kilos, 4 IBC de 1000 litros de 1100 kilos y 40 bidones de 20 litros de 22 kilos',
    items: [
      { nombre: 'tambores de 200 litros', cantidad: 12, declarados: { peso: 200 }, entrada: 'tambor-200l' },
      { nombre: 'IBC de 1000 litros', cantidad: 4, declarados: { peso: 1100 }, entrada: 'ibc-1000l' },
      { nombre: 'bidones de 20 litros', cantidad: 40, declarados: { peso: 22 }, entrada: 'bidon-20l' },
    ],
  },
  {
    id: 'd45',
    texto: '100 cajas de 40x30x20 de 6 kilos y 2 heladeras de 70x70x180',
    items: [
      { nombre: 'cajas', cantidad: 100, declarados: { largo: 400, ancho: 300, alto: 200, peso: 6 }, entrada: null },
      { nombre: 'heladeras', cantidad: 2, declarados: { largo: 700, ancho: 700, alto: 1800 }, entrada: null },
    ],
  },
  {
    id: 'd46',
    texto: 'Tengo 30 televisores en caja de 120x20x75 cm, de 18 kg',
    items: [
      { nombre: 'televisores en caja', cantidad: 30, declarados: { largo: 1200, ancho: 200, alto: 750, peso: 18 }, entrada: null },
    ],
  },
  {
    id: 'd47',
    texto: '50 cajas de 600 x 400 x 300 milímetros de 11 kilos',
    items: [
      { nombre: 'cajas', cantidad: 50, declarados: { largo: 600, ancho: 400, alto: 300, peso: 11 }, entrada: null },
    ],
  },
  {
    id: 'd48',
    texto: 'Van 14 bicicletas en caja de 140x25x80 de 16 kilos cada una y 6 cintas de correr',
    items: [
      { nombre: 'bicicletas en caja', cantidad: 14, declarados: { largo: 1400, ancho: 250, alto: 800, peso: 16 }, entrada: null },
      { nombre: 'cintas de correr', cantidad: 6, declarados: {}, entrada: null },
    ],
  },
  {
    id: 'd49',
    texto: '4 tambores de 200 litros, 760 kilos en total',
    items: [{ nombre: 'tambores de 200 litros', cantidad: 4, declarados: { peso: 190 }, entrada: 'tambor-200l' }],
  },
  {
    id: 'd50',
    texto:
      'Mandamos 60 cajas de 50x40x30 de 9 kilos, 20 bidones de 20 litros de 21 kg, 10 tambores de 200 litros y 2 motores de 80x60x70 cm de 250 kilos',
    items: [
      { nombre: 'cajas', cantidad: 60, declarados: { largo: 500, ancho: 400, alto: 300, peso: 9 }, entrada: null },
      { nombre: 'bidones de 20 litros', cantidad: 20, declarados: { peso: 21 }, entrada: 'bidon-20l' },
      { nombre: 'tambores de 200 litros', cantidad: 10, declarados: {}, entrada: 'tambor-200l' },
      { nombre: 'motores', cantidad: 2, declarados: { largo: 800, ancho: 600, alto: 700, peso: 250 }, entrada: null },
    ],
  },
]
