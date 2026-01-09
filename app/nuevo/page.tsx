// 📂 Archivo: app/nuevo/page.tsx
import { getDiccionario } from '@/lib/diccionario'
import TicketForm from './TicketForm'

// NO PONER 'use client' AQUÍ.
export default async function NuevoTicketPage() {
  // 1. Obtenemos las traducciones en el servidor
  const { t } = await getDiccionario()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* 2. Se las pasamos al componente cliente */}
      <TicketForm t={t} />
    </div>
  )
}