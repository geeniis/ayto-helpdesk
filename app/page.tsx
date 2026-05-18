import prisma from '@/lib/prisma'
import Link from 'next/link'
import { auth, signOut } from '@/auth'
import Filtros from '@/app/components/Filtros'
import Notificaciones from '@/app/components/Notificaciones'
import Pagination from '@/app/components/Pagination'
import LanguageSwitch from '@/app/components/LanguageSwitch'
import { getDiccionario } from '@/lib/diccionario'
import { obtenerOCrearChatGeneral } from '@/app/actions'

export const dynamic = 'force-dynamic'

interface SearchParamsProps {
  searchParams?: Promise<{
    query?: string
    categoria?: string
    prioridad?: string
    estado?: string
    page?: string
  }>
}

const TICKETS_POR_PAGINA = 9 

export default async function Home(props: SearchParamsProps) {
  const params = await props.searchParams;
  const { t, lang } = await getDiccionario() as { t: any, lang: 'es' | 'ca' }

  const query = params?.query || '';
  const categoria = params?.categoria || '';
  const prioridad = params?.prioridad || '';
  const estado = params?.estado || '';
  
  const paginaActual = Number(params?.page) || 1
  const skip = (paginaActual - 1) * TICKETS_POR_PAGINA

  const session = await auth()
  if (!session?.user?.id) return null

  const usuarioActual = await prisma.usuario.findUnique({
    where: { id: parseInt(session.user.id) }
  })
  if (!usuarioActual) return null

  const esAdmin = usuarioActual.rol === 'ADMIN'
  const chatTicket = await obtenerOCrearChatGeneral(usuarioActual.id)


  const whereClause: any = {}

  if (!esAdmin) {
    whereClause.creadorId = usuarioActual.id
  }

  if (query) {
    whereClause.OR = [
      { titulo: { contains: query } },
      { descripcion: { contains: query } },
      { creador: { nombre: { contains: query } } }
    ]
  }
  if (categoria) whereClause.categoria = categoria
  if (prioridad) whereClause.prioridad = prioridad

  const misNotificaciones = await prisma.notificacion.findMany({
    where: { usuarioId: usuarioActual.id, leido: false },
    orderBy: { creadoEn: 'desc' },
    take: 10
  })

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

  const totalNoLeidos = await prisma.mensaje.count({
    where: { destinatarioId: usuarioActual.id, leido: false }
  })

  const [countAbiertos, countProceso, countResueltos] = await Promise.all([
     prisma.ticket.count({ where: { estado: 'ABIERTO', ...whereClause } }),
     prisma.ticket.count({ where: { estado: 'EN_PROCESO', ...whereClause } }),
     prisma.ticket.count({ where: { estado: 'RESUELTO', ...whereClause } })
  ])
  
  const maxTicketsEnUnaColumna = estado === 'RESUELTO' 
    ? countResueltos 
    : Math.max(countAbiertos, countProceso)
  const totalPaginas = Math.max(1, Math.ceil(maxTicketsEnUnaColumna / TICKETS_POR_PAGINA))

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/80 via-slate-50 to-blue-50/80 font-sans text-slate-800">
      
      {/* CABECERA GLASSMORPHISM */}
      <div className="glass flex flex-col xl:flex-row justify-between items-center mb-10 p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 flex items-center gap-3">
            {t.titulo}
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            {t.bienvenida} <span className="font-bold text-slate-700">{usuarioActual.nombre}</span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border shadow-sm ${esAdmin ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-indigo-800 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {usuarioActual.rol}
            </span>
          </p>
        </div>
 
        <div className="flex flex-wrap items-center gap-4 flex-1 justify-end w-full md:w-auto">
          <LanguageSwitch currentLang={lang} />
          <Filtros />
          <div className="h-8 w-px bg-slate-200/60 mx-1 hidden md:block"></div>
          <Notificaciones lista={misNotificaciones} />
        </div>
 
        <div className="flex gap-3 items-center w-full xl:w-auto justify-center xl:justify-end flex-wrap">
          {esAdmin && (
            <>
              <Link href="/admin/usuarios" className="bg-slate-800 text-white px-4 py-2.5 rounded-xl shadow-md shadow-slate-800/20 hover:bg-slate-900 transition-all font-medium text-sm flex items-center gap-2 hover:-translate-y-0.5">
                <span className="hidden sm:inline">{t.botones.usuarios}</span>
              </Link>
              <Link href="/admin/estadisticas" className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all font-medium text-sm flex items-center gap-2 hover:-translate-y-0.5">
                <span className="hidden sm:inline">Estadísticas</span>
              </Link>
            </>
          )}
          
          <Link href="/noticias" className="bg-white/80 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all font-medium text-sm flex items-center gap-2 hover:-translate-y-0.5">
            <span className="hidden sm:inline">{t.botones.noticias}</span>
          </Link>
          
          <Link href="/chat" className="bg-white/80 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all font-medium text-sm flex items-center gap-2 hover:-translate-y-0.5 relative">
            <span>💬</span> 
            <span className="hidden sm:inline">Chat Directo</span>
            {totalNoLeidos > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center border border-white animate-bounce shadow-md">
                {totalNoLeidos}
              </span>
            )}
          </Link>

          
          <Link href="/nuevo" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 transition-all font-bold text-sm flex items-center gap-2 whitespace-nowrap">
            <span className="text-lg leading-none">+</span> {t.botones.nuevo}
          </Link>
          
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
            <button className="text-rose-600 border border-rose-200 px-4 py-2.5 rounded-xl hover:bg-rose-50 text-sm transition-all bg-white shadow-sm font-medium hover:-translate-y-0.5">
              {t.botones.salir}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: KPI & EQUIPOS */}
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-4">
            {/* Tarjeta Urgentes - Destacada */}
            <div className="bg-gradient-to-br from-rose-500 to-red-600 p-5 rounded-2xl shadow-lg shadow-red-500/25 flex justify-between items-center text-white hover-lift">
                <div>
                   <p className="text-[11px] text-red-100 uppercase tracking-widest font-bold mb-1">{t.kpis.urgentes}</p>
                   <p className="text-3xl font-extrabold">{totalUrgentes}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
            </div>
            
            {/* Tarjeta Pendientes */}
            <div className="glass-card p-5 rounded-2xl flex justify-between items-center hover-lift border-l-4 border-l-blue-500">
               <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold mb-1">{t.kpis.pendientes}</p>
                  <p className="text-3xl font-extrabold text-blue-600">{countAbiertos}</p>
               </div>
               <div className="bg-blue-50 p-3 rounded-xl">
                 <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-3.586 3.586a2 2 0 01-2.828 0L6 13" /></svg>
               </div>
            </div>

            {/* Tarjeta En Marcha */}
            <div className="glass-card p-5 rounded-2xl flex justify-between items-center hover-lift border-l-4 border-l-amber-400">
               <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold mb-1">{t.kpis.enMarcha}</p>
                  <p className="text-3xl font-extrabold text-amber-600">{countProceso}</p>
               </div>
               <div className="bg-amber-50 p-3 rounded-xl">
                 <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               </div>
            </div>
          </div>

          {/* Tarjeta Equipos */}
          <div className="glass-card p-5 rounded-2xl shadow-sm">
             <h3 className="font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 text-sm flex items-center gap-2">
               <span className="bg-indigo-100 p-1.5 rounded-lg">
                 <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
               </span> {t.kpis.equipos}
             </h3>
             {misEquipos.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-400">Sin equipos asignados.</p>
                </div>
             ) : (
                <div className="space-y-4">
                  {misEquipos.map(e => (
                     <div key={e.id} className="group p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                       <div className="font-bold text-slate-800 text-sm">{e.tipo}</div>
                       <div className="text-xs text-slate-500 mt-0.5">{e.marca} {e.modelo}</div>
                       <div className="text-[10px] text-slate-400 font-mono bg-slate-100 group-hover:bg-white inline-block px-2 py-1 rounded-md mt-2 shadow-sm border border-slate-200">
                         SN: {e.numeroSerie || 'N/D'}
                       </div>
                     </div>
                  ))}
                </div>
             )}
          </div>
        </div>

        {/* COLUMNA DERECHA: TABLERO / HISTORIAL */}
        <div className="lg:col-span-9 flex flex-col h-full">
          <div className="mb-8">
            {estado === 'RESUELTO' ? (
              <div className="bg-emerald-50/20 rounded-3xl p-5 border border-emerald-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] backdrop-blur-sm min-h-[500px]">
                <div className="flex justify-between items-center mb-6 px-1">
                  <h2 className="font-extrabold text-emerald-800 text-sm uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Historial de Incidencias Resueltas
                  </h2>
                  <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">{countResueltos} archivadas</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ticketsResueltos.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                      <span className="text-4xl mb-2">🎉</span>
                      <p className="text-center text-slate-400 text-sm font-medium">No hay incidencias resueltas en este momento.</p>
                    </div>
                  ) : (
                    ticketsResueltos.map(ticket => (
                      <Link 
                        key={ticket.id} 
                        href={`/ticket/${ticket.id}`} 
                        className="block glass-card p-4 rounded-2xl border-l-4 border-l-emerald-500 hover-lift relative group"
                      >
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm border ${
                            ticket.prioridad === 'ALTA' ? 'bg-red-50 text-rose-600 border-red-100' : 
                            ticket.prioridad === 'MEDIA' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                            'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {t.valores[ticket.prioridad as keyof typeof t.valores] || ticket.prioridad}
                          </span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100 font-semibold truncate max-w-[100px]">
                            {t.valores[ticket.categoria as keyof typeof t.valores] || ticket.categoria}
                          </span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100 font-extrabold flex items-center gap-1 shadow-sm ml-auto">
                            <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            Listo
                          </span>
                        </div>
                        
                        <h3 className="font-bold text-slate-700 text-sm mb-2 leading-snug group-hover:text-blue-600 transition-colors">
                          {ticket.titulo}
                        </h3>
                        
                        <div className="flex justify-between items-center text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100/80">
                          <span className="flex items-center gap-1.5 font-medium truncate max-w-[120px] bg-slate-50 px-2 py-1 rounded-md">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> {ticket.creadorId === usuarioActual.id ? 'Tú' : ticket.creador.nombre}
                          </span>
                          <span className="font-mono text-[10px] bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            {new Date(ticket.creadoEn).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { titulo: t.columnas.pendientes, tickets: ticketsAbiertos, border: 'border-l-blue-500', bg: 'bg-slate-100/40', badge: 'bg-blue-100 text-blue-700', totalCount: countAbiertos },
                  { titulo: t.columnas.proceso, tickets: ticketsEnProceso, border: 'border-l-amber-400', bg: 'bg-amber-50/40', badge: 'bg-amber-100 text-amber-700', totalCount: countProceso }
                ].map((columna) => (
                  <div key={columna.titulo} className={`${columna.bg} rounded-3xl p-5 border border-white/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] backdrop-blur-sm min-h-[500px]`}>
                    <div className="flex justify-between items-center mb-6 px-1">
                      <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
                        {columna.titulo}
                      </h2>
                      <span className={`${columna.badge} px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm`}>{columna.totalCount}</span>
                    </div>
                    
                    <div className="space-y-4">
                      {columna.tickets.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 opacity-50">
                          <span className="text-3xl mb-2">🍃</span>
                          <p className="text-center text-slate-400 text-xs font-medium">{t.columnas.vacio}</p>
                        </div>
                      )}
                      
                      {columna.tickets.map(ticket => (
                        <Link 
                          key={ticket.id} 
                          href={`/ticket/${ticket.id}`} 
                          className={`block glass-card p-4 rounded-2xl border-l-4 ${columna.border} hover-lift relative group`}
                        >
                          <div className="flex flex-wrap items-center gap-1.5 mb-3">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm border ${
                              ticket.prioridad === 'ALTA' ? 'bg-red-50 text-rose-600 border-red-100' : 
                              ticket.prioridad === 'MEDIA' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                              'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                              {t.valores[ticket.prioridad as keyof typeof t.valores] || ticket.prioridad}
                            </span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100 font-semibold truncate max-w-[100px]">
                              {t.valores[ticket.categoria as keyof typeof t.valores] || ticket.categoria}
                            </span>
                          </div>
                          
                          <h3 className="font-bold text-slate-800 text-sm mb-2 leading-snug group-hover:text-blue-600 transition-colors">
                            {ticket.titulo}
                          </h3>
                          
                          <div className="flex justify-between items-center text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100/80">
                            <span className="flex items-center gap-1.5 font-medium truncate max-w-[120px] bg-slate-50 px-2 py-1 rounded-md">
                              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> {ticket.creadorId === usuarioActual.id ? 'Tú' : ticket.creador.nombre}
                            </span>
                            <span className="font-mono text-[10px] bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                              {new Date(ticket.creadoEn).toLocaleDateString()}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto glass-card rounded-2xl p-2 flex justify-center">
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