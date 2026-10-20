import { useState } from 'react'
import { faltantes } from '../dominio/item'
import { contarCaracteres, MAX_CARACTERES } from '../dominio/interpretacion'
import type { Item } from '../dominio/tipos'
import { pedirInterpretacion } from '../interpretacion/cliente'
import { formatoEntero } from './formato'

type Aviso = { readonly tipo: 'hecho' | 'error'; readonly texto: string }

interface Props {
  readonly onAgregar: (items: readonly Item[]) => void
}

function resumen(items: readonly Item[]): string {
  const agregados = items.length === 1 ? 'Agregué 1 ítem a la carga.' : `Agregué ${items.length} ítems a la carga.`
  const conFaltantes = items.filter((item) => faltantes(item).length > 0).length
  if (conFaltantes === 0) return agregados
  return `${agregados} ${conFaltantes === 1 ? 'A uno le faltan datos' : `A ${conFaltantes} les faltan datos`}: están marcados en rojo.`
}

/**
 * La carga descrita en castellano, en un único campo de texto libre (RF-01). Lo interpretado se
 * suma a la lista, donde se puede corregir antes de consolidar (RF-04).
 */
export function Descripcion({ onAgregar }: Props) {
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
    setAviso({ tipo: 'hecho', texto: resumen(resultado.items) })
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
        {aviso?.texto}
      </p>
    </section>
  )
}
