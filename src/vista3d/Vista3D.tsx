import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Contenedor, Disposicion, ItemListo } from '../dominio/tipos'
import { color } from './colores'
import { agrupar, aristasDeBultos } from './instancias'

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

/** La disposición en 3D navegable (RF-10): una malla instanciada por tipo de ítem (RNF-06). */
export function Vista3D({ disposicion, items, contenedor, colores }: Props) {
  const lienzo = useRef<HTMLDivElement>(null)

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
    for (const grupo of grupos) {
      if (grupo.instancias.length === 0) continue
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
    }

    // Las aristas de cada bulto separan los del mismo tipo dentro de una pila (RF-10).
    const contornos = new THREE.BufferGeometry()
    contornos.setAttribute('position', new THREE.BufferAttribute(aristasDeBultos(grupos), 3))
    escena.add(
      new THREE.LineSegments(contornos, new THREE.LineBasicMaterial({ color: COLOR_CONTENEDOR, transparent: true, opacity: 0.6 })),
    )

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

  return (
    <figure className="vista3d">
      <div
        ref={lienzo}
        className="vista3d__lienzo"
        role="img"
        aria-label={`Disposición en 3D de ${disposicion.colocados.length} bultos en el ${contenedor.nombre}. Arrastrá para girarla.`}
      />
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
