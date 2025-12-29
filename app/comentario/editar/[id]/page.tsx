import prisma from '@/lib/prisma'
import { editarComentario } from '@/app/actions'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function EditarComentarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const comentario = await prisma.comentario.findUnique({
    where: { id: parseInt(id) }
  })

  if (!comentario) redirect('/')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        
        <h1 className="text-xl font-bold text-gray-800 mb-6">✏️ Editar Comentario</h1>

        <form action={editarComentario} className="space-y-4">
          <input type="hidden" name="id" value={comentario.id} />
          <input type="hidden" name="ticketId" value={comentario.ticketId} />

          <textarea
            name="contenido"
            required
            rows={5}
            defaultValue={comentario.contenido}
            className="w-full rounded-md border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          ></textarea>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input 
              type="checkbox" 
              name="interno" 
              defaultChecked={comentario.interno}
              className="rounded text-blue-600 focus:ring-blue-500" 
            />
            <span>Marcar como <b>Nota Interna</b></span>
          </label>

          <div className="flex justify-end gap-3 pt-4">
            <Link 
              href={`/ticket/${comentario.ticketId}`} 
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 shadow transition"
            >
              Guardar
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}