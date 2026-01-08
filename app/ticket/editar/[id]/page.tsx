import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
// IMPORTANTE: Importamos el componente cliente que creamos en el Paso 2
import EditarForm from './EditarForm' 

export default async function EditarTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()

  // 1. Protección básica: Si no hay sesión, al login
  if (!session?.user?.id) return redirect('/login')

  // 2. Buscamos el ticket
  const ticket = await prisma.ticket.findUnique({
    where: { id: parseInt(id) }
  })

  if (!ticket) notFound()

  // 3. Verificamos permisos (SEGURIDAD)
  // Necesitamos saber si el usuario actual es ADMIN
  const usuarioActual = await prisma.usuario.findUnique({ 
    where: { id: parseInt(session.user.id) }
  })

  const esAdmin = usuarioActual?.rol === 'ADMIN'
  const esDuenio = ticket.creadorId === parseInt(session.user.id)

  // Si no es ni admin ni el dueño, lo echamos fuera
  if (!esAdmin && !esDuenio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">⛔ Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permiso para editar este ticket.</p>
          <a href="/" className="block mt-4 text-blue-600 hover:underline">Volver al inicio</a>
        </div>
      </div>
    )
  }

  // 4. Renderizamos la página
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          ✏️ Editar Ticket #{ticket.id}
        </h1>
        
        {/* Renderizamos el componente CLIENTE con el formulario interactivo */}
        <EditarForm ticket={ticket} esAdmin={esAdmin} />
        
      </div>
    </div>
  )
}