import { useState } from 'react'
import { contarCaracteres, MAX_CARACTERES } from '../dominio/interpretacion'
import type { Item } from '../dominio/tipos'
import { pedirInterpretacion } from '../interpretacion/cliente'
import { resumen } from './aviso'
import { formatoEntero } from './formato'

/** Lo agregado se guarda por id: el aviso se arma con la lista de ahora, no con la de entonces. */
type Aviso = { readonly tipo: 'hecho'; readonly agregados: readonly string[] } | { readonly tipo: 'error'; readonly texto: string }

interface Props {
  /** La carga actual, para que el aviso no quede viejo cuando el usuario completa o elimina. */
  readonly items: readonly Item[]
  readonly onAgregar: (items: readonly Item[]) => void
}

/**
 * La carga descrita en castellano, en un único campo de texto libre (RF-01). Lo interpretado se
 * suma a la lista, donde se puede corregir antes de consolidar (RF-04).
 */
export function Descripcion({ items, onAgregar }: Props) {
  const [texto, setTexto] = useState('')
  const [pidiendo, setPidiendo] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)

  const caracteres = contarCaracteres(texto)
  const excedido = caracteres > MAX_CARACTERES
  const puedeEnviar = !pidiendo && texto.trim() !== '' && !excedido

  const enviar = async () => {
    if (!puedeEnviar) return
    setPidiendo(true)
    setAviso(null)
    const resultado = await pedirInterpretacion(texto)
    setPidiendo(false)
    if (resultado.tipo !== 'interpretada') {
      setAviso({ tipo: 'error', texto: resultado.mensaje })
      return
    }
    if (resultado.items.length === 0) {
      setAviso({ tipo: 'error', texto: 'No encontré bultos en la descripción. Probá nombrar qué mandás y cuántos.' })
      return
    }
    onAgregar(resultado.items)
    setTexto('')
    setAviso({ tipo: 'hecho', agregados: resultado.items.map((item) => item.id) })
  }

  return (
    <section className="descripcion" aria-labelledby="titulo-descripcion">
      <h2 id="titulo-descripcion">¿Qué tenés que mandar?</h2>
      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          void enviar()
        }}
      >
        <textarea
          aria-describedby="contador-descripcion"
          placeholder="Por ejemplo: 40 cajas de 60x40x30 de 12 kilos, 15 tambores de 200 litros y 6 pallets de 1,2 m de alto con 450 kg cada uno"
          rows={3}
          value={texto}
          disabled={pidiendo}
          onChange={(evento) => setTexto(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter' && (evento.ctrlKey || evento.metaKey)) void enviar()
          }}
        />
        <div className="descripcion__pie">
          <span id="contador-descripcion" className="descripcion__contador" data-excedido={excedido}>
            {formatoEntero(caracteres)} de {formatoEntero(MAX_CARACTERES)} caracteres
          </span>
          <button type="submit" className="boton" disabled={!puedeEnviar}>
            {pidiendo ? 'Interpretando…' : 'Agregar a la carga'}
          </button>
        </div>
      </form>
      <p className="descripcion__aviso" data-tipo={aviso?.tipo} role="status">
        {aviso?.tipo === 'hecho' ? resumen(aviso.agregados, items) : aviso?.texto}
      </p>
    </section>
  )
}
