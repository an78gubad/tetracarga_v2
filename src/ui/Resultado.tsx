import type { Preparacion } from '../consolidacion/preparar'
import type { CampoFaltable, Contenedor, Item } from '../dominio/tipos'
import { formatoDecimal, formatoEntero, formatoPorciento } from './formato'

const CAMPO: Record<CampoFaltable, string> = {
  cantidad: 'cantidad',
  largo: 'largo',
  ancho: 'ancho',
  alto: 'alto',
  peso: 'peso',
}

interface Props {
  readonly preparacion: Preparacion
  readonly items: readonly Item[]
  readonly contenedor: Contenedor
}

function Medidor({ titulo, fraccion, detalle }: { titulo: string; fraccion: number; detalle: string }) {
  return (
    <div className="medidor">
      <div className="medidor__cabecera">
        <span>{titulo}</span>
        <strong>{formatoPorciento(fraccion)}</strong>
      </div>
      <div className="medidor__barra" role="img" aria-label={`${titulo}: ${formatoPorciento(fraccion)}`}>
        <div style={{ width: `${Math.min(fraccion, 1) * 100}%` }} />
      </div>
      <span className="medidor__detalle">{detalle}</span>
    </div>
  )
}

/** Qué falta para consolidar, o el informe de la consolidación (RF-09). */
export function Resultado({ preparacion, items, contenedor }: Props) {
  const nombre = (id: string) => items.find((item) => item.id === id)?.nombre || 'ítem sin nombre'

  if (preparacion.estado === 'vacia') {
    return (
      <section className="resultado" aria-labelledby="titulo-resultado">
        <h2 id="titulo-resultado">Resultado</h2>
        <p className="vacio">Cuando la carga tenga todos sus datos, acá vas a ver cuánto entra.</p>
      </section>
    )
  }

  if (preparacion.estado === 'faltan') {
    return (
      <section className="resultado" aria-labelledby="titulo-resultado">
        <h2 id="titulo-resultado">Resultado</h2>
        <p className="aviso">Para consolidar, completá estos datos:</p>
        <ul className="faltantes">
          {preparacion.faltantes.map(({ item, campo }) => (
            <li key={`${item}-${campo}`}>
              {nombre(item)}: {CAMPO[campo]}
            </li>
          ))}
        </ul>
      </section>
    )
  }

  const { consolidacion } = preparacion
  if (!consolidacion.valida) {
    return (
      <section className="resultado" aria-labelledby="titulo-resultado">
        <h2 id="titulo-resultado">Resultado</h2>
        <p className="aviso">
          La disposición calculada no pasó la validación y no se muestra. Es un error del sistema, no de la carga.
        </p>
      </section>
    )
  }

  const { informe } = consolidacion
  const total = informe.bultosColocados + informe.afuera.length
  return (
    <section className="resultado" aria-labelledby="titulo-resultado">
      <h2 id="titulo-resultado">Resultado</h2>
      <p className="resultado__titular">
        {informe.afuera.length === 0
          ? `Entran los ${formatoEntero(total)} bultos.`
          : `Entran ${formatoEntero(informe.bultosColocados)} de ${formatoEntero(total)} bultos.`}
      </p>
      <Medidor titulo="Volumen ocupado" fraccion={informe.aprovechamientoDeVolumen} detalle="del espacio interior" />
      <Medidor
        titulo="Peso cargado"
        fraccion={informe.aprovechamientoDePeso}
        detalle={`${formatoDecimal(informe.pesoColocado)} de ${formatoEntero(contenedor.cargaUtil)} kg de carga útil`}
      />
      {informe.afuera.length > 0 && (
        <>
          <h3>Quedan afuera</h3>
          <ul className="afuera">
            {informe.porItem.flatMap((fila) => [
              fila.afueraPorVolumen > 0 && (
                <li key={`${fila.item}-volumen`}>
                  <strong>{formatoEntero(fila.afueraPorVolumen)}</strong> {nombre(fila.item)}: no hay lugar
                </li>
              ),
              fila.afueraPorPeso > 0 && (
                <li key={`${fila.item}-peso`}>
                  <strong>{formatoEntero(fila.afueraPorPeso)}</strong> {nombre(fila.item)}: superarían la carga útil
                </li>
              ),
            ])}
          </ul>
        </>
      )}
    </section>
  )
}
