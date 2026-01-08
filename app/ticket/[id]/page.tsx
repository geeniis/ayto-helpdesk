import prisma from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
// Importamos las acciones
import { agregarComentario, borrarComentario, cambiarEstadoTicket, borrarTicket } from '@/app/actions'
import { auth } from '@/auth'

export default async function TicketDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          &larr; Volver al Dashboard
        </Link>

        {/* --- TARJETA PRINCIPAL DEL TICKET --- */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-blue-500">
          
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
            {/* Título y Acciones de Gestión */}
            <div className="flex-1">
               <div className="flex items-center gap-4 mb-2">
                 <h1 className="text-2xl font-bold text-gray-800">{ticket.titulo}</h1>
                 
                 {/* BOTONES DE EDICIÓN Y BORRADO */}
                 <div className="flex items-center gap-2">
                    <Link 
                      href={`/ticket/editar/${ticket.id}`} 
                      className="text-gray-400 hover:text-blue-600 transition"
                      title="Editar contenido del ticket"
                    >
                      ✏️
                    </Link>
                    
                    <form action={borrarTicket}>
                      <input type="hidden" name="id" value={ticket.id} />
                      <button 
                        className="text-gray-400 hover:text-red-600 transition pt-1"
                        title="Eliminar ticket permanentemente"
                      >
                        🗑️
                      </button>
                    </form>
                 </div>
               </div>

               <span className={`px-3 py-1 rounded text-sm font-bold ${
                 ticket.prioridad === 'ALTA' ? 'bg-red-100 text-red-800' : 
                 ticket.prioridad === 'MEDIA' ? 'bg-yellow-100 text-yellow-800' :
                 'bg-green-100 text-green-800'
               }`}>
                 Prioridad: {ticket.prioridad}
               </span>
            </div>
            
            {/* BOTONES DE ESTADO */}
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs text-gray-400 uppercase font-bold">Cambiar Estado</span>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <form action={cambiarEstadoTicket}>
                  <input type="hidden" name="id" value={ticket.id} />
                  <input type="hidden" name="estado" value="ABIERTO" />
                  <button 
                    disabled={ticket.estado === 'ABIERTO'}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      ticket.estado === 'ABIERTO' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'
                    }`}
                  >Abierto</button>
                </form>
                <form action={cambiarEstadoTicket}>
                  <input type="hidden" name="id" value={ticket.id} />
                  <input type="hidden" name="estado" value="EN_PROCESO" />
                  <button 
                    disabled={ticket.estado === 'EN_PROCESO'}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      ticket.estado === 'EN_PROCESO' ? 'bg-yellow-100 text-yellow-700 shadow-sm border border-yellow-200' : 'text-gray-500 hover:bg-gray-200'
                    }`}
                  >En Proceso</button>
                </form>
                <form action={cambiarEstadoTicket}>
                  <input type="hidden" name="id" value={ticket.id} />
                  <input type="hidden" name="estado" value="RESUELTO" />
                  <button 
                    disabled={ticket.estado === 'RESUELTO'}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      ticket.estado === 'RESUELTO' ? 'bg-green-100 text-green-700 shadow-sm border border-green-200' : 'text-gray-500 hover:bg-gray-200'
                    }`}
                  >Resuelto</button>
                </form>
              </div>
            </div>
          </div>
          
          {/* DESCRIPCIÓN */}
          <p className="text-gray-700 text-lg mb-6 whitespace-pre-wrap">{ticket.descripcion}</p>
          
          {/* --- ZONA DE ADJUNTOS (NUEVO) 📸 --- */}
          {ticket.adjuntoUrl && (
            <div className="mt-6 mb-6 bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                📎 Archivo Adjunto
              </h3>
              
              {/* Detectamos si es VIDEO (.mp4, .webm) o IMAGEN */}
              {ticket.adjuntoUrl.includes('.mp4') || ticket.adjuntoUrl.includes('.webm') || ticket.adjuntoUrl.includes('.mov') ? (
                <video 
                  src={ticket.adjuntoUrl} 
                  controls 
                  className="max-w-full rounded shadow-sm max-h-[400px]" 
                />
              ) : (
                <a href={ticket.adjuntoUrl} target="_blank" rel="noopener noreferrer" className="inline-block group">
                   <img 
                     src={ticket.adjuntoUrl} 
                     alt="Adjunto del ticket" 
                     className="max-w-full rounded shadow-sm border border-gray-200 max-h-[400px] hover:opacity-95 transition" 
                   />
                   <span className="text-xs text-blue-500 group-hover:underline block mt-2">🔍 Clic para ver tamaño completo</span>
                </a>
              )}
            </div>
          )}

          {/* PIE DE TARJETA */}
          <div className="flex gap-6 text-sm text-gray-500 border-t pt-4 mt-4">
            <p>👤 Autor: <span className="font-semibold">{ticket.creador.nombre || ticket.creador.email}</span></p>
            <p>📅 Fecha: {ticket.creadoEn.toLocaleDateString()}</p>
          </div>
        </div>

        {/* --- SECCIÓN DE COMENTARIOS --- */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            💬 Historial y Notas
          </h2>

          <div className="space-y-4">
            {ticket.comentarios.length === 0 && (
              <p className="text-gray-400 italic">No hay comentarios aún.</p>
            )}

            {ticket.comentarios.map((comentario) => (
              <div key={comentario.id} className={`p-4 rounded-lg border ${comentario.interno ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-gray-700 flex items-center gap-2">
                      {comentario.autor.nombre || comentario.autor.email}
                      {comentario.interno && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded border border-yellow-300">🔒 Nota Interna</span>}
                    </span>
                    <span className="text-xs text-gray-400">{comentario.creadoEn.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                    <Link href={`/comentario/editar/${comentario.id}`} className="text-blue-400 hover:text-blue-600 p-1">✏️</Link>
                    <form action={borrarComentario}>
                      <input type="hidden" name="id" value={comentario.id} />
                      <input type="hidden" name="ticketId" value={ticket.id} />
                      <button className="text-red-400 hover:text-red-600 p-1">🗑️</button>
                    </form>
                  </div>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{comentario.contenido}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-100 p-6 rounded-lg border border-gray-200 mt-8">
            <h3 className="font-semibold text-gray-700 mb-3">Añadir respuesta</h3>
            <form action={agregarComentario}>
              <input type="hidden" name="ticketId" value={ticket.id} />
              <textarea name="contenido" required placeholder="Escribe aquí..." className="w-full rounded-md border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-3" rows={3}></textarea>
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" name="interno" className="rounded text-blue-600 focus:ring-blue-500" />
                  <span>Es una <b>Nota Interna</b> 🔒</span>
                </label>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition shadow">Enviar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}