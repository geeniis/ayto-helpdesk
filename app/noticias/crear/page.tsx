import { crearNoticia } from '@/app/actions'
import Link from 'next/link'

export default function CrearNoticiaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">📢 Publicar Nueva Noticia</h1>
          <p className="text-gray-500 text-sm">Este aviso será visible para todos los empleados.</p>
        </div>

        <form action={crearNoticia} className="space-y-6">
          {/* Título */}
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
              Título del aviso
            </label>
            <input
              type="text"
              name="titulo"
              id="titulo"
              required
              placeholder="Ej: Corte de servicio programado..."
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
              placeholder="Escribe aquí los detalles..."
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
              Publicar Noticia
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}