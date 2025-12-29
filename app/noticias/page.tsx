import prisma from '../../lib/prisma'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

async function borrarNoticia(formData: FormData) {
  'use server'
  const id = formData.get('id')
  if (id) {
    await prisma.noticia.delete({
      where: { id: Number(id) }
    })
    revalidatePath('/noticias')
  }
}

export default async function NoticiasPage() {
  // Pedimos las noticias a la base de datos
  // @ts-ignore: El cliente de Prisma necesita regenerarse
  const noticias = await prisma.noticia.findMany({
    include: { autor: true }, // Queremos saber quién la escribió
    orderBy: { publicadoEn: 'desc' } // Las nuevas arriba
  })

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        
    {/* Cabecera */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📰 Tablón de Anuncios</h1>
            <p className="text-gray-500">Novedades del departamento de informática</p>
          </div>
          
          <div className="flex gap-4">
             {/* Botón Nuevo */}
            <Link 
              href="/noticias/crear" 
              className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition font-medium"
            >
              + Redactar Aviso
            </Link>
            
            <Link href="/" className="text-gray-600 hover:underline flex items-center">
              Volver al inicio
            </Link>
          </div>
        </div>

       {noticias.map((noticia) => (
            <article key={noticia.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-blue-900">{noticia.titulo}</h2>
                <span className="text-sm text-gray-400">
                  {noticia.publicadoEn.toLocaleDateString()}
                </span>
              </div>
              
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {noticia.contenido}
              </div>

              {/* PIE DE LA TARJETA: Aquí hemos hecho el cambio para separar Autor y Botón */}
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                
                {/* IZQUIERDA: Autor */}
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {noticia.autor.nombre ? noticia.autor.nombre[0] : 'A'}
                  </div>
                  <span>Publicado por <span className="font-semibold">{noticia.autor.nombre || noticia.autor.email}</span></span>
                </div>

                {/* DERECHA: Botones de Acción */}
                <div className="flex items-center gap-2">
                  {/* Botón EDITAR (NUEVO) */}
                  <Link 
                    href={`/noticias/editar/${noticia.id}`}
                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded text-sm font-medium transition flex items-center gap-1"
                  >
                    ✏️ Editar
                  </Link>

                  {/* Botón BORRAR */}
                  <form action={borrarNoticia}>
                    <input type="hidden" name="id" value={noticia.id} />
                    <button 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded text-sm font-medium transition flex items-center gap-1"
                      title="Eliminar esta noticia"
                    >
                      🗑️ Borrar
                    </button>
                  </form>
                </div>

              </div>
            </article>
          ))}
      </div>
    </div>
  )
}
