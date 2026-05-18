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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md border border-slate-200">
          <span className="text-6xl mb-4 block">⛔</span>
          <h1 className="text-red-600 text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-slate-500 mb-6">No tienes permisos de administrador para ver esta sección.</p>
          <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition shadow">Volver al Dashboard</Link>
        </div>
      </div>
    )
  }

  // 2. Cargar todos los usuarios
  const usuarios = await prisma.usuario.findMany({
    orderBy: { nombre: 'asc' }
  })

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/80 via-slate-50 to-blue-50/80 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="glass flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl shadow-sm border border-slate-200 mb-8 gap-4">
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
            <span className="bg-slate-100 p-2 rounded-xl text-2xl shadow-inner">👮</span> Gestión de Usuarios
          </h1>
          <Link href="/" className="bg-white/60 hover:bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl font-medium transition-colors text-sm shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Volver al Dashboard
          </Link>
        </div>

        <div className="glass-card rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-extrabold">Nombre</th>
                  <th className="px-6 py-4 font-extrabold">Email</th>
                  <th className="px-6 py-4 font-extrabold">Rol Actual</th>
                  <th className="px-6 py-4 font-extrabold text-right">Acciones de Administrador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        {usuario.nombre[0].toUpperCase()}
                      </div>
                      {usuario.nombre}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{usuario.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-sm ${
                        usuario.rol === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {usuario.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                        
                        {/* GESTIÓN DE EQUIPOS (NUEVO) */}
                        <Link 
                          href={`/admin/usuarios/${usuario.id}/equipos`}
                          className="text-[11px] uppercase font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                        >
                          💻 Equipos
                        </Link>

                        {/* Evitar cambiarse el rol a uno mismo para no bloquearse */}
                        {usuario.id !== yo.id && (
                          <form action={cambiarRolUsuario}>
                            <input type="hidden" name="usuarioId" value={usuario.id} />
                            {usuario.rol === 'USER' ? (
                              <button 
                                name="nuevoRol" 
                                value="ADMIN"
                                className="text-[11px] uppercase font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                              >
                                Ascender ⬆️
                              </button>
                            ) : (
                              <button 
                                name="nuevoRol" 
                                value="USER"
                                className="text-[11px] uppercase font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                              >
                                Degradar ⬇️
                              </button>
                            )}
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}