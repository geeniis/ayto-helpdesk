import prisma from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { agregarComentario, borrarComentario, cambiarEstadoTicket, borrarTicket } from '@/app/actions'
import { auth } from '@/auth'
import { getDiccionario } from '@/lib/diccionario' 

export default async function TicketDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()

  const { t } = await getDiccionario()

  const ticket = await prisma.ticket.findUnique({
    where: { id: parseInt(id) },
    include: { 
      creador: true,
      comentarios: {
        include: { autor: true },
        orderBy: { creadoEn: 'asc' }
      }
    }
  })

  if (!ticket) notFound()
  
  const miId = session?.user?.id ? parseInt(session.user.id) : null

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/80 via-slate-50 to-blue-50/80 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto">
        
        {/* BOTÓN VOLVER */}
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white text-slate-600 hover:text-blue-600 rounded-xl shadow-sm border border-slate-200 transition-all mb-6 hover:-translate-x-1 font-medium text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          {t.ticket.volver}
        </Link>

        {/* --- TARJETA PRINCIPAL DEL TICKET --- */}
        <div className="glass-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 md:p-10 mb-8 border-t-8 border-t-blue-500 relative overflow-hidden">
          
          <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-6">
            {/* Título y Badges */}
            <div className="flex-1">
               <div className="flex items-center gap-3 mb-4 flex-wrap">
                 <h1 className="text-3xl font-extrabold text-slate-800 leading-tight">{ticket.titulo}</h1>
                 
                 {/* BOTONES ACCIÓN */}
                 <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-lg border border-slate-200">
                    <Link 
                      href={`/ticket/editar/${ticket.id}`} 
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-slate-200"
                      title={t.ticket.editar}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </Link>
                    
                    <form action={borrarTicket}>
                      <input type="hidden" name="id" value={ticket.id} />
                      <button 
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-slate-200"
                        title={t.ticket.borrar}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </form>
                 </div>
               </div>

               <div className="flex items-center gap-3">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm ${
                   ticket.prioridad === 'ALTA' ? 'bg-red-50 text-rose-600 border-red-100' : 
                   ticket.prioridad === 'MEDIA' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                   'bg-slate-50 text-slate-600 border-slate-200'
                 }`}>
                   {t.ticket.prioridad_label} {t.valores[ticket.prioridad as keyof typeof t.valores] || ticket.prioridad}
                 </span>
                 
                 <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm">
                   {t.valores[ticket.categoria as keyof typeof t.valores] || ticket.categoria}
                 </span>
               </div>
            </div>
            
            {/* ESTADOS CONTROL SEGMENTADO */}
            <div className="flex flex-col items-start lg:items-end w-full lg:w-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner">
              <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-widest mb-3 ml-2">{t.ticket.estado}</span>
              <div className="flex gap-1.5 bg-slate-200/50 p-1.5 rounded-xl w-full">
                <form action={cambiarEstadoTicket} className="flex-1">
                  <input type="hidden" name="id" value={ticket.id} />
                  <input type="hidden" name="estado" value="ABIERTO" />
                  <button 
                    disabled={ticket.estado === 'ABIERTO'}
                    className={`w-full px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                      ticket.estado === 'ABIERTO' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5 scale-105' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                    }`}
                  >
                    {t.valores.ABIERTO}
                  </button>
                </form>
                <form action={cambiarEstadoTicket} className="flex-1">
                  <input type="hidden" name="id" value={ticket.id} />
                  <input type="hidden" name="estado" value="EN_PROCESO" />
                  <button 
                    disabled={ticket.estado === 'EN_PROCESO'}
                    className={`w-full px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                      ticket.estado === 'EN_PROCESO' ? 'bg-amber-400 text-amber-900 shadow-md shadow-amber-400/20 ring-1 ring-amber-500/20 scale-105' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                    }`}
                  >
                    {t.valores.EN_PROCESO}
                  </button>
                </form>
                <form action={cambiarEstadoTicket} className="flex-1">
                  <input type="hidden" name="id" value={ticket.id} />
                  <input type="hidden" name="estado" value="RESUELTO" />
                  <button 
                    disabled={ticket.estado === 'RESUELTO'}
                    className={`w-full px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                      ticket.estado === 'RESUELTO' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-1 ring-emerald-600/20 scale-105' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                    }`}
                  >
                    {t.valores.RESUELTO}
                  </button>
                </form>
              </div>
            </div>
          </div>
          
          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-6"></div>

          {/* DESCRIPCIÓN */}
          <div className="bg-white/50 rounded-2xl p-6 border border-slate-100 mb-6">
            <h3 className="font-extrabold text-slate-800 mb-3 text-xs uppercase tracking-widest flex items-center gap-2">
              <span className="text-blue-500">📝</span> {t.ticket.descripcion}
            </h3>
            <p className="text-slate-700 text-lg mb-2 whitespace-pre-wrap leading-relaxed">{ticket.descripcion}</p>
          </div>
          
          {/* ADJUNTOS */}
          {ticket.adjuntoUrl && (
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mb-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xs font-extrabold text-indigo-900 mb-4 tracking-widest uppercase flex items-center gap-2">
                <span className="text-indigo-500">📎</span> {t.ticket.adjunto_label}
              </h3>
              
              {ticket.adjuntoUrl.includes('.mp4') || ticket.adjuntoUrl.includes('.webm') || ticket.adjuntoUrl.includes('.mov') ? (
                <div className="rounded-xl overflow-hidden shadow-lg border border-indigo-200 bg-black/5 max-w-2xl">
                  <video 
                    src={ticket.adjuntoUrl} 
                    controls 
                    className="w-full max-h-[450px]" 
                  />
                </div>
              ) : (
                <a href={ticket.adjuntoUrl} target="_blank" rel="noopener noreferrer" className="group block relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 max-w-2xl border border-indigo-200">
                   <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/20 transition-all duration-300 flex items-center justify-center z-10">
                     <span className="opacity-0 group-hover:opacity-100 bg-white text-indigo-800 px-4 py-2 rounded-full font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 text-sm flex items-center gap-2">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> {t.ticket.adjunto_clic}
                     </span>
                   </div>
                   <img 
                     src={ticket.adjuntoUrl} 
                     alt="Adjunto del ticket" 
                     className="w-full max-h-[450px] object-cover group-hover:scale-[1.02] transition-transform duration-500" 
                   />
                </a>
              )}
            </div>
          )}

          {/* PIE DE TARJETA */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs font-medium text-slate-500 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                {ticket.creador.nombre ? ticket.creador.nombre[0].toUpperCase() : 'A'}
              </div>
              <div>
                <p className="uppercase text-[10px] tracking-widest font-bold text-slate-400">{t.ticket.autor}</p>
                <p className="text-sm text-slate-800">{ticket.creador.nombre || ticket.creador.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="uppercase text-[10px] tracking-widest font-bold text-slate-400">📅 {t.ticket.creado}</p>
              <p className="text-sm text-slate-800">{ticket.creadoEn.toLocaleDateString()} a las {ticket.creadoEn.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
          </div>
        </div>

        {/* --- SECCIÓN DE COMENTARIOS --- */}
        <div className="mt-12 mb-8">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-8 flex items-center gap-3 ml-2">
            <span className="bg-white p-2 rounded-xl shadow-sm">💬</span> {t.ticket.historial}
          </h2>

          <div className="space-y-6 mb-10">
            {ticket.comentarios.length === 0 && (
              <div className="text-center py-12 bg-white/40 rounded-3xl border border-dashed border-slate-300">
                <span className="text-4xl opacity-50 mb-3 block">📭</span>
                <p className="text-slate-500 font-medium">{t.columnas.vacio}</p>
              </div>
            )}

            {ticket.comentarios.map((comentario) => {
              const soyAutor = comentario.autorId === miId;
              
              return (
              <div key={comentario.id} className={`flex ${soyAutor ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] p-5 rounded-2xl shadow-sm relative group hover:shadow-md transition-all ${
                  comentario.interno 
                    ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200/60 rounded-tl-sm' 
                    : soyAutor 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-white border border-slate-200 rounded-tl-sm'
                }`}>
                  <div className="flex justify-between items-start mb-3 gap-6">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm flex items-center gap-2 ${soyAutor && !comentario.interno ? 'text-blue-50' : 'text-slate-800'}`}>
                        {soyAutor ? 'Tú' : (comentario.autor.nombre || comentario.autor.email)}
                        {comentario.interno && (
                          <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300 shadow-sm uppercase tracking-wide flex items-center gap-1">
                            <span>🔒</span> {t.ticket.notaInterna}
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-medium ${soyAutor && !comentario.interno ? 'text-blue-200' : 'text-slate-400'}`}>
                        {comentario.creadoEn.toLocaleDateString()} {comentario.creadoEn.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      
                      {/* Controles Editar/Borrar flotantes al hacer hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 -right-3 flex bg-white rounded-full shadow-lg border border-slate-100 p-1">
                        <Link href={`/comentario/editar/${comentario.id}`} className="text-slate-400 hover:text-blue-500 p-1.5 rounded-full hover:bg-slate-50 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </Link>
                        <form action={borrarComentario}>
                          <input type="hidden" name="id" value={comentario.id} />
                          <input type="hidden" name="ticketId" value={ticket.id} />
                          <button className="text-slate-400 hover:text-rose-500 p-1.5 rounded-full hover:bg-slate-50 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                  
                  <p className={`whitespace-pre-wrap leading-relaxed text-[15px] ${soyAutor && !comentario.interno ? 'text-blue-50' : 'text-slate-700'}`}>
                    {comentario.contenido}
                  </p>
                </div>
              </div>
            )})}
          </div>

          <div className="glass-card p-6 md:p-8 rounded-3xl shadow-lg border border-slate-200">
            <h3 className="font-extrabold text-slate-700 mb-4 text-sm uppercase tracking-widest">{t.ticket.escribirComentario}</h3>
            <form action={agregarComentario} className="relative">
              <input type="hidden" name="ticketId" value={ticket.id} />
              
              <textarea 
                name="contenido" 
                required 
                placeholder={t.ticket.escribirComentario} 
                className="w-full rounded-2xl border-slate-200 bg-white/80 p-5 shadow-inner focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 mb-4 transition-all text-slate-700 resize-none" 
                rows={4}
              ></textarea>
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="flex items-center gap-3 text-sm font-semibold text-slate-600 cursor-pointer select-none hover:bg-white px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm">
                  <input type="checkbox" name="interno" className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500 transition-colors cursor-pointer" />
                  <span className="flex items-center gap-2">{t.ticket.esNotaInterna} <span className="text-lg">🔒</span></span>
                </label>
                
                <button type="submit" className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  {t.ticket.enviar}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}