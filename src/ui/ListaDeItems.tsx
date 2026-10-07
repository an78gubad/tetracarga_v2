import { useState } from 'react'
import { OBJETOS } from '../catalogo/objetos'
import { editar, limitarPesoEncima, marcar, renombrar, vaciar } from '../dominio/item'
import type { Campo, CampoFaltable, Item, Marca, MotivoFaltante } from '../dominio/tipos'
import { formatoEditable, leerNumero } from './formato'

const NOMBRE_DE_ENTRADA = new Map(OBJETOS.map((entrada) => [entrada.id, entrada.nombre]))

const MOTIVO: Record<MotivoFaltante, string> = {
  'sin-entrada': 'No está en el catálogo',
  'entrada-sin-dato': 'El catálogo no trae este dato',
  'no-declarado': 'Falta',
}

const COLUMNAS: readonly { campo: CampoFaltable; titulo: string; entero: boolean }[] = [
  { campo: 'cantidad', titulo: 'Cantidad', entero: true },
  { campo: 'largo', titulo: 'Largo (mm)', entero: true },
  { campo: 'ancho', titulo: 'Ancho (mm)', entero: true },
  { campo: 'alto', titulo: 'Alto (mm)', entero: true },
  { campo: 'peso', titulo: 'Peso c/u (kg)', entero: false },
]

/** De dónde salió un dato estimado (RF-03, AC-02). */
function origenDe(campo: Campo<unknown> | Marca): string | null {
  return campo.origen === 'estimado' ? `Catálogo: ${NOMBRE_DE_ENTRADA.get(campo.entrada) ?? campo.entrada}` : null
}

interface CampoNumericoProps {
  readonly etiqueta: string
  readonly valor: number | null
  readonly entero: boolean
  readonly estado: 'declarado' | 'estimado' | 'faltante'
  readonly nota: string | null
  readonly onConfirmar: (valor: number | null) => void
}

/** Se confirma al salir del campo o con Enter, para no recalcular la disposición en cada tecla. */
function CampoNumerico({ etiqueta, valor, entero, estado, nota, onConfirmar }: CampoNumericoProps) {
  const [borrador, setBorrador] = useState<string | null>(null)
  const texto = borrador ?? (valor === null ? '' : formatoEditable(valor))
  const leido = leerNumero(texto)
  const invalido = texto.trim() !== '' && (leido === null || leido <= 0 || (entero && !Number.isInteger(leido)))

  const confirmar = () => {
    if (borrador === null) return
    setBorrador(null)
    if (invalido) return
    if (leido !== valor) onConfirmar(leido)
  }

  return (
    <div className="campo" data-estado={estado} data-invalido={invalido}>
      <input
        aria-label={etiqueta}
        inputMode={entero ? 'numeric' : 'decimal'}
        value={texto}
        onChange={(evento) => setBorrador(evento.target.value)}
        onBlur={confirmar}
        onKeyDown={(evento) => {
          if (evento.key === 'Enter') confirmar()
          if (evento.key === 'Escape') setBorrador(null)
        }}
      />
      {invalido ? (
        <span className="campo__nota">{entero ? 'Un entero mayor que 0' : 'Un número mayor que 0'}</span>
      ) : (
        nota && <span className="campo__nota">{nota}</span>
      )}
    </div>
  )
}

interface FilaProps {
  readonly item: Item
  readonly onCambiar: (item: Item) => void
  readonly onEliminar: () => void
}

function FilaDeItem({ item, onCambiar, onEliminar }: FilaProps) {
  const [nombre, setNombre] = useState<string | null>(null)
  const nombreVisible = item.nombre || 'ítem sin nombre'

  return (
    <tr>
      <th scope="row">
        <input
          className="fila__nombre"
          aria-label="Nombre"
          placeholder="Nombre"
          value={nombre ?? item.nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          onBlur={() => {
            if (nombre !== null && nombre !== item.nombre) onCambiar(renombrar(item, nombre.trim()))
            setNombre(null)
          }}
        />
      </th>
      {COLUMNAS.map(({ campo, titulo, entero }) => {
        const dato = item[campo]
        return (
          <td key={campo}>
            <CampoNumerico
              etiqueta={`${titulo} de ${nombreVisible}`}
              valor={dato.origen === 'faltante' ? null : dato.valor}
              entero={entero}
              estado={dato.origen}
              nota={dato.origen === 'faltante' ? MOTIVO[dato.motivo] : origenDe(dato)}
              onConfirmar={(valor) => onCambiar(valor === null ? vaciar(item, campo) : editar(item, campo, valor))}
            />
          </td>
        )
      })}
      <td>
        <CampoNumerico
          etiqueta={`Peso máximo encima de ${nombreVisible}`}
          valor={item.pesoMaximoEncima}
          entero={false}
          estado="declarado"
          nota={item.pesoMaximoEncima === null ? 'Sin límite' : null}
          onConfirmar={(valor) => onCambiar(limitarPesoEncima(item, valor))}
        />
      </td>
      <td>
        <div className="fila__marcas">
          {(
            [
              ['noApilable', 'No apilable'],
              ['orientacionObligatoria', 'Este lado arriba'],
            ] as const
          ).map(([marca, texto]) => (
            <label key={marca} className="marca" data-estado={item[marca].origen} title={origenDe(item[marca]) ?? undefined}>
              <input
                type="checkbox"
                checked={item[marca].valor}
                onChange={(evento) => onCambiar(marcar(item, marca, evento.target.checked))}
              />
              {texto}
            </label>
          ))}
        </div>
      </td>
      <td>
        <button type="button" className="boton-texto" onClick={onEliminar} aria-label={`Eliminar ${nombreVisible}`}>
          Eliminar
        </button>
      </td>
    </tr>
  )
}

interface Props {
  readonly items: readonly Item[]
  readonly onCambiar: (item: Item) => void
  readonly onEliminar: (id: string) => void
  readonly onAgregar: () => void
}

/** La carga, editable antes de consolidar (RF-04, RF-06). */
export function ListaDeItems({ items, onCambiar, onEliminar, onAgregar }: Props) {
  return (
    <section className="carga" aria-labelledby="titulo-carga">
      <h2 id="titulo-carga">Carga</h2>
      {items.length === 0 ? (
        <p className="vacio">Agregá los bultos que tenés que mandar.</p>
      ) : (
        <div className="tabla">
          <table>
            <thead>
              <tr>
                <th scope="col">Ítem</th>
                {COLUMNAS.map(({ campo, titulo }) => (
                  <th key={campo} scope="col">
                    {titulo}
                  </th>
                ))}
                <th scope="col">Máx. encima (kg)</th>
                <th scope="col">Restricciones</th>
                <th scope="col">
                  <span className="solo-lectores">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <FilaDeItem key={item.id} item={item} onCambiar={onCambiar} onEliminar={() => onEliminar(item.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button type="button" className="boton" onClick={onAgregar}>
        Agregar ítem
      </button>
    </section>
  )
}
