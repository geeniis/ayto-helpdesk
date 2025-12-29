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
        className="relative p-2 text-gray-600 hover:text-blue-600 transition"
      >
        <span className="text-xl">🔔</span>
        {noLeidas > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
            {noLeidas}
          </span>
        )}
      </button>

      {/* DESPLEGABLE */}
      {abierto && (
        <>
          {/* Fondo invisible para cerrar al hacer click fuera */}
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)}></div>
          
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
            <div className="bg-gray-50 p-3 border-b font-bold text-gray-700 text-sm flex justify-between">
              <span>Notificaciones</span>
              <span className="text-xs text-gray-400 font-normal">{lista.length} total</span>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {lista.length === 0 ? (
                <p className="p-4 text-sm text-gray-400 text-center">Nada nuevo por aquí 😴</p>
              ) : (
                lista.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-3 border-b last:border-0 text-sm hover:bg-gray-50 transition flex justify-between gap-2 ${notif.leido ? 'opacity-50' : 'bg-blue-50'}`}
                  >
                    <div className="flex-1">
                      <p className="text-gray-800">{notif.mensaje}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(notif.creadoEn).toLocaleString()}
                      </p>
                    </div>
                    {!notif.leido && (
                      <button 
                        onClick={() => handleMarcarLeida(notif.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium self-start whitespace-nowrap"
                        title="Marcar como leída"
                      >
                        ✔
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