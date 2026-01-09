'use client'

import { cambiarIdioma } from '@/app/actions/idiomas'
import { useTransition } from 'react'

// Recibimos el idioma actual como prop para pintar el botón activo
export default function LanguageSwitch({ currentLang }: { currentLang: string }) {
  const [isPending, startTransition] = useTransition()

  const handleCambio = (lang: string) => {
    startTransition(() => {
      cambiarIdioma(lang)
    })
  }

  return (
    <div className="flex bg-gray-100 rounded-lg p-1 text-xs font-medium border border-gray-200">
      <button
        onClick={() => handleCambio('es')}
        disabled={isPending}
        className={`px-2 py-1 rounded transition ${currentLang === 'es' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
      >
        ES
      </button>
      <button
        onClick={() => handleCambio('ca')}
        disabled={isPending}
        className={`px-2 py-1 rounded transition ${currentLang === 'ca' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
      >
        CA
      </button>
    </div>
  )
}