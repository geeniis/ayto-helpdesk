'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'

export default function Filtros({ t }: { t: any }) {
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
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input
          type="text"
          className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          placeholder={t.filtros.buscar}
          onChange={(e) => handleFilter('query', e.target.value)}
          defaultValue={searchParams.get('query')?.toString()}
        />
      </div>

      {/* 2. FILTRO DE CATEGORÍA */}
      <select 
        className="rounded-xl border border-slate-200 py-2 px-3 text-sm shadow-sm focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
        onChange={(e) => handleFilter('categoria', e.target.value)}
        defaultValue={searchParams.get('categoria')?.toString()}
      >
        <option value="">{t.filtros.todasCategorias}</option>
        <option value="HARDWARE">{t.valores.HARDWARE}</option>
        <option value="SOFTWARE">{t.valores.SOFTWARE}</option>
        <option value="RED">{t.valores.RED}</option>
        <option value="CUENTAS">{t.valores.CUENTAS}</option>
        <option value="OTROS">{t.valores.OTROS}</option>
      </select>

      {/* 3. FILTRO DE PRIORIDAD */}
      <select 
        className="rounded-xl border border-slate-200 py-2 px-3 text-sm shadow-sm focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
        onChange={(e) => handleFilter('prioridad', e.target.value)}
        defaultValue={searchParams.get('prioridad')?.toString()}
      >
        <option value="">{t.filtros.prioridad}</option>
        <option value="ALTA">{t.valores.ALTA}</option>
        <option value="MEDIA">{t.valores.MEDIA}</option>
        <option value="BAJA">{t.valores.BAJA}</option>
      </select>

      {/* 4. FILTRO DE ESTADO (ACTIVAS / ARCHIVADAS) */}
      <select 
        className="rounded-xl border border-slate-200 py-2 px-3 text-sm shadow-sm focus:outline-none focus:border-blue-500 bg-white cursor-pointer font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        onChange={(e) => handleFilter('estado', e.target.value)}
        defaultValue={searchParams.get('estado')?.toString()}
      >
        <option value="">{t.filtros.activas}</option>
        <option value="RESUELTO">{t.filtros.resueltas}</option>
      </select>
    </div>
  )
}