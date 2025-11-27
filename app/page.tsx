import prisma from '@/lib/prisma'
import Link from 'next/link'
import { auth, signOut } from '@/auth' // <--- NUEVO IMPORT

export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await auth() // <--- Obtenemos la sesión del usuario actual
  
  const tickets = await prisma.ticket.findMany({
    include: { creador: true },
    orderBy: { creadoEn: 'desc' }
  })

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      
      {/* CABECERA CON USUARIO Y LOGOUT */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-blue-800">🚑 Ayto-HelpDesk</h1>
          <p className="text-sm text-gray-500">
            Hola, <span className="font-bold">{session?.user?.email}</span>
          </p>
        </div>

        <div className="flex gap-4 items-center">
          <Link 
            href="/nuevo" 
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
          >
            + Nuevo Ticket
          </Link>

          {/* Botón de Logout: En Next.js debe ser un formulario */}
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <button className="text-red-600 hover:text-red-800 text-sm font-semibold border border-red-200 px-3 py-2 rounded hover:bg-red-50 transition">
              Cerrar Sesión
            </button>
          </form>
        </div>
      </div>

      {/* LISTA DE TICKETS (Igual que antes) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-2">
              <Link href={`/ticket/${ticket.id}`} className="hover:underline">
                  <h2 className="text-xl font-semibold text-blue-900">{ticket.titulo}</h2>
              </Link>
              <span className={`px-2 py-1 text-xs font-bold rounded ${
                ticket.prioridad === 'ALTA' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {ticket.prioridad}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{ticket.descripcion}</p>
            <div className="text-sm text-gray-400 border-t pt-2 mt-2">
              <p>Reportado por: <span className="font-medium text-gray-600">{ticket.creador.nombre}</span></p>
              <p>Estado: {ticket.estado}</p>
            </div>
          </div>
        ))}
        {tickets.length === 0 && (
          <p className="text-gray-500 italic">No hay incidencias. ¡Todo funciona bien!</p>
        )}
      </div>
    </main>
  )
}