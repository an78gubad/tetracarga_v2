import { useMemo, useState } from 'react'
import { CONTENEDORES } from './catalogo/contenedores'
import { preparar } from './consolidacion/preparar'
import { desdeListo, itemNuevo } from './dominio/item'
import type { ContenedorId, Item } from './dominio/tipos'
import { ESCENARIOS } from './escenarios/escenarios'
import { ListaDeItems } from './ui/ListaDeItems'
import { Resultado } from './ui/Resultado'
import { SelectorDeContenedor } from './ui/SelectorDeContenedor'

export function App() {
  const [items, setItems] = useState<readonly Item[]>([])
  const [contenedorId, setContenedorId] = useState<ContenedorId>('20')
  const contenedor = CONTENEDORES[contenedorId]

  // Se recalcula con cada dato confirmado y con cada cambio de contenedor (AC-12, AC-13).
  const preparacion = useMemo(() => preparar(items, contenedor), [items, contenedor])

  const cargarEjemplo = (id: string) => {
    const escenario = ESCENARIOS.find((candidato) => candidato.id === id)
    if (!escenario) return
    setItems(escenario.items.map(desdeListo))
    setContenedorId(escenario.contenedor)
  }

  return (
    <div className="pagina">
      <header className="cabecera">
        <h1>Tetracarga</h1>
        <p>Cargá los bultos, elegí el contenedor y mirá cuánto entra.</p>
        <label className="ejemplo">
          Probar con un ejemplo
          <select value="" onChange={(evento) => cargarEjemplo(evento.target.value)}>
            <option value="" disabled>
              Elegí uno
            </option>
            {ESCENARIOS.map((escenario) => (
              <option key={escenario.id} value={escenario.id}>
                {escenario.nombre}
              </option>
            ))}
          </select>
        </label>
      </header>
      <SelectorDeContenedor elegido={contenedorId} onElegir={setContenedorId} />
      <main className="trabajo">
        <ListaDeItems
          items={items}
          onCambiar={(cambiado) => setItems((actuales) => actuales.map((item) => (item.id === cambiado.id ? cambiado : item)))}
          onEliminar={(id) => setItems((actuales) => actuales.filter((item) => item.id !== id))}
          onAgregar={() => setItems((actuales) => [...actuales, itemNuevo(crypto.randomUUID())])}
        />
        <Resultado preparacion={preparacion} items={items} contenedor={contenedor} />
      </main>
    </div>
  )
}
