'use client' // Esto es necesario porque el formulario tiene interacción (hooks)

import { authenticate } from '@/app/actions'
import { useActionState } from 'react'
 
export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined)
 
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md border-t-4 border-blue-600">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          🔐 Ayto-HelpDesk
        </h1>
        
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              id="email"
              type="email"
              name="email"
              placeholder="usuario@ayto.es"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              Contraseña
            </label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              id="password"
              type="password"
              name="password"
              placeholder="******"
              required
              minLength={6}
            />
          </div>

          {/* Mensaje de error si falla el login */}
          {errorMessage && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              ⚠️ {errorMessage}
            </div>
          )}

          <button
            className="w-full rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 transition disabled:opacity-50"
            aria-disabled={isPending}
            disabled={isPending} // Desactiva el botón mientras carga
          >
            {isPending ? 'Entrando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}