'use client'

import { useState } from 'react'
import { marcarNotificacionLeida } from '@/app/actions'

type Notificacion = {
  id: number
  mensaje: string
  leido: boolean
  creadoEn: Date
}

export default function Notificaciones({ lista }: { lista: Notificacion[] }) {
  const [abierto, setAbierto] = useState(false)
  
  // Filtramos las no leídas para poner el contador rojo
  const noLeidas = lista.filter(n => !n.leido).length

  async function handleMarcarLeida(id: number) {
    await marcarNotificacionLeida(id)
    // No hace falta actualizar estado local porque el Server Action hará revalidatePath
  }

  return (
    <div className="relative">
      {/* BOTÓN CAMPANA */}
      <button 
        onClick={() => setAbierto(!abierto)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition flex items-center justify-center rounded-xl hover:bg-slate-100/50"
      >
        <svg className="w-5 h-5 text-slate-500 hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        {noLeidas > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse leading-none">
            {noLeidas}
          </span>
        )}
      </button>

      {/* DESPLEGABLE */}
      {abierto && (
        <>
          {/* Fondo invisible para cerrar al hacer click fuera */}
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)}></div>
          
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden">
            <div className="bg-slate-50/80 p-3.5 border-b border-slate-100 font-bold text-slate-700 text-sm flex justify-between">
              <span>Notificaciones</span>
              <span className="text-xs text-slate-400 font-normal">{lista.length} total</span>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {lista.length === 0 ? (
                <p className="p-5 text-sm text-slate-400 text-center font-medium">No tienes notificaciones pendientes.</p>
              ) : (
                lista.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-3 border-b border-slate-50 last:border-0 text-sm hover:bg-slate-50/50 transition flex justify-between gap-2 ${notif.leido ? 'opacity-50' : 'bg-blue-50/30'}`}
                  >
                    <div className="flex-1">
                      <p className="text-slate-700 leading-snug">{notif.mensaje}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        {new Date(notif.creadoEn).toLocaleString()}
                      </p>
                    </div>
                    {!notif.leido && (
                      <button 
                        onClick={() => handleMarcarLeida(notif.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold self-start whitespace-nowrap bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors shadow-sm"
                        title="Marcar como leída"
                      >
                        Leída
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}