import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Contenedor, Disposicion, ItemListo } from '../dominio/tipos'
import { color } from './colores'
import { agrupar, aristasDeBultos, cantidadesVisibles, PUNTOS_POR_BULTO } from './instancias'

const METROS = 1 / 1000
const COLOR_CONTENEDOR = 0x17283a
const COLOR_PISO = 0xd6d8d2
const COLOR_FONDO = 0xf1f2ee

interface Props {
  readonly disposicion: Disposicion
  readonly items: readonly ItemListo[]
  readonly contenedor: Contenedor
  /** Índice de color por id de ítem, que sobrevive a las ediciones de la lista (AC-09). */
  readonly colores: ReadonlyMap<string, number>
}

/** Lo que hay que tocar para mostrar otro prefijo de la secuencia, sin rearmar la escena. */
interface Prefijo {
  readonly grupos: ReturnType<typeof agrupar>
  /** Una por grupo, en el mismo orden; null si el grupo no tiene bultos colocados. */
  readonly mallas: readonly (THREE.InstancedMesh | null)[]
  readonly contornos: THREE.BufferGeometry
}

function mostrar({ grupos, mallas, contornos }: Prefijo, visibles: number) {
  cantidadesVisibles(grupos, visibles).forEach((cantidad, i) => {
    const malla = mallas[i]
    if (malla) malla.count = cantidad
  })
  contornos.setDrawRange(0, visibles * PUNTOS_POR_BULTO)
}

/** La disposición en 3D navegable (RF-10): una malla instanciada por tipo de ítem (RNF-06). */
export function Vista3D({ disposicion, items, contenedor, colores }: Props) {
  const lienzo = useRef<HTMLDivElement>(null)
  const total = disposicion.colocados.length
  // El control arranca con la carga completa y vuelve a ella con cada disposición nueva.
  const [visibles, setVisibles] = useState(total)
  const [disposicionPrevia, setDisposicionPrevia] = useState(disposicion)
  if (disposicionPrevia !== disposicion) {
    setDisposicionPrevia(disposicion)
    setVisibles(total)
  }
  const prefijo = useRef<Prefijo | null>(null)
  // La escena lee el prefijo al armarse sin depender de él: mover el control no la rearma.
  const visiblesActuales = useRef(visibles)
  visiblesActuales.current = visibles

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

    // Un cubo unitario compartido: cada instancia lo escala al tamaño del bulto.
    const cubo = new THREE.BoxGeometry(1, 1, 1)
    const materiales: THREE.Material[] = []
    const matriz = new THREE.Matrix4()
    const sinRotacion = new THREE.Quaternion()
    const grupos = agrupar(disposicion, items)
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
      })
      malla.instanceMatrix.needsUpdate = true
      escena.add(malla)
      return malla
    })

    // Las aristas de cada bulto separan los del mismo tipo dentro de una pila (RF-10).
    const contornos = new THREE.BufferGeometry()
    contornos.setAttribute('position', new THREE.BufferAttribute(aristasDeBultos(grupos), 3))
    escena.add(
      new THREE.LineSegments(contornos, new THREE.LineBasicMaterial({ color: COLOR_CONTENEDOR, transparent: true, opacity: 0.6 })),
    )
    prefijo.current = { grupos, mallas, contornos }
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
    if (prefijo.current) mostrar(prefijo.current, visibles)
  }, [visibles])

  const ultimo = visibles > 0 ? disposicion.colocados[visibles - 1] : undefined
  const nombreDelUltimo = ultimo && (items.find((item) => item.id === ultimo.item)?.nombre || 'ítem sin nombre')

  return (
    <figure className="vista3d">
      <div
        ref={lienzo}
        className="vista3d__lienzo"
        role="img"
        aria-label={`Disposición en 3D de ${visibles} de ${total} bultos en el ${contenedor.nombre}. Arrastrá para girarla.`}
      />
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
          onChange={(evento) => setVisibles(Number(evento.target.value))}
        />
      </label>
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
