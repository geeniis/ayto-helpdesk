'use client'

import { editarNoticia } from '@/app/actions'
import Link from 'next/link'
import { useState } from 'react'

// Recibimos 't' y también la 'noticia' actual
export default function FormularioEditar({ t, noticia }: { t: any, noticia: any }) {
  const [guardando, setGuardando] = useState(false)

  const manejarEnvio = () => setGuardando(true)

  if (!t) return <div>Cargando...</div>

  return (
    <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">✏️ {t.noticias?.editar || 'Editar Noticia'}</h1>
        </div>

        <form action={editarNoticia} onSubmit={manejarEnvio} className="space-y-6">
          <input type="hidden" name="id" value={noticia.id} />

          {/* Título */}
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
              {t.formulario?.titulo || 'Título'}
            </label>
            <input
              type="text"
              name="titulo"
              id="titulo"
              required
              defaultValue={noticia.titulo}
              className="w-full rounded-md border border-gray-300 p-3 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Contenido */}
          <div>
            <label htmlFor="contenido" className="block text-sm font-medium text-gray-700 mb-1">
              {t.ticket?.descripcion || 'Contenido'}
            </label>
            <textarea
              name="contenido"
              id="contenido"
              required
              rows={6}
              defaultValue={noticia.contenido}
              className="w-full rounded-md border border-gray-300 p-3 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Link 
              href="/noticias" 
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition border border-transparent hover:border-gray-300"
            >
              {t.formulario?.cancelar || 'Cancelar'}
            </Link>
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 shadow transition disabled:bg-gray-400"
            >
              {guardando ? 'Guardando...' : (t.formulario?.guardar || 'Guardar Cambios')}
            </button>
          </div>
        </form>
    </div>
  )
}