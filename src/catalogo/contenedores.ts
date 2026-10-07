import type { Contenedor, ContenedorId } from '../dominio/tipos'
import type { Fuente } from './fuente'

export interface EntradaContenedor extends Contenedor {
  readonly fuente: Fuente
}

// Las navieras no coinciden al milímetro y avisan que las medidas varían por unidad: todas las
// entradas salen de las fichas de Maersk, sin mezclar fuentes.
const GUIA_MAERSK = 'https://www.maersk.com/industry-sectors/dry-cargo'

export const CONTENEDORES: Readonly<Record<ContenedorId, EntradaContenedor>> = {
  '20': {
    id: '20',
    nombre: "20' estándar",
    largo: 5898,
    ancho: 2352,
    alto: 2393,
    cargaUtil: 28300,
    fuente: {
      ficha: "Maersk, Dry Cargo, Container specifications: 20' Standard - Steel",
      url: GUIA_MAERSK,
      consultada: '2026-10-07',
    },
  },
  '40': {
    id: '40',
    nombre: "40' estándar",
    largo: 12032,
    ancho: 2352,
    alto: 2393,
    cargaUtil: 28870,
    fuente: {
      ficha: "Maersk, Dry Cargo, Container specifications: 40' Standard - Steel",
      url: GUIA_MAERSK,
      consultada: '2026-10-07',
    },
  },
  '40hc': {
    id: '40hc',
    nombre: "40' high cube",
    largo: 12032,
    ancho: 2352,
    alto: 2698,
    cargaUtil: 28690,
    fuente: {
      ficha: "Maersk, Dry Cargo, Container specifications: 40' High Cube - Steel",
      url: GUIA_MAERSK,
      consultada: '2026-10-07',
    },
  },
}
