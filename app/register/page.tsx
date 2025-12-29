import { registrarUsuario } from '@/app/actions'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-800">Crear Cuenta</h1>
          <p className="text-sm text-gray-500">Únete al HelpDesk del Ayuntamiento</p>
        </div>

        <form action={registrarUsuario} className="space-y-4">
          
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input 
              name="nombre" 
              type="text" 
              required 
              placeholder="Ej: Ana García"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="ana@ayto.es"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="******"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Rol (Opcional - Lo dejamos visible para pruebas, en real suele estar oculto) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select name="rol" className="w-full p-2 border rounded bg-white">
              <option value="USER">Usuario (Empleado)</option>
              <option value="ADMIN">Administrador (Técnico)</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-bold"
          >
            Registrarse
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">
            Inicia sesión aquí
          </Link>
        </p>

      </div>
    </div>
  )
}