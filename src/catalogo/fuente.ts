export interface Fuente {
  /** La ficha exacta, como la nombra quien la publica. */
  readonly ficha: string
  readonly url: string
  /** Fecha en que se leyeron los valores. */
  readonly consultada: string
}
