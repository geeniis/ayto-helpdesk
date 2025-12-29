import prisma from '@/lib/prisma'
import Link from 'next/link'
import { auth, signOut } from '@/auth'

// Forzamos que la página se actualice siempre que entres
export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await auth()

  if (!session?.user?.id) return null

  // 1. CARGAMOS LOS DATOS (Hacemos varias consultas paralelas)
  
  // A) Tickets por Estado
  const ticketsAbiertos = await prisma.ticket.findMany({
    where: { estado: 'ABIERTO' },
    include: { creador: true },
    orderBy: { creadoEn: 'desc' }
  })

  const ticketsEnProceso = await prisma.ticket.findMany({
    where: { estado: 'EN_PROCESO' },
    include: { creador: true },
    orderBy: { creadoEn: 'desc' }
  })

  const ticketsResueltos = await prisma.ticket.findMany({
    where: { estado: 'RESUELTO' },
    include: { creador: true },
    orderBy: { creadoEn: 'desc' },
    take: 5 
  })

  // B) Contar Prioridad ALTA (Solo de los que NO están resueltos)
  const totalUrgentes = await prisma.ticket.count({
    where: { 
      prioridad: 'ALTA',
      estado: { not: 'RESUELTO' } 
    }
  })

  // C) Mis Equipos
  const misEquipos = await prisma.equipo.findMany({
    where: { usuarioId: parseInt(session.user.id) }
  })

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      
      {/* --- CABECERA SUPERIOR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-800 flex items-center gap-2">
            🚑 Ayto-HelpDesk
          </h1>
          <p className="text-sm text-gray-500">
            Bienvenido, <span className="font-bold text-gray-700">{session.user.nombre || session.user.email}</span>
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/noticias" className="text-gray-600 hover:text-blue-600 font-medium transition text-sm">
            📰 Noticias
          </Link>
          <Link href="/nuevo" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition font-medium text-sm flex items-center gap-2">
            <span>+</span> Nuevo Ticket
          </Link>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
            <button className="text-red-600 border border-red-200 px-3 py-2 rounded hover:bg-red-50 text-sm transition">
              Salir
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* --- COLUMNA IZQUIERDA: RESUMEN Y EQUIPOS --- */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* TARJETAS DE ESTADÍSTICAS (¡RECUPERADAS!) */}
          <div className="space-y-4">
            {/* Tarjeta Urgentes */}
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Urgentes Activos</p>
                <p className="text-2xl font-bold text-red-600">{totalUrgentes}</p>
              </div>
              <span className="text-2xl">🔥</span>
            </div>

            {/* Tarjeta Pendientes */}
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Pendientes</p>
                <p className="text-2xl font-bold text-blue-600">{ticketsAbiertos.length}</p>
              </div>
              <span className="text-2xl">📥</span>
            </div>

            {/* Tarjeta En Proceso */}
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-400 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">En Marcha</p>
                <p className="text-2xl font-bold text-yellow-600">{ticketsEnProceso.length}</p>
              </div>
              <span className="text-2xl">⚙️</span>
            </div>
          </div>

          {/* LISTA DE EQUIPOS */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3 border-b pb-2 text-sm flex items-center gap-2">
              💻 Mis Dispositivos
            </h3>
            {misEquipos.length === 0 ? (
              <p className="text-xs text-gray-400">Sin equipos asignados.</p>
            ) : (
              <ul className="space-y-3">
                {misEquipos.map((equipo) => (
                  <li key={equipo.id} className="text-sm">
                    <div className="font-semibold text-gray-800">{equipo.tipo}</div>
                    <div className="text-gray-500 text-xs">{equipo.marca} {equipo.modelo}</div>
                    <div className="text-[10px] text-gray-400 font-mono bg-gray-100 inline-block px-1 rounded mt-1">
                      SN: {equipo.numeroSerie || 'S/N'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* --- COLUMNA DERECHA: TABLERO KANBAN (3 COLUMNAS) --- */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 h-fit">
          
          {/* COLUMNA 1: PENDIENTES */}
          <div className="bg-gray-100 rounded-xl p-4 h-full">
            <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase">
              📥 Pendientes
            </h2>
            <div className="space-y-3">
              {ticketsAbiertos.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">Todo limpio ✨</p>}
              {ticketsAbiertos.map(ticket => (
                <Link key={ticket.id} href={`/ticket/${ticket.id}`} className="block bg-white p-3 rounded shadow-sm border-l-4 border-blue-500 hover:shadow-md transition group">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ticket.prioridad === 'ALTA' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                      {ticket.prioridad}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(ticket.creadoEn).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1 group-hover:text-blue-600">{ticket.titulo}</h3>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    👤 {ticket.creador.nombre || 'Usuario'}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* COLUMNA 2: EN PROCESO */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 h-full">
            <h2 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-sm uppercase">
              ⚙️ En Proceso
            </h2>
            <div className="space-y-3">
              {ticketsEnProceso.length === 0 && <p className="text-sm text-blue-300 italic text-center py-4">Nada en curso 💤</p>}
              {ticketsEnProceso.map(ticket => (
                <Link key={ticket.id} href={`/ticket/${ticket.id}`} className="block bg-white p-3 rounded shadow-sm border-l-4 border-yellow-400 hover:shadow-md transition group">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ticket.prioridad === 'ALTA' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                      {ticket.prioridad}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1 group-hover:text-blue-600">{ticket.titulo}</h3>
                  <div className="text-xs text-gray-500">
                    👤 {ticket.creador.nombre}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* COLUMNA 3: RESUELTOS */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-100 h-full opacity-90">
            <h2 className="font-bold text-green-800 mb-4 flex items-center gap-2 text-sm uppercase">
              ✅ Resueltos
            </h2>
            <div className="space-y-3">
              {ticketsResueltos.length === 0 && <p className="text-sm text-green-300 italic text-center py-4">Sin historial 📜</p>}
              {ticketsResueltos.map(ticket => (
                <Link key={ticket.id} href={`/ticket/${ticket.id}`} className="block bg-white/60 p-3 rounded shadow-sm border-l-4 border-green-500 hover:bg-white hover:shadow-md transition hover:opacity-100">
                  <h3 className="font-semibold text-gray-600 text-sm mb-1 line-through">{ticket.titulo}</h3>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{ticket.creador.nombre}</span>
                    <span>✔️ Hecho</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

      </div>
    </main>
  )
}