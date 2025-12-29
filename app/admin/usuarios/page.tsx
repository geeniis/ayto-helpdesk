import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { cambiarRolUsuario } from '@/app/actions'
import Link from 'next/link'

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user?.id) return redirect('/login')

  // 1. Protección de ruta: Solo entran Admins
  const yo = await prisma.usuario.findUnique({ where: { id: parseInt(session.user.id) } })
  if (yo?.rol !== 'ADMIN') {
    return (
      <div className="p-8 text-center">
        <h1 className="text-red-600 text-2xl font-bold">⛔ Acceso Denegado</h1>
        <p>No tienes permisos de administrador.</p>
        <Link href="/" className="text-blue-600 hover:underline mt-4 block">Volver al inicio</Link>
      </div>
    )
  }

  // 2. Cargar todos los usuarios
  const usuarios = await prisma.usuario.findMany({
    orderBy: { nombre: 'asc' }
  })

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">👮 Gestión de Usuarios</h1>
          <Link href="/" className="text-blue-600 hover:underline">← Volver al Dashboard</Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Rol Actual</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{usuario.nombre}</td>
                  <td className="px-6 py-4">{usuario.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      usuario.rol === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {/* Evitar cambiarse el rol a uno mismo para no bloquearse */}
                    {usuario.id !== yo.id && (
                      <form action={cambiarRolUsuario}>
                        <input type="hidden" name="usuarioId" value={usuario.id} />
                        {usuario.rol === 'USER' ? (
                          <button 
                            name="nuevoRol" 
                            value="ADMIN"
                            className="text-purple-600 hover:text-purple-900 font-medium border border-purple-200 px-3 py-1 rounded hover:bg-purple-50 transition"
                          >
                            Ascender a Admin ⬆️
                          </button>
                        ) : (
                          <button 
                            name="nuevoRol" 
                            value="USER"
                            className="text-gray-500 hover:text-gray-900 font-medium border border-gray-200 px-3 py-1 rounded hover:bg-gray-50 transition"
                          >
                            Degradar a User ⬇️
                          </button>
                        )}
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}