import type { Faltante } from '../dominio/item'
import type { CampoFaltable, MotivoFaltante } from '../dominio/tipos'

const PREGUNTA: Record<CampoFaltable, string> = {
  cantidad: '¿Cuántos son?',
  largo: '¿Cuánto mide de largo?',
  ancho: '¿Cuánto mide de ancho?',
  alto: '¿Cuánto mide de alto?',
  peso: '¿Cuánto pesa cada uno?',
}

/** RF-03 distingue un ítem que no está en el catálogo de una entrada que no trae el dato. */
const MOTIVO: Record<MotivoFaltante, string> = {
  'sin-entrada': 'No está en el catálogo.',
  'entrada-sin-dato': 'El catálogo no trae este dato.',
  'no-declarado': 'No está declarado.',
}

/** Lo que hay que preguntarle al usuario por un dato faltante, con el porqué. */
export function preguntar({ campo, motivo }: Faltante): { readonly pregunta: string; readonly motivo: string } {
  return { pregunta: PREGUNTA[campo], motivo: MOTIVO[motivo] }
}
