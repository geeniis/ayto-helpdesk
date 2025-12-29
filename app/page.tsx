import prisma from '@/lib/prisma'
import Link from 'next/link'
import { auth, signOut } from '@/auth'
import Filtros from '@/app/components/Filtros' // <--- Usamos el nuevo componente

export const dynamic = 'force-dynamic'

// Definimos los tipos de filtros que esperamos recibir
interface SearchParamsProps {
  searchParams?: Promise<{
    query?: string
    categoria?: string
    prioridad?: string
  }>
}

export default async function Home(props: SearchParamsProps) {
  const params = await props.searchParams;
  const query = params?.query || '';
  const categoria = params?.categoria || '';
  const prioridad = params?.prioridad || '';

  const session = await auth()
  if (!session?.user?.id) return null

  // --- CONSTRUIMOS EL FILTRO DINÁMICO ---
  const whereClause: any = {}

  // 1. Filtro de Texto (Título, Descripción O Nombre de Usuario)
  if (query) {
    whereClause.OR = [
      { titulo: { contains: query } },
      { descripcion: { contains: query } },
      { creador: { nombre: { contains: query } } } // <--- ¡Buscamos también por Usuario!
    ]
  }

  // 2. Filtro de Categoría
  if (categoria) {
    whereClause.categoria = categoria
  }

  // 3. Filtro de Prioridad
  if (prioridad) {
    whereClause.prioridad = prioridad
  }

  // --- CONSULTAS A LA BASE DE DATOS ---
  // Reutilizamos 'whereClause' para que aplique a todas las columnas

  const ticketsAbiertos = await prisma.ticket.findMany({
    where: { estado: 'ABIERTO', ...whereClause },
    include: { creador: true },
    orderBy: { creadoEn: 'desc' }
  })

  const ticketsEnProceso = await prisma.ticket.findMany({
    where: { estado: 'EN_PROCESO', ...whereClause },
    include: { creador: true },
    orderBy: { creadoEn: 'desc' }
  })

  const ticketsResueltos = await prisma.ticket.findMany({
    where: { estado: 'RESUELTO', ...whereClause },
    include: { creador: true },
    orderBy: { creadoEn: 'desc' },
    take: 5 
  })

  const totalUrgentes = await prisma.ticket.count({
    where: { prioridad: 'ALTA', estado: { not: 'RESUELTO' } }
  })

  const misEquipos = await prisma.equipo.findMany({
    where: { usuarioId: parseInt(session.user.id) }
  })

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      
      {/* CABECERA */}
      <div className="flex flex-col xl:flex-row justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-800 flex items-center gap-2">
            🚑 Ayto-HelpDesk
          </h1>
          <p className="text-sm text-gray-500">
            Panel de <span className="font-bold">{session.user.nombre || session.user.email}</span>
          </p>
        </div>

        {/* --- AQUÍ VA LA BARRA DE HERRAMIENTAS --- */}
        <Filtros />

        <div className="flex gap-3 items-center">
          <Link href="/noticias" className="text-gray-600 hover:text-blue-600 font-medium transition text-sm">
            📰 Noticias
          </Link>
          <Link href="/nuevo" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition font-medium text-sm flex items-center gap-2">
            <span>+</span> Nuevo
          </Link>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
            <button className="text-red-600 border border-red-200 px-3 py-2 rounded hover:bg-red-50 text-sm transition">
              Salir
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* COLUMNA IZQUIERDA (Igual que antes...) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Urgentes Activos</p>
                <p className="text-2xl font-bold text-red-600">{totalUrgentes}</p>
              </div>
              <span className="text-2xl">🔥</span>
            </div>
            {/* ... resto de estadísticas ... */}
          </div>

          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
             <h3 className="font-bold text-gray-700 mb-3 border-b pb-2 text-sm">💻 Mis Dispositivos</h3>
             {misEquipos.map(e => (
               <div key={e.id} className="text-sm mb-2">
                 <div className="font-semibold">{e.tipo}</div>
                 <div className="text-xs text-gray-500">{e.marca} {e.modelo}</div>
               </div>
             ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: KANBAN */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 h-fit">
          
          {/* Mostramos la categoría en las tarjetas también */}
          {[
            { titulo: '📥 Pendientes', tickets: ticketsAbiertos, border: 'border-blue-500' },
            { titulo: '⚙️ En Proceso', tickets: ticketsEnProceso, border: 'border-yellow-400' },
            { titulo: '✅ Resueltos', tickets: ticketsResueltos, border: 'border-green-500' }
          ].map((columna) => (
            <div key={columna.titulo} className="bg-gray-100 rounded-xl p-4 h-full">
              <h2 className="font-bold text-gray-700 mb-4 text-sm uppercase">{columna.titulo}</h2>
              <div className="space-y-3">
                {columna.tickets.length === 0 && <p className="text-center text-gray-400 text-xs italic py-4">Sin tickets</p>}
                
                {columna.tickets.map(ticket => (
                  <Link key={ticket.id} href={`/ticket/${ticket.id}`} className={`block bg-white p-3 rounded shadow-sm border-l-4 ${columna.border} hover:shadow-md transition`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ticket.prioridad === 'ALTA' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {ticket.prioridad}
                      </span>
                      {/* Mostramos la categoría en pequeñito */}
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                        {ticket.categoria}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-1">{ticket.titulo}</h3>
                    <div className="text-xs text-gray-500">👤 {ticket.creador.nombre}</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

        </div>
      </div>
    </main>
  )
}