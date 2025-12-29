import prisma from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { agregarComentario, borrarComentario } from '@/app/actions'
import { auth } from '@/auth'



// Recordamos el truco del 'await params' para Next.js 15
export default async function TicketDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()

  // 1. Buscamos el ticket Y sus comentarios (incluyendo autores)
  const ticket = await prisma.ticket.findUnique({
    where: { id: parseInt(id) },
    include: { 
      creador: true,
      comentarios: {
        include: { autor: true },
        orderBy: { creadoEn: 'asc' } // Los viejos primero (tipo chat)
      }
    }
  })

  if (!ticket) notFound()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* BOTÓN VOLVER */}
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          &larr; Volver al listado
        </Link>

        {/* DETALLES DEL TICKET (Igual que antes) */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-blue-500">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-800">{ticket.titulo}</h1>
            <span className={`px-3 py-1 rounded text-sm font-bold ${
              ticket.prioridad === 'ALTA' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {ticket.prioridad}
            </span>
          </div>
          
          <p className="text-gray-700 text-lg mb-6 whitespace-pre-wrap">{ticket.descripcion}</p>
          
          <div className="flex gap-6 text-sm text-gray-500 border-t pt-4">
            <p>👤 Reportado por: <span className="font-semibold">{ticket.creador.nombre || ticket.creador.email}</span></p>
            <p>📅 Fecha: {ticket.creadoEn.toLocaleDateString()}</p>
            <p>🔄 Estado: <span className="uppercase font-medium">{ticket.estado}</span></p>
          </div>
        </div>

        {/* --- ZONA DE COMENTARIOS --- */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            💬 Seguimiento de la incidencia
          </h2>

          {/* LISTA DE MENSAJES */}
          <div className="space-y-4">
            {ticket.comentarios.length === 0 && (
              <p className="text-gray-400 italic">No hay comentarios aún.</p>
            )}

            {ticket.comentarios.map((comentario) => (
              <div 
                key={comentario.id} 
                className={`p-4 rounded-lg border ${
                  comentario.interno 
                    ? 'bg-yellow-50 border-yellow-200' // Estilo para NOTAS INTERNAS
                    : 'bg-white border-gray-200'       // Estilo normal
                }`}
              >
               <div className="flex justify-between items-start mb-2">
                  {/* Izquierda: Autor y Fecha */}
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-gray-700 flex items-center gap-2">
                      {comentario.autor.nombre || comentario.autor.email}
                      {comentario.interno && (
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded border border-yellow-300">
                          🔒 Interno
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">
                      {comentario.creadoEn.toLocaleString()}
                    </span>
                  </div>

                  {/* Derecha: Botones de Acción (Solo si eres tú el autor o Admin) */}
                  {/* Nota: Aquí podrías poner un if(session.user.id === comentario.autorId) para asegurar */}
                  <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                    
                    {/* EDITAR */}
                    <Link 
                      href={`/comentario/editar/${comentario.id}`}
                      className="text-blue-400 hover:text-blue-600 p-1"
                      title="Editar comentario"
                    >
                      ✏️
                    </Link>

                    {/* BORRAR */}
                    <form action={borrarComentario}>
                      <input type="hidden" name="id" value={comentario.id} />
                      <input type="hidden" name="ticketId" value={ticket.id} />
                      <button 
                        className="text-red-400 hover:text-red-600 p-1"
                        title="Borrar comentario"
                      >
                        🗑️
                      </button>
                    </form>
                  </div>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{comentario.contenido}</p>
              </div>
            ))}
          </div>

          {/* FORMULARIO PARA NUEVO COMENTARIO */}
          <div className="bg-gray-100 p-6 rounded-lg border border-gray-200 mt-8">
            <h3 className="font-semibold text-gray-700 mb-3">Añadir nuevo comentario</h3>
            <form action={agregarComentario}>
              <input type="hidden" name="ticketId" value={ticket.id} />
              
              <textarea
                name="contenido"
                required
                placeholder="Escribe aquí tu respuesta o nota..."
                className="w-full rounded-md border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-3"
                rows={3}
              ></textarea>

              <div className="flex justify-between items-center">
                {/* CHECKBOX: Solo visible para técnicos (TÚ) */}
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" name="interno" className="rounded text-blue-600 focus:ring-blue-500" />
                  <span>Marcar como <b>Nota Interna</b> (Solo técnicos)</span>
                </label>

                <button 
                  type="submit" 
                  className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition shadow"
                >
                  Enviar Comentario
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  )
}