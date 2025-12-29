'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'

export default function Search() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  // Esta función actualiza la URL cada vez que escribes
  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams)
    
    if (term) {
      params.set('query', term)
    } else {
      params.delete('query')
    }
    
    // replace actualiza la URL sin recargar la página
    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative flex flex-1 max-w-md">
      <input
        type="text"
        className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        placeholder="🔍 Buscar por título o descripción..."
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('query')?.toString()}
      />
    </div>
  )
}