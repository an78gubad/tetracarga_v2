import { CONTENEDORES } from '../catalogo/contenedores'
import type { ContenedorId } from '../dominio/tipos'
import { formatoEntero, formatoMetros } from './formato'

const LARGO_MAXIMO = Math.max(...Object.values(CONTENEDORES).map((contenedor) => contenedor.largo))
const ALTO_MAXIMO = Math.max(...Object.values(CONTENEDORES).map((contenedor) => contenedor.alto))
const ANCHO_DIBUJO = 168
const ESCALA = ANCHO_DIBUJO / LARGO_MAXIMO
const ALTO_DIBUJO = ALTO_MAXIMO * ESCALA

interface Props {
  readonly elegido: ContenedorId
  readonly onElegir: (id: ContenedorId) => void
}

/** Los tres contenedores de perfil, a escala entre sí (RF-05). */
export function SelectorDeContenedor({ elegido, onElegir }: Props) {
  return (
    <fieldset className="selector">
      <legend>Contenedor</legend>
      <div className="selector__opciones">
        {Object.values(CONTENEDORES).map((contenedor) => {
          const ancho = contenedor.largo * ESCALA
          const alto = contenedor.alto * ESCALA
          return (
            <label key={contenedor.id} className="selector__opcion" data-elegido={contenedor.id === elegido}>
              <input
                type="radio"
                name="contenedor"
                value={contenedor.id}
                checked={contenedor.id === elegido}
                onChange={() => onElegir(contenedor.id)}
              />
              <svg
                className="selector__perfil"
                viewBox={`0 0 ${ANCHO_DIBUJO} ${ALTO_DIBUJO}`}
                width={ANCHO_DIBUJO}
                height={ALTO_DIBUJO}
                aria-hidden="true"
              >
                {/* Todos apoyados sobre la misma línea de piso. */}
                <rect x="0.5" y={ALTO_DIBUJO - alto + 0.5} width={ancho - 1} height={alto - 1} rx="1" />
              </svg>
              <span className="selector__nombre">{contenedor.nombre}</span>
              <span className="selector__dato">
                {formatoMetros(contenedor.largo)} × {formatoMetros(contenedor.ancho)} × {formatoMetros(contenedor.alto)} m
              </span>
              <span className="selector__dato">Carga útil {formatoEntero(contenedor.cargaUtil)} kg</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
