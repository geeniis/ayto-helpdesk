'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { getDiccionario, Lang } from '@/lib/diccionario'

interface Props {
  paginaActual: number
  totalPaginas: number
  diccionario: {
    anterior: string
    pagina: string
    de: string
    siguiente: string
  }
}

export default function Pagination({ paginaActual, totalPaginas, diccionario }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Si solo hay 1 página, no mostramos nada
  if (totalPaginas <= 1) return null

  // Función mágica: Crea la URL manteniendo los filtros existentes (lang, query, categoria...)
  const crearUrlPagina = (numeroPagina: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', numeroPagina.toString())
    return `${pathname}?${params.toString()}`
  }

  // Usamos las traducciones pasadas por props
  const t = diccionario

  return (
    <div className="flex justify-center items-center space-x-4 mt-8">
      
      {/* Botón ANTERIOR */}
      <Link
        href={crearUrlPagina(paginaActual - 1)}
        className={`px-4 py-2 border rounded-md transition text-sm font-medium ${
          paginaActual <= 1
            ? 'pointer-events-none opacity-50 bg-gray-100 text-gray-400'
            : 'bg-white hover:bg-gray-50 text-gray-700 shadow-sm'
        }`}
        aria-disabled={paginaActual <= 1}
      >
        ← {t.anterior}
      </Link>

      <span className="text-sm text-gray-600 font-medium">
        {t.pagina} {paginaActual} {t.de} {totalPaginas}
      </span>

      {/* Botón SIGUIENTE */}
      <Link
        href={crearUrlPagina(paginaActual + 1)}
        className={`px-4 py-2 border rounded-md transition text-sm font-medium ${
          paginaActual >= totalPaginas
            ? 'pointer-events-none opacity-50 bg-gray-100 text-gray-400'
            : 'bg-white hover:bg-gray-50 text-gray-700 shadow-sm'
        }`}
        aria-disabled={paginaActual >= totalPaginas}
      >
        {t.siguiente} →
      </Link>
    </div>
  )
}