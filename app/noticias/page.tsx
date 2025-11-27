import prisma from '../../lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
          <Link href="/" className="text-blue-600 hover:underline">
            &larr; Volver al inicio
          </Link>
        </div>

        {/* Lista de Noticias */}
        <div className="space-y-6">
          {noticias.map((noticia: any) => (
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

              <div className="mt-4 pt-4 border-t text-sm text-gray-500 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  {noticia.autor.nombre ? noticia.autor.nombre[0] : 'A'}
                </div>
                <span>Publicado por <span className="font-semibold">{noticia.autor.nombre || noticia.autor.email}</span></span>
              </div>
            </article>
          ))}

          {noticias.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 text-lg">No hay noticias publicadas todavía.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}