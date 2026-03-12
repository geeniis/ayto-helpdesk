import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
        
        {/* Encabezado */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-800">Iniciar Sesión</h1>
          <p className="text-sm text-gray-500">Acceso al Ayto-HelpDesk</p>
        </div>

        {params?.error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">
            Correo o contraseña incorrectos
          </div>
        )}

        {/* Formulario de Login */}
        <form
          action={async (formData) => {
            "use server"
            try {
              await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirectTo: "/"
              })
            } catch (error) {
              if (error instanceof AuthError) {
                redirect("/login?error=credentials")
              }
              throw error
            }
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