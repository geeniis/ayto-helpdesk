import { signIn } from '@/auth'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
        
        {/* Encabezado */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-800">Iniciar Sesión</h1>
          <p className="text-sm text-gray-500">Acceso al Ayto-HelpDesk</p>
        </div>

        {/* Formulario de Login */}
        <form
          action={async (formData) => {
            "use server"
            await signIn("credentials", formData)
          }}
          className="space-y-4"
        >
          {/* Campo Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input 
              name="email" 
              type="email" 
              placeholder="usuario@ejemplo.com" 
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Campo Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input 
              name="password" 
              type="password" 
              placeholder="******" 
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          {/* Botón Entrar */}
          <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-bold shadow-sm">
            Entrar
          </button>
        </form>

        {/* --- AQUÍ ESTÁ EL ENLACE AL REGISTRO (LO NUEVO) --- */}
        <p className="text-center mt-6 text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
        <a href="/register" className="text-blue-600 font-medium hover:underline">
  Regístrate aquí
</a>
        </p>

      </div>
    </div>
  )
}