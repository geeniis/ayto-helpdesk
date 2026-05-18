import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Graficos from './Graficos';

export default async function EstadisticasPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect('/login');

  const admin = await prisma.usuario.findUnique({ where: { id: parseInt(session.user.id) } });
  if (admin?.rol !== 'ADMIN') return redirect('/');

  // 1. Obtener datos por categoría
  const ticketsPorCategoria = await prisma.ticket.groupBy({
    by: ['categoria'],
    _count: { categoria: true }
  });

  const datosCategoria = ticketsPorCategoria.map(t => ({
    name: t.categoria,
    value: t._count.categoria
  }));

  // 2. Obtener datos por estado
  const countAbierto = await prisma.ticket.count({ where: { estado: 'ABIERTO' }});
  const countProceso = await prisma.ticket.count({ where: { estado: 'EN_PROCESO' }});
  const countResuelto = await prisma.ticket.count({ where: { estado: 'RESUELTO' }});

  const datosEstado = [
    { name: 'Abierto', cantidad: countAbierto },
    { name: 'Proceso', cantidad: countProceso },
    { name: 'Resuelto', cantidad: countResuelto }
  ];

  // 3. Obtener evolución (Simplificado: agrupando por mes actual)
  // Nota: En SQLite/Prisma extraer el mes requiere funciones raw, así que contaremos los de los últimos 30 días
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  
  const recientes = await prisma.ticket.findMany({
    where: { creadoEn: { gte: hace30Dias } },
    select: { creadoEn: true }
  });

  // Agrupar por día
  const mapaFechas: Record<string, number> = {};
  recientes.forEach(t => {
    const fecha = t.creadoEn.toISOString().split('T')[0];
    mapaFechas[fecha] = (mapaFechas[fecha] || 0) + 1;
  });

  const datosEvolucion = Object.keys(mapaFechas).sort().map(fecha => ({
    fecha: fecha.slice(5), // Solo MM-DD
    tickets: mapaFechas[fecha]
  }));

  const totalTickets = await prisma.ticket.count();
  const tiempoMedio = "Aprox. 4.5 horas"; // Simulado para la demo

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/80 via-slate-50 to-blue-50/80 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        <div className="glass flex justify-between items-center p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
            Panel Analítico
          </h1>
          <Link href="/" className="bg-white/60 hover:bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl font-medium transition-colors text-sm shadow-sm">
            Volver al Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 rounded-3xl shadow-md border-l-4 border-l-blue-500">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Histórico</p>
            <p className="text-3xl font-extrabold text-slate-800">{totalTickets} <span className="text-sm font-medium text-slate-400">tickets</span></p>
          </div>
          <div className="glass-card p-6 rounded-3xl shadow-md border-l-4 border-l-emerald-500">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tasa de Resolución</p>
            <p className="text-3xl font-extrabold text-slate-800">
              {totalTickets > 0 ? Math.round((countResuelto / totalTickets) * 100) : 0}%
            </p>
          </div>
          <div className="glass-card p-6 rounded-3xl shadow-md border-l-4 border-l-purple-500">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">SLA Promedio</p>
            <p className="text-3xl font-extrabold text-slate-800">{tiempoMedio}</p>
          </div>
        </div>

        {/* Pasamos los datos calculados en el servidor al componente cliente */}
        <Graficos 
          datosCategoria={datosCategoria} 
          datosEstado={datosEstado} 
          datosEvolucion={datosEvolucion} 
        />
        
      </div>
    </div>
  );
}
