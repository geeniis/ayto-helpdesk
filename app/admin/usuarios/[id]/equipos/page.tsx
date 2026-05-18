import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { crearEquipoUsuario, borrarEquipo } from '@/app/actions'

export default async function GestionEquiposUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return redirect('/login')

  const yo = await prisma.usuario.findUnique({ where: { id: parseInt(session.user.id) } })
  if (yo?.rol !== 'ADMIN') return redirect('/')

  const usuario = await prisma.usuario.findUnique({
    where: { id: parseInt(id) },
    include: { equipos: true }
  })

  if (!usuario) notFound()

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/80 via-slate-50 to-blue-50/80 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto">
        
        {/* CABECERA */}
        <div className="glass flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl shadow-sm border border-slate-200 mb-8 gap-4">
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
            <span className="bg-blue-100 p-2 rounded-xl text-2xl shadow-inner">💻</span> 
            <div>
              <span className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Inventario</span>
              Equipos de {usuario.nombre}
            </div>
          </h1>
          <Link href="/admin/usuarios" className="bg-white/60 hover:bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl font-medium transition-colors text-sm shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Volver
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* FORMULARIO ASIGNAR EQUIPO */}
          <div className="md:col-span-4">
            <div className="glass-card p-6 rounded-3xl shadow-lg border border-slate-200">
              <h2 className="font-extrabold text-slate-700 uppercase tracking-widest text-xs mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="text-blue-500">➕</span> Asignar Equipo
              </h2>
              <form action={crearEquipoUsuario} className="space-y-4">
                <input type="hidden" name="usuarioId" value={usuario.id} />
                
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 ml-1">Tipo</label>
                  <select name="tipo" required className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50 shadow-inner focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-700 cursor-pointer">
                    <option value="Portátil">Portátil</option>
                    <option value="Sobremesa">PC Sobremesa</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Teléfono">Teléfono Móvil</option>
                    <option value="Periférico">Periférico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 ml-1">Marca</label>
                  <input type="text" name="marca" required placeholder="Ej. Dell, HP, Apple" className="w-full rounded-xl border border-slate-200 p-3 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 ml-1">Modelo</label>
                  <input type="text" name="modelo" placeholder="Ej. Latitude 5420" className="w-full rounded-xl border border-slate-200 p-3 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 ml-1">Número de Serie (S/N)</label>
                  <input type="text" name="numeroSerie" placeholder="Ej. ABC123XYZ" className="w-full rounded-xl border border-slate-200 p-3 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono uppercase" />
                </div>

                <button type="submit" className="w-full bg-slate-900 text-white font-bold px-4 py-3 rounded-xl hover:bg-blue-600 transition-colors shadow-md hover:-translate-y-0.5 transform mt-4">
                  Asignar a {usuario.nombre.split(' ')[0]}
                </button>
              </form>
            </div>
          </div>

          {/* LISTA DE EQUIPOS ACTUALES */}
          <div className="md:col-span-8">
            <div className="glass-card rounded-3xl p-6 shadow-sm border border-slate-200 min-h-[400px]">
              <h2 className="font-extrabold text-slate-700 uppercase tracking-widest text-xs mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="text-indigo-500">📋</span> Equipos Asignados ({usuario.equipos.length})
              </h2>

              {usuario.equipos.length === 0 ? (
                <div className="text-center py-16 opacity-50">
                  <span className="text-5xl block mb-4">📭</span>
                  <p className="text-sm font-medium">Este usuario no tiene ningún equipo a su cargo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {usuario.equipos.map((equipo) => (
                    <div key={equipo.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase rounded border border-indigo-100 shadow-sm">{equipo.tipo}</span>
                        <form action={borrarEquipo}>
                          <input type="hidden" name="id" value={equipo.id} />
                          <input type="hidden" name="usuarioId" value={usuario.id} />
                          <button className="text-slate-400 hover:text-red-500 p-1 opacity-50 group-hover:opacity-100 transition-opacity bg-slate-50 rounded hover:bg-red-50" title="Retirar equipo">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </form>
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">{equipo.marca} {equipo.modelo}</h3>
                      <p className="text-[11px] mt-3 font-mono bg-slate-100 text-slate-500 inline-block px-2 py-1 rounded border border-slate-200 w-full truncate">
                        <span className="font-bold">S/N:</span> {equipo.numeroSerie || 'Desconocido'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
