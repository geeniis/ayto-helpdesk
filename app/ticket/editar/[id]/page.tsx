import prisma from '@/lib/prisma'
import { editarTicket } from '@/app/actions' // Asegúrate de que esta importación existe
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function EditarTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()

  if (!session) redirect('/login')

  const ticket = await prisma.ticket.findUnique({
    where: { id: parseInt(id) }
  })

  if (!ticket) notFound()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        
        <h1 className="text-2xl font-bold text-gray-800 mb-6">✏️ Editar Ticket</h1>

        <form action={editarTicket} className="space-y-6">
          <input type="hidden" name="id" value={ticket.id} />

          {/* TÍTULO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título de la incidencia</label>
            <input 
              type="text" 
              name="titulo" 
              defaultValue={ticket.titulo}
              required 
              className="w-full rounded-md border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* PRIORIDAD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <select 
              name="prioridad" 
              defaultValue={ticket.prioridad}
              className="w-full rounded-md border-gray-300 p-3 shadow-sm bg-white"
            >
              <option value="BAJA">🟢 Baja (No corre prisa)</option>
              <option value="MEDIA">🟡 Media (Estándar)</option>
              <option value="ALTA">🔴 Alta (Urgente)</option>
            </select>
          </div>

          {/* DESCRIPCIÓN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción detallada</label>
            <textarea 
              name="descripcion" 
              rows={5} 
              defaultValue={ticket.descripcion}
              required 
              className="w-full rounded-md border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            ></textarea>
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link 
              href={`/ticket/${ticket.id}`} 
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
            >
              Cancelar
            </Link>
            <button 
              type="submit" 
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 shadow transition"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}