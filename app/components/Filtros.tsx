'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'

export default function Filtros() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  // Función genérica para actualizar cualquier filtro
  function handleFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams)
    
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
      
      {/* 1. BUSCADOR DE TEXTO (Título, Descripción, Usuario) */}
      <div className="relative flex-1 min-w-[200px]">
        <input
          type="text"
          className="w-full rounded-md border border-gray-200 py-2 pl-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="🔍 Buscar texto o usuario..."
          onChange={(e) => handleFilter('query', e.target.value)}
          defaultValue={searchParams.get('query')?.toString()}
        />
      </div>

      {/* 2. FILTRO DE CATEGORÍA */}
      <select 
        className="rounded-md border border-gray-200 py-2 px-3 text-sm shadow-sm focus:border-blue-500 bg-white cursor-pointer"
        onChange={(e) => handleFilter('categoria', e.target.value)}
        defaultValue={searchParams.get('categoria')?.toString()}
      >
        <option value="">📂 Todas las Categorías</option>
        <option value="HARDWARE">🖥️ Hardware</option>
        <option value="SOFTWARE">💾 Software</option>
        <option value="RED">🌐 Red</option>
        <option value="CUENTAS">🔑 Cuentas</option>
        <option value="OTROS">❓ Otros</option>
      </select>

      {/* 3. FILTRO DE PRIORIDAD (Opcional, pero útil) */}
      <select 
        className="rounded-md border border-gray-200 py-2 px-3 text-sm shadow-sm focus:border-blue-500 bg-white cursor-pointer"
        onChange={(e) => handleFilter('prioridad', e.target.value)}
        defaultValue={searchParams.get('prioridad')?.toString()}
      >
        <option value="">⚡ Prioridad</option>
        <option value="ALTA">🔴 Alta</option>
        <option value="MEDIA">🟡 Media</option>
        <option value="BAJA">🟢 Baja</option>
      </select>
    </div>
  )
}