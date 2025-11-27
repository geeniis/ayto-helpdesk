import prisma from '@/lib/prisma'
import { cambiarEstadoTicket, borrarTicket } from '@/app/actions'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// Definimos que 'params' ahora es una Promesa
interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TicketDetallePage({ params }: PageProps) {
  // 1. ¡EL CAMBIO CLAVE! Esperamos a que lleguen los parámetros
  const { id } = await params
  const ticketId = parseInt(id)

  // A partir de aquí, todo sigue igual que antes...
  
  // 2. Buscamos el ticket en la BD
  // Validamos que el ID sea un número válido antes de llamar a Prisma
  if (isNaN(ticketId)) {
     redirect('/')
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { creador: true }
  })

  // 3. Si no existe, lo mandamos a la home
  if (!ticket) {
    redirect('/')
  }

  // 4. Preparamos los botones
  const cerrarTicket = cambiarEstadoTicket.bind(null, ticket.id, 'CERRADO')
  const abrirTicket = cambiarEstadoTicket.bind(null, ticket.id, 'ABIERTO')
  const enProcesoTicket = cambiarEstadoTicket.bind(null, ticket.id, 'EN_PROCESO')
  const eliminarEsteTicket = borrarTicket.bind(null, ticket.id)

  return (
    <div className="min-h-screen p-8 bg-gray-50 flex justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl h-fit border-t-4 border-blue-600">
        
        {/* Cabecera */}
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Ticket #{ticket.id}</h1>
          <span className={`px-3 py-1 text-sm font-bold rounded-full ${
            ticket.estado === 'CERRADO' ? 'bg-gray-200 text-gray-600' : 
            ticket.estado === 'EN_PROCESO' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {ticket.estado}
          </span>
        </div>

        {/* Detalles */}
        <h2 className="text-xl font-semibold mb-2">{ticket.titulo}</h2>
        <div className="bg-gray-50 p-4 rounded-md border mb-6 text-gray-700 whitespace-pre-wrap">
          {ticket.descripcion}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-8">
          <div><p className="font-semibold">Prioridad:</p><p>{ticket.prioridad}</p></div>
          <div><p className="font-semibold">Creado por:</p><p>{ticket.creador.nombre}</p></div>
          <div><p className="font-semibold">Fecha:</p><p>{ticket.creadoEn.toLocaleDateString()}</p></div>
        </div>

        {/* Botonera */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase">Acciones Técnicas</h3>
          <div className="flex flex-wrap gap-3">
            
            {ticket.estado !== 'CERRADO' && (
              <form action={cerrarTicket}>
                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
                  ✅ Marcar Resuelto
                </button>
              </form>
            )}

            {ticket.estado === 'ABIERTO' && (
               <form action={enProcesoTicket}>
                 <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition">
                   ⚙️ En Proceso
                 </button>
               </form>
            )}

            {ticket.estado === 'CERRADO' && (
               <form action={abrirTicket}>
                 <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition">
                   🔓 Reabrir
                 </button>
               </form>
            )}
            
            <div className="flex-grow"></div> 

            <form action={eliminarEsteTicket}>
               <button className="text-red-500 hover:text-red-700 px-4 py-2 font-medium">
                 🗑️ Eliminar
               </button>
            </form>
          </div>
        </div>

        <div className="mt-6 pt-4 text-center">
            <Link href="/" className="text-blue-600 hover:underline">
                &larr; Volver al listado
            </Link>
        </div>

      </div>
    </div>
  )
}