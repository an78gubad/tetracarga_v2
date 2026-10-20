import { modeloDesdeEntorno } from '../server/deepseek.js'
import { manejar } from '../server/manejador.js'

/** La función de Vercel: solo envuelve al manejador. Otros métodos los rechaza Vercel con 405. */
export async function POST(pedido: Request): Promise<Response> {
  const { estado, cuerpo } = await manejar(await pedido.text(), () => modeloDesdeEntorno(process.env))
  return Response.json(cuerpo, { status: estado })
}
