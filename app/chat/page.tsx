import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { obtenerMensajesDirectos, marcarMensajesComoLeidos } from '@/app/actions'
import ChatCliente from './ChatCliente'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: Promise<{ con?: string }>
}) {
  const params = await searchParams
  const conIdStr = params?.con || ''
  
  const session = await auth()
  if (!session?.user?.id) return redirect('/login')
  const miId = parseInt(session.user.id)

  // 1. Cargar usuario actual
  const usuarioActual = await prisma.usuario.findUnique({
    where: { id: miId }
  })
  if (!usuarioActual) return redirect('/login')

  const esAdminOTecnico = usuarioActual.rol === 'ADMIN' || usuarioActual.rol === 'TECNICO'

  // 2. Cargar contactos:
  // - Si soy Admin o Técnico: veo a todos los usuarios del ayuntamiento.
  // - Si soy Empleado normal: veo solo a los Administradores y Técnicos del ayuntamiento (Soporte).
  const whereContactos = esAdminOTecnico
    ? { id: { not: miId } } // Todos menos yo
    : { rol: { in: ['ADMIN', 'TECNICO'] }, id: { not: miId } } // Solo Soporte Técnico

  const contactos = await prisma.usuario.findMany({
    where: whereContactos,
    orderBy: { nombre: 'asc' },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      mensajesEnviados: {
        where: {
          destinatarioId: miId,
          leido: false
        },
        select: { id: true }
      }
    }
  })

  // 3. Si hay un contacto seleccionado, cargar mensajes
  let contactoSeleccionado = null
  let mensajes: any[] = []

  if (conIdStr) {
    const conId = parseInt(conIdStr)
    if (!isNaN(conId)) {
      contactoSeleccionado = await prisma.usuario.findUnique({
        where: { id: conId },
        select: { id: true, nombre: true, email: true, rol: true }
      })

      if (contactoSeleccionado) {
        mensajes = await obtenerMensajesDirectos(miId, conId)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/80 via-slate-50 to-blue-50/80 font-sans text-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-64px)]">
        {/* Cabecera del Portal de Chat */}
        <div className="glass flex justify-between items-center p-5 rounded-3xl shadow-sm border border-slate-200 mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💬</span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800">
                Centro de Mensajería Directa
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Conéctate al instante con el equipo del Ayuntamiento
              </p>
            </div>
          </div>
          <Link href="/" className="bg-white/80 border border-slate-200 text-slate-600 hover:bg-white px-4 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 shadow-sm">
            Volver al Dashboard
          </Link>
        </div>

        {/* Módulo Principal del Chat */}
        <div className="glass flex flex-1 rounded-3xl overflow-hidden shadow-xl border border-slate-200/60 min-h-0">
          <ChatCliente
            miId={miId}
            contactos={contactos}
            contactoSeleccionado={contactoSeleccionado}
            mensajesIniciales={mensajes}
          />
        </div>
      </div>
    </div>
  )
}
