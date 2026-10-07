import type { Kilos, Milimetros } from '../dominio/tipos'
import type { Fuente } from './fuente'

/**
 * Un tipo de bulto conocido. Cada dato es null cuando la ficha no lo trae: ese campo se le
 * pregunta al usuario con el motivo "entrada-sin-dato" (RF-03, AC-18). Las marcas de RF-06 se
 * precargan solo si la ficha las dice.
 */
export interface EntradaObjeto {
  readonly id: string
  readonly nombre: string
  readonly largo: Milimetros | null
  readonly ancho: Milimetros | null
  readonly alto: Milimetros | null
  readonly peso: Kilos | null
  readonly noApilable: boolean | null
  readonly orientacionObligatoria: boolean | null
  readonly fuente: Fuente
}

// Ninguna entrada trae peso: el de tambores, IBC y bidones depende del contenido, y no hay
// ficha de fabricante para objetos de peso propio, como bolsas de cemento.
export const OBJETOS: readonly EntradaObjeto[] = [
  {
    id: 'tambor-200l',
    nombre: 'tambor de 200 litros',
    // Cilindro de 585 mm de diámetro: va por su caja envolvente.
    largo: 585,
    ancho: 585,
    alto: 877,
    peso: null,
    noApilable: null,
    orientacionObligatoria: null,
    fuente: {
      ficha: 'Greif Israel (Pachmas), Tight Head Steel Drum cylindric series - 216.5L, SKU 9021640040 / 9021650052',
      url: 'https://www.pachmas.com/info/products/metal_drums/01thcyl/216.htm',
      consultada: '2026-10-07',
    },
  },
  {
    id: 'ibc-1000l',
    nombre: 'contenedor IBC de 1000 litros',
    // Alto con el pallet incluido.
    largo: 1200,
    ancho: 1000,
    alto: 1160,
    peso: null,
    noApilable: null,
    orientacionObligatoria: null,
    fuente: {
      ficha: 'SCHÜTZ, Packaging - Specification, ECOBULK MX1000 Std FSSC, Article-No. 4041970',
      url: 'https://cdn.shopify.com/s/files/1/0529/9529/3345/files/4041970.pdf',
      consultada: '2026-10-07',
    },
  },
  {
    id: 'bidon-20l',
    nombre: 'bidón plástico de 20 litros',
    // Alto con la tapa.
    largo: 290,
    ancho: 246,
    alto: 385,
    peso: null,
    noApilable: null,
    orientacionObligatoria: null,
    fuente: {
      ficha: 'Bürkle, HDPE jerrycan 20 l, art. 1427-0020',
      url: 'https://www.buerkle.de/en/hdpe-jerrycan_p1427-0020',
      consultada: '2026-10-07',
    },
  },
  {
    id: 'europallet',
    nombre: 'europallet cargado (1200 × 800)',
    // Como carga va cargado: la ficha da la base; el alto depende de lo que lleva.
    largo: 1200,
    ancho: 800,
    alto: null,
    peso: null,
    noApilable: null,
    orientacionObligatoria: null,
    fuente: {
      ficha: 'EPAL, EPAL Euro pallet (EPAL 1)',
      url: 'https://www.epal-pallets.org/eu-en/load-carriers/epal-euro-pallet',
      consultada: '2026-10-07',
    },
  },
  {
    id: 'pallet-arlog',
    nombre: 'pallet ARLOG o universal cargado (1200 × 1000)',
    // Como carga va cargado: la ficha da la base; el alto depende de lo que lleva.
    largo: 1200,
    ancho: 1000,
    alto: null,
    peso: null,
    noApilable: null,
    orientacionObligatoria: null,
    fuente: {
      ficha: 'Intrapal, PALLET ARLOG',
      url: 'https://intrapal.com.ar/productos/pallet-arlog/',
      consultada: '2026-10-07',
    },
  },
]
