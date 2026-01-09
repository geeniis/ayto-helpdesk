import prisma from '@/lib/prisma'
import Link from 'next/link'
import { auth, signOut } from '@/auth'
import Filtros from '@/app/components/Filtros'
import Notificaciones from '@/app/components/Notificaciones'
import Pagination from '@/app/components/Pagination'
import LanguageSwitch from '@/app/components/LanguageSwitch'
import { getDiccionario } from '@/lib/diccionario' // <--- IMPORTAMOS LA MAGIA (COOKIES)

export const dynamic = 'force-dynamic'

interface SearchParamsProps {
  searchParams?: Promise<{
    query?: string
    categoria?: string
    prioridad?: string
    page?: string
    // lang?: string  <--- YA NO NECESITAMOS ESTO AQUÍ
  }>
}

const TICKETS_POR_PAGINA = 9 

export default async function Home(props: SearchParamsProps) {
  const params = await props.searchParams;
  
  // 1. CARGA AUTOMÁTICA DE IDIOMA (COOKIES)
  // getDiccionario lee la cookie y nos devuelve 't' (textos) y 'lang' (código 'es'/'ca')
  const { t, lang } = await getDiccionario() as { t: any, lang: 'es' | 'ca' }

  const query = params?.query || '';
  const categoria = params?.categoria || '';
  const prioridad = params?.prioridad || '';
  
  // 2. LÓGICA DE PAGINACIÓN
  const paginaActual = Number(params?.page) || 1
  const skip = (paginaActual - 1) * TICKETS_POR_PAGINA

  const session = await auth()
  if (!session?.user?.id) return null

  const usuarioActual = await prisma.usuario.findUnique({
    where: { id: parseInt(session.user.id) }
  })
  if (!usuarioActual) return null

  const esAdmin = usuarioActual.rol === 'ADMIN'

  // 3. CONSTRUIR FILTROS (WHERE)
  const whereClause: any = {}

  // Filtro de Seguridad
  if (!esAdmin) {
    whereClause.creadorId = usuarioActual.id
  }

  // Filtros de Búsqueda
  if (query) {
    whereClause.OR = [
      { titulo: { contains: query } },
      { descripcion: { contains: query } },
      { creador: { nombre: { contains: query } } }
    ]
  }
  if (categoria) whereClause.categoria = categoria
  if (prioridad) whereClause.prioridad = prioridad

  // 4. CONSULTAS A LA BASE DE DATOS
  
  // A) Notificaciones
  const misNotificaciones = await prisma.notificacion.findMany({
    where: { usuarioId: usuarioActual.id },
    orderBy: { creadoEn: 'desc' },
    take: 10
  })

  // B) Tickets (Paginados y Filtrados)
  const ticketsAbiertos = await prisma.ticket.findMany({
    where: { estado: 'ABIERTO', ...whereClause },
    include: { creador: true },
    orderBy: { creadoEn: 'desc' },
    take: TICKETS_POR_PAGINA,
    skip: skip
  })

  const ticketsEnProceso = await prisma.ticket.findMany({
    where: { estado: 'EN_PROCESO', ...whereClause },
    include: { creador: true },
    orderBy: { creadoEn: 'desc' },
    take: TICKETS_POR_PAGINA,
    skip: skip
  })

  const ticketsResueltos = await prisma.ticket.findMany({
    where: { estado: 'RESUELTO', ...whereClause },
    include: { creador: true },
    orderBy: { creadoEn: 'desc' },
    take: TICKETS_POR_PAGINA,
    skip: skip
  })

  // C) Equipos y Estadísticas
  const misEquipos = await prisma.equipo.findMany({
    where: { usuarioId: usuarioActual.id }
  })

  const totalUrgentes = await prisma.ticket.count({
    where: { 
      prioridad: 'ALTA', 
      estado: { not: 'RESUELTO' }, 
      ...whereClause 
    }
  })

  // D) CÁLCULO DE PÁGINAS
  const [countAbiertos, countProceso, countResueltos] = await Promise.all([
     prisma.ticket.count({ where: { estado: 'ABIERTO', ...whereClause } }),
     prisma.ticket.count({ where: { estado: 'EN_PROCESO', ...whereClause } }),
     prisma.ticket.count({ where: { estado: 'RESUELTO', ...whereClause } })
  ])
  
  const maxTicketsEnUnaColumna = Math.max(countAbiertos, countProceso, countResueltos)
  const totalPaginas = Math.ceil(maxTicketsEnUnaColumna / TICKETS_POR_PAGINA)


  return (
    <main className="min-h-screen p-8 bg-gray-50">
      
      {/* CABECERA */}
      <div className="flex flex-col xl:flex-row justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-800 flex items-center gap-2">
            🚑 {t.titulo}
          </h1>
          <p className="text-sm text-gray-500">
            {t.bienvenida} <span className="font-bold">{usuarioActual.nombre}</span>
            <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full border ${esAdmin ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {usuarioActual.rol}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end w-full md:w-auto">
          {/* Selector de Idioma: Pasamos currentLang para que sepa cual pintar activo */}
          <LanguageSwitch currentLang={lang} />
          
          <Filtros />
          
          <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>
          
          <Notificaciones lista={misNotificaciones} />
        </div>

        <div className="flex gap-3 items-center mt-4 xl:mt-0 flex-wrap justify-center">
          {esAdmin && (
            // ENLACE LIMPIO: Sin ?lang=...
            <Link href="/admin/usuarios" className="bg-gray-800 text-white px-3 py-2 rounded shadow hover:bg-black transition text-sm flex items-center gap-2">
              👮 {t.botones.usuarios}
            </Link>
          )}
          
          {/* ENLACE LIMPIO */}
          <Link href="/noticias" className="text-gray-600 hover:text-blue-600 font-medium transition text-sm">
            📰 {t.botones.noticias}
          </Link>
          
          {/* ENLACE LIMPIO */}
          <Link href="/nuevo" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition font-medium text-sm flex items-center gap-2 whitespace-nowrap">
            <span>+</span> {t.botones.nuevo}
          </Link>
          
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
            <button className="text-red-600 border border-red-200 px-3 py-2 rounded hover:bg-red-50 text-sm transition bg-white">
              {t.botones.salir}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* COLUMNA IZQUIERDA: KPI & EQUIPOS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500 flex justify-between items-center">
                <div>
                   <p className="text-xs text-gray-500 uppercase font-bold">{t.kpis.urgentes}</p>
                   <p className="text-2xl font-bold text-red-600">{totalUrgentes}</p>
                </div>
                <span className="text-2xl">🔥</span>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 flex justify-between items-center">
               <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">{t.kpis.pendientes}</p>
                  <p className="text-2xl font-bold text-blue-600">{countAbiertos}</p>
               </div>
               <span className="text-2xl">📥</span>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-400 flex justify-between items-center">
               <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">{t.kpis.enMarcha}</p>
                  <p className="text-2xl font-bold text-yellow-600">{countProceso}</p>
               </div>
               <span className="text-2xl">⚙️</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
             <h3 className="font-bold text-gray-700 mb-3 border-b pb-2 text-sm flex items-center gap-2">
               💻 {t.kpis.equipos}
             </h3>
             {misEquipos.length === 0 ? (
                <p className="text-xs text-gray-400">Sin equipos.</p>
             ) : (
                misEquipos.map(e => (
                   <div key={e.id} className="text-sm mb-3 last:mb-0">
                     <div className="font-semibold text-gray-800">{e.tipo}</div>
                     <div className="text-xs text-gray-500">{e.marca} {e.modelo}</div>
                     <div className="text-[10px] text-gray-400 font-mono bg-gray-100 inline-block px-1 rounded mt-1">
                       SN: {e.numeroSerie || 'S/N'}
                     </div>
                   </div>
                ))
             )}
          </div>
        </div>

        {/* COLUMNA DERECHA: KANBAN */}
        <div className="lg:col-span-3 flex flex-col h-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { titulo: t.columnas.pendientes, tickets: ticketsAbiertos, border: 'border-blue-500', bg: 'bg-gray-100' },
              { titulo: t.columnas.proceso, tickets: ticketsEnProceso, border: 'border-yellow-400', bg: 'bg-blue-50' },
              { titulo: t.columnas.resueltos, tickets: ticketsResueltos, border: 'border-green-500', bg: 'bg-green-50' }
            ].map((columna) => (
              <div key={columna.titulo} className={`${columna.bg} rounded-xl p-4 h-full border border-gray-200/50 min-h-[400px]`}>
                <h2 className="font-bold text-gray-700 mb-4 text-sm uppercase flex justify-between">
                  {columna.titulo}
                  <span className="bg-white px-2 rounded-full text-xs py-0.5 border">{columna.tickets.length}</span>
                </h2>
                
                <div className="space-y-3">
                  {columna.tickets.length === 0 && (
                    <p className="text-center text-gray-400 text-xs italic py-4">{t.columnas.vacio}</p>
                  )}
                  
                  {columna.tickets.map(ticket => (
                    // ENLACE LIMPIO: Sin ?lang=...
                    <Link key={ticket.id} href={`/ticket/${ticket.id}`} className={`block bg-white p-3 rounded shadow-sm border-l-4 ${columna.border} hover:shadow-md transition relative group`}>
                      <div className="flex justify-between items-start mb-2">
                        {/* TRADUCCIÓN DE PRIORIDAD */}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          ticket.prioridad === 'ALTA' ? 'bg-red-50 text-red-600 border-red-100' : 
                          ticket.prioridad === 'MEDIA' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 
                          'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                          {t.valores[ticket.prioridad as keyof typeof t.valores] || ticket.prioridad}
                        </span>

                        {/* TRADUCCIÓN DE CATEGORÍA */}
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-medium">
                          {t.valores[ticket.categoria as keyof typeof t.valores] || ticket.categoria}
                        </span>
                      </div>

                      <h3 className={`font-semibold text-gray-800 text-sm mb-1 group-hover:text-blue-600 truncate ${columna.titulo === t.columnas.resueltos ? 'line-through text-gray-500' : ''}`}>
                        {ticket.titulo}
                      </h3>
                      
                      <div className="flex justify-between items-center text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
                        <span className="flex items-center gap-1 truncate max-w-[100px]">
                          👤 {ticket.creadorId === usuarioActual.id ? 'Tú' : ticket.creador.nombre}
                        </span>
                        <span>{new Date(ticket.creadoEn).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto">
             {/* Paginación: Pasamos 'lang' solo para traducir los textos (Anterior/Siguiente) */}
             <Pagination 
                paginaActual={paginaActual} 
                totalPaginas={totalPaginas} 
                diccionario={t.paginacion}
             />
          </div>
        </div>
      </div>
    </main>
  )
}