import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Contenedor, Disposicion, ItemListo } from '../dominio/tipos'
import { formatoDecimal } from '../ui/formato'
import { alturaDeCaida, PASO_DE_REPRODUCCION_MS } from './caida'
import { color } from './colores'
import { lineasDeGrilla } from './grilla'
import { agrupar, aristasDeBultos, cantidadesVisibles, PUNTOS_POR_BULTO, VALORES_POR_BULTO, type Instancia } from './instancias'

const METROS = 1 / 1000
const COLOR_CONTENEDOR = 0x17283a
const COLOR_PISO = 0xd6d8d2
const COLOR_GRILLA = 0xb4b9b3
const COLOR_FONDO = 0xf1f2ee

interface Props {
  readonly disposicion: Disposicion
  readonly items: readonly ItemListo[]
  readonly contenedor: Contenedor
  /** Índice de color por id de ítem, que sobrevive a las ediciones de la lista (AC-09). */
  readonly colores: ReadonlyMap<string, number>
}

/** Dónde está dibujado cada bulto, por su orden de carga: para moverlo mientras cae. */
interface Ubicacion {
  readonly malla: THREE.InstancedMesh
  readonly indice: number
  readonly instancia: Instancia
}

/** Lo que hay que tocar para mostrar otro prefijo de la secuencia, sin rearmar la escena. */
interface Prefijo {
  readonly grupos: ReturnType<typeof agrupar>
  /** Una por grupo, en el mismo orden; null si el grupo no tiene bultos colocados. */
  readonly mallas: readonly (THREE.InstancedMesh | null)[]
  readonly contornos: THREE.BufferGeometry
  readonly ubicaciones: readonly Ubicacion[]
  /** Las aristas en su lugar, para sumarles la altura de caída sin acumular errores. */
  readonly aristasEnSuLugar: Float32Array
}

function mostrar({ grupos, mallas, contornos }: Prefijo, visibles: number) {
  cantidadesVisibles(grupos, visibles).forEach((cantidad, i) => {
    const malla = mallas[i]
    if (malla) malla.count = cantidad
  })
  contornos.setDrawRange(0, visibles * PUNTOS_POR_BULTO)
}

const matrizDeCaida = new THREE.Matrix4()
const sinRotacion = new THREE.Quaternion()

/** Dibuja el bulto `orden` a `altura` metros sobre su lugar, con sus aristas. */
function elevar({ ubicaciones, contornos, aristasEnSuLugar }: Prefijo, orden: number, altura: number) {
  const ubicacion = ubicaciones[orden]
  if (!ubicacion) return
  const [x, y, z] = ubicacion.instancia.centro
  matrizDeCaida.compose(new THREE.Vector3(x, y + altura, z), sinRotacion, new THREE.Vector3(...ubicacion.instancia.tamano))
  ubicacion.malla.setMatrixAt(ubicacion.indice, matrizDeCaida)
  ubicacion.malla.instanceMatrix.needsUpdate = true
  const posiciones = contornos.getAttribute('position') as THREE.BufferAttribute
  const desde = orden * VALORES_POR_BULTO
  for (let i = desde; i < desde + VALORES_POR_BULTO; i++) {
    posiciones.array[i] = aristasEnSuLugar[i]! + (i % 3 === 1 ? altura : 0)
  }
  posiciones.needsUpdate = true
}

const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** La disposición en 3D navegable (RF-10): una malla instanciada por tipo de ítem (RNF-06). */
export function Vista3D({ disposicion, items, contenedor, colores }: Props) {
  const lienzo = useRef<HTMLDivElement>(null)
  const total = disposicion.colocados.length
  // El control arranca con la carga completa y vuelve a ella con cada disposición nueva.
  const [visibles, setVisibles] = useState(total)
  const [disposicionPrevia, setDisposicionPrevia] = useState(disposicion)
  const [reproduciendo, setReproduciendo] = useState(false)
  if (disposicionPrevia !== disposicion) {
    setDisposicionPrevia(disposicion)
    setVisibles(total)
    setReproduciendo(false)
  }
  const prefijo = useRef<Prefijo | null>(null)
  // La escena lee el prefijo al armarse sin depender de él: mover el control no la rearma.
  const visiblesActuales = useRef(visibles)
  visiblesActuales.current = visibles
  /** El bulto que está cayendo y desde cuándo; uno solo por vez. */
  const caida = useRef<{ readonly orden: number; readonly desde: number } | null>(null)
  const visiblesAnteriores = useRef(visibles)

  useEffect(() => {
    const anfitrion = lienzo.current
    if (!anfitrion) return

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(COLOR_FONDO)
    anfitrion.appendChild(renderer.domElement)

    const escena = new THREE.Scene()
    escena.add(new THREE.HemisphereLight(0xffffff, 0x8a8f88, 2.2))
    const sol = new THREE.DirectionalLight(0xffffff, 1.6)
    sol.position.set(-4, 8, 6)
    escena.add(sol)

    const largo = contenedor.largo * METROS
    const ancho = contenedor.ancho * METROS
    const alto = contenedor.alto * METROS

    // El contenedor: piso y aristas. La puerta queda en x = largo; el ancho va hacia -z.
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(largo, ancho), new THREE.MeshBasicMaterial({ color: COLOR_PISO }))
    piso.rotation.x = -Math.PI / 2
    piso.position.set(largo / 2, 0, -ancho / 2)
    escena.add(piso)
    const aristas = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(largo, alto, ancho)),
      new THREE.LineBasicMaterial({ color: COLOR_CONTENEDOR }),
    )
    aristas.position.set(largo / 2, alto / 2, -ancho / 2)
    escena.add(aristas)
    // La grilla del piso: un draw call fijo, como el piso y las aristas.
    const grilla = new THREE.BufferGeometry()
    grilla.setAttribute('position', new THREE.BufferAttribute(lineasDeGrilla(largo, ancho), 3))
    escena.add(new THREE.LineSegments(grilla, new THREE.LineBasicMaterial({ color: COLOR_GRILLA })))

    // Un cubo unitario compartido: cada instancia lo escala al tamaño del bulto.
    const cubo = new THREE.BoxGeometry(1, 1, 1)
    const materiales: THREE.Material[] = []
    const matriz = new THREE.Matrix4()
    const grupos = agrupar(disposicion, items)
    const ubicaciones: Ubicacion[] = []
    const mallas = grupos.map((grupo) => {
      if (grupo.instancias.length === 0) return null
      // Las caras se corren hacia atrás para que las aristas no titilen contra ellas.
      const material = new THREE.MeshLambertMaterial({
        color: color(colores.get(grupo.item.id) ?? 0),
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      })
      materiales.push(material)
      const malla = new THREE.InstancedMesh(cubo, material, grupo.instancias.length)
      grupo.instancias.forEach((instancia, indice) => {
        matriz.compose(new THREE.Vector3(...instancia.centro), sinRotacion, new THREE.Vector3(...instancia.tamano))
        malla.setMatrixAt(indice, matriz)
        ubicaciones[instancia.orden] = { malla, indice, instancia }
      })
      malla.instanceMatrix.needsUpdate = true
      escena.add(malla)
      return malla
    })

    // Las aristas de cada bulto separan los del mismo tipo dentro de una pila (RF-10).
    const aristasEnSuLugar = aristasDeBultos(grupos)
    const contornos = new THREE.BufferGeometry()
    contornos.setAttribute('position', new THREE.BufferAttribute(aristasEnSuLugar.slice(), 3))
    escena.add(
      new THREE.LineSegments(contornos, new THREE.LineBasicMaterial({ color: COLOR_CONTENEDOR, transparent: true, opacity: 0.6 })),
    )
    prefijo.current = { grupos, mallas, contornos, ubicaciones, aristasEnSuLugar }
    caida.current = null
    mostrar(prefijo.current, visiblesActuales.current)

    const camara = new THREE.PerspectiveCamera(40, 1, 0.1, 200)
    // De costado y desde arriba, corrida hacia la puerta: el largo cruza el cuadro.
    camara.position.set(largo * 0.72, alto * 2.1, largo * 0.62)
    const controles = new OrbitControls(camara, renderer.domElement)
    controles.target.set(largo / 2, alto * 0.35, -ancho / 2)
    controles.enableDamping = true
    controles.update()

    let cuadro = 0
    const dibujar = () => {
      cuadro = requestAnimationFrame(dibujar)
      const enCaida = caida.current
      if (enCaida && prefijo.current) {
        const altura = alturaDeCaida(performance.now() - enCaida.desde)
        elevar(prefijo.current, enCaida.orden, altura)
        if (altura === 0) caida.current = null
      }
      controles.update()
      renderer.render(escena, camara)
    }
    dibujar()

    const ajustar = () => {
      const { clientWidth, clientHeight } = anfitrion
      renderer.setSize(clientWidth, clientHeight)
      camara.aspect = clientWidth / clientHeight
      camara.updateProjectionMatrix()
    }
    const observador = new ResizeObserver(ajustar)
    observador.observe(anfitrion)
    ajustar()

    return () => {
      prefijo.current = null
      cancelAnimationFrame(cuadro)
      observador.disconnect()
      controles.dispose()
      cubo.dispose()
      for (const material of materiales) material.dispose()
      escena.traverse((objeto) => {
        if (objeto instanceof THREE.Mesh || objeto instanceof THREE.LineSegments) {
          objeto.geometry.dispose()
          if (!Array.isArray(objeto.material)) objeto.material.dispose()
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [disposicion, items, contenedor, colores])

  useEffect(() => {
    const anteriores = visiblesAnteriores.current
    visiblesAnteriores.current = visibles
    const actual = prefijo.current
    if (!actual) return
    // Una caída a medio camino termina en su lugar antes de cualquier cambio.
    if (caida.current) {
      elevar(actual, caida.current.orden, 0)
      caida.current = null
    }
    mostrar(actual, visibles)
    // Al sumar bultos cae el último, como una pieza del Tetris; al quitarlos no hay animación.
    if (visibles > anteriores && !sinMovimiento()) {
      caida.current = { orden: visibles - 1, desde: performance.now() }
      elevar(actual, visibles - 1, alturaDeCaida(0))
    }
  }, [visibles])

  useEffect(() => {
    if (!reproduciendo) return
    if (visibles >= total) {
      setReproduciendo(false)
      return
    }
    const siguientePaso = setTimeout(() => setVisibles((actuales) => actuales + 1), PASO_DE_REPRODUCCION_MS)
    return () => clearTimeout(siguientePaso)
  }, [reproduciendo, visibles, total])

  const nombreDe = (id: string) => items.find((item) => item.id === id)?.nombre || 'ítem sin nombre'
  const ultimo = visibles > 0 ? disposicion.colocados[visibles - 1] : undefined
  const nombreDelUltimo = ultimo && nombreDe(ultimo.item)
  const proximo = disposicion.colocados[visibles]
  const itemProximo = proximo && items.find((item) => item.id === proximo.item)
  const metros = (milimetros: number) => formatoDecimal(milimetros / 1000)

  return (
    <figure className="vista3d">
      <div className="vista3d__escenario">
        <div
          ref={lienzo}
          className="vista3d__lienzo"
          role="img"
          aria-label={`Disposición en 3D de ${visibles} de ${total} bultos en el ${contenedor.nombre}. Arrastrá para girarla.`}
        />
        <aside className="siguiente" aria-label="Bulto siguiente de la secuencia">
          <span className="siguiente__titulo">NEXT</span>
          {proximo && itemProximo ? (
            <>
              <span className="siguiente__bloque" style={{ background: color(colores.get(proximo.item) ?? 0) }} aria-hidden="true" />
              <span className="siguiente__nombre">{nombreDe(proximo.item)}</span>
              <span className="siguiente__medidas">
                {metros(itemProximo.largo)} × {metros(itemProximo.ancho)} × {metros(itemProximo.alto)} m
              </span>
            </>
          ) : (
            <span className="siguiente__nombre">Carga completa</span>
          )}
        </aside>
      </div>
      <div className="vista3d__controles">
        <button
          type="button"
          className="boton vista3d__reproducir"
          aria-label={reproduciendo ? 'Pausar la secuencia de carga' : 'Reproducir la secuencia de carga'}
          onClick={() => {
            if (reproduciendo) return setReproduciendo(false)
            if (visibles >= total) setVisibles(0)
            setReproduciendo(true)
          }}
        >
          {reproduciendo ? '❚❚' : '▶'}
        </button>
        <label className="vista3d__secuencia">
          <span>
            Secuencia de carga: <strong>{visibles}</strong> de {total} bultos
            {nombreDelUltimo && <span className="vista3d__ultimo"> · último: {nombreDelUltimo}</span>}
          </span>
          <input
            type="range"
            min={0}
            max={total}
            step={1}
            value={visibles}
            onChange={(evento) => {
              setReproduciendo(false)
              setVisibles(Number(evento.target.value))
            }}
          />
        </label>
      </div>
      <figcaption>
        <ul className="vista3d__leyenda">
          {items.map((item) => (
            <li key={item.id}>
              <span className="vista3d__muestra" style={{ background: color(colores.get(item.id) ?? 0) }} />
              {item.nombre || 'ítem sin nombre'}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
