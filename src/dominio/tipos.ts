/** Longitud entera en milímetros (RF-07). */
export type Milimetros = number

/** Peso en kilos; admite decimales. */
export type Kilos = number

/** Por qué un campo quedó sin valor (RF-03). */
export type MotivoFaltante =
  /** El ítem no tiene entrada en el catálogo. */
  | 'sin-entrada'
  /** La entrada existe pero no trae ese dato. */
  | 'entrada-sin-dato'
  /** La descripción no lo dice y el catálogo no lo completa nunca, como la cantidad. */
  | 'no-declarado'

/** Un dato del ítem, con su origen: lo que dijo el usuario, lo que completó el catálogo o lo que falta. */
export type Campo<T> =
  | { readonly origen: 'declarado'; readonly valor: T }
  | { readonly origen: 'estimado'; readonly valor: T; readonly entrada: string }
  | { readonly origen: 'faltante'; readonly motivo: MotivoFaltante }

/** La cantidad nunca se completa desde el catálogo: si falta, se pregunta (RF-03). */
export type CampoNoEstimable<T> = Exclude<Campo<T>, { origen: 'estimado' }>

/** Una marca de RF-06: viene del catálogo o la pone el usuario, pero nunca falta. */
export type Marca = Exclude<Campo<boolean>, { origen: 'faltante' }>

export interface Item {
  /** Estable mientras el ítem exista: el color se ata a él y no a su posición (RF-10). */
  readonly id: string
  readonly nombre: string
  readonly cantidad: CampoNoEstimable<number>
  readonly largo: Campo<Milimetros>
  readonly ancho: Campo<Milimetros>
  readonly alto: Campo<Milimetros>
  /** Peso unitario. */
  readonly peso: Campo<Kilos>
  readonly noApilable: Marca
  /** Este lado arriba: el alto queda en z; en planta puede girar. */
  readonly orientacionObligatoria: Marca
  /** Lo declara siempre el usuario (RF-06); null es sin límite. */
  readonly pesoMaximoEncima: Kilos | null
}

/** Los campos de un ítem que pueden faltar. */
export type CampoFaltable = 'cantidad' | 'largo' | 'ancho' | 'alto' | 'peso'

/** Un ítem sin nada faltante, listo para consolidar. */
export interface ItemListo {
  readonly id: string
  readonly nombre: string
  readonly cantidad: number
  readonly largo: Milimetros
  readonly ancho: Milimetros
  readonly alto: Milimetros
  readonly peso: Kilos
  readonly noApilable: boolean
  readonly orientacionObligatoria: boolean
  readonly pesoMaximoEncima: Kilos | null
}

export type ContenedorId = '20' | '40' | '40hc'

/** Medidas internas y carga útil (max payload, no peso bruto: RF-05). */
export interface Contenedor {
  readonly id: ContenedorId
  readonly nombre: string
  readonly largo: Milimetros
  readonly ancho: Milimetros
  readonly alto: Milimetros
  readonly cargaUtil: Kilos
}

export type Medida = 'largo' | 'ancho' | 'alto'

/** Qué medida del bulto queda sobre cada eje, en orden x, y, z (RF-07). */
export type Orientacion =
  | readonly ['largo', 'ancho', 'alto']
  | readonly ['ancho', 'largo', 'alto']
  | readonly ['largo', 'alto', 'ancho']
  | readonly ['alto', 'largo', 'ancho']
  | readonly ['ancho', 'alto', 'largo']
  | readonly ['alto', 'ancho', 'largo']

/** Un bulto es una unidad de un ítem: el ítem con cantidad 40 da los bultos 0 a 39. */
export interface Bulto {
  readonly item: string
  readonly indice: number
}

/**
 * Posición de la esquina con x, y, z mínimos. Origen en la esquina del fondo, abajo a la
 * izquierda; x es el largo hacia la puerta, y el ancho, z el alto (RF-07).
 */
export interface BultoColocado extends Bulto {
  readonly x: Milimetros
  readonly y: Milimetros
  readonly z: Milimetros
  readonly orientacion: Orientacion
}

/** Peso si colocarlo superaba la carga máxima; si no, volumen (RF-09). */
export type MotivoAfuera = 'peso' | 'volumen'

export interface BultoAfuera extends Bulto {
  readonly motivo: MotivoAfuera
}

export interface Disposicion {
  readonly contenedor: ContenedorId
  /** En el orden de carga: el control deslizante de RF-10 muestra prefijos de esta lista. */
  readonly colocados: readonly BultoColocado[]
  readonly afuera: readonly BultoAfuera[]
}
