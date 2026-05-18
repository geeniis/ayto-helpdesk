import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const admin = await prisma.usuario.findUnique({ where: { id: parseInt(session.user.id) } });
  if (admin?.rol !== 'ADMIN') {
    return new NextResponse("No autorizado", { status: 401 });
  }

  // Obtener todos los tickets
  const tickets = await prisma.ticket.findMany({
    include: { creador: true },
    orderBy: { creadoEn: 'desc' }
  });

  // Generar CSV
  const cabeceras = "ID,Titulo,Estado,Prioridad,Categoria,Creador,Fecha Creacion\n";
  const filas = tickets.map(t => {
    const tituloLimpio = t.titulo.replace(/,/g, ''); // Quitar comas para no romper el CSV
    const fecha = t.creadoEn.toISOString().split('T')[0];
    return `${t.id},"${tituloLimpio}",${t.estado},${t.prioridad},${t.categoria},"${t.creador.nombre}",${fecha}`;
  }).join("\n");

  const csv = cabeceras + filas;

  // Devolver archivo
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="reporte_incidencias.csv"'
    }
  });
}
