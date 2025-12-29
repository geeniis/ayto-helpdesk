import prisma from '@/lib/prisma'
import { editarNoticia } from '@/app/actions'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// 1. CAMBIO AQUÍ: Definimos params como una Promesa (Promise)
export default async function EditarNoticiaPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  
  // 2. CAMBIO AQUÍ: Esperamos a que la promesa se resuelva para sacar el ID
  const { id } = await params
  
  // Ahora ya podemos usar 'id' normalmente (convirtiéndolo a número)
  const noticia = await prisma.noticia.findUnique({
    where: {
      id: parseInt(id)
    }
  })

  // Si no existe, nos vamos
  if (!noticia) {
    redirect('/noticias')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">✏️ Editar Noticia</h1>
        </div>

        <form action={editarNoticia} className="space-y-6">
          <input type="hidden" name="id" value={noticia.id} />

          {/* Título */}
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              name="titulo"
              id="titulo"
              required
              defaultValue={noticia.titulo}
              className="w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Contenido */}
          <div>
            <label htmlFor="contenido" className="block text-sm font-medium text-gray-700 mb-1">
              Contenido
            </label>
            <textarea
              name="contenido"
              id="contenido"
              required
              rows={6}
              defaultValue={noticia.contenido}
              className="w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            ></textarea>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Link 
              href="/noticias" 
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