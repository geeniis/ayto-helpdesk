import prisma from '@/lib/prisma'
import Link from 'next/link'
import { auth, signOut } from '@/auth'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await auth()

  if (!session?.user?.id) return null

  // 1. Buscamos los tickets (como antes)
  const tickets = await prisma.ticket.findMany({
    include: { creador: true },
    orderBy: { creadoEn: 'desc' }
  })

  // 2. NUEVO: Buscamos los equipos asignados a ESTE usuario
  const misEquipos = await prisma.equipo.findMany({
    where: {
      usuarioId: parseInt(session.user.id)
    }
  })

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      
      {/* CABECERA */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-blue-800">🚑 Ayto-HelpDesk</h1>
          <p className="text-sm text-gray-500">
            Usuario: <span className="font-bold">{session.user.email}</span>
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/nuevo" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
            + Nuevo Ticket
          </Link>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
            <button className="text-red-600 border border-red-200 px-3 py-2 rounded hover:bg-red-50 text-sm">
              Salir
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* COLUMNA IZQUIERDA: MIS DISPOSITIVOS (NUEVO) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3 border-b pb-2">💻 Mis Dispositivos</h3>
            {misEquipos.length === 0 ? (
              <p className="text-sm text-gray-400">No tienes equipos asignados.</p>
            ) : (
              <ul className="space-y-3">
                {misEquipos.map((equipo) => (
                  <li key={equipo.id} className="text-sm">
                    <div className="font-semibold text-gray-800">{equipo.tipo}</div>
                    <div className="text-gray-500">{equipo.marca} {equipo.modelo}</div>
                    <div className="text-xs text-gray-400 font-mono bg-gray-100 inline-block px-1 rounded mt-1">
                      SN: {equipo.numeroSerie || 'S/N'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: TICKETS (LO DE ANTES) */}
        <div className="lg:col-span-3">
          <h3 className="font-bold text-gray-700 mb-4">Incidencias Recientes</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <Link href={`/ticket/${ticket.id}`} className="hover:underline">
                      <h2 className="text-lg font-semibold text-blue-900">{ticket.titulo}</h2>
                  </Link>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                    ticket.prioridad === 'ALTA' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {ticket.prioridad}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ticket.descripcion}</p>
                <div className="text-xs text-gray-400 flex justify-between items-center pt-2 border-t">
                  <span>{ticket.creador.nombre}</span>
                  <span className="uppercase font-semibold">{ticket.estado}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}