'use server' // Esto es OBLIGATORIO: le dice a Next.js que esto se ejecuta en el servidor

import prisma from '@/lib/prisma' // Asegúrate de que la ruta es correcta (@/lib/prisma o ../lib/prisma)
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { signIn, signOut } from '@/auth'
import { AuthError } from 'next-auth'
import { auth } from '@/auth'

// --- CREAR TICKET ---
export async function crearTicket(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Usuario no identificado")

    const titulo = formData.get('titulo') as string
    const descripcion = formData.get('descripcion') as string
    const prioridad = formData.get('prioridad') as string
    const categoria = formData.get('categoria') as string
    await prisma.ticket.create({
      data: {
        titulo,
        descripcion,
        prioridad,
        categoria, 
        creadorId: parseInt(session.user.id), 
      },
    })
    revalidatePath('/')
  } catch (error) {
    console.error("❌ Error creando el ticket:", error)
  }
  redirect('/')
}

// --- BORRAR TICKET (Actualizado para FormData y limpieza de comentarios) ---
export async function borrarTicket(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return;

  const id = formData.get('id')
  if (!id) return;

  const ticketId = parseInt(id.toString())

  try {
    // 1. Primero borramos los comentarios asociados (limpieza)
    await prisma.comentario.deleteMany({
      where: { ticketId: ticketId }
    })

    // 2. Ahora sí borramos el ticket
    await prisma.ticket.delete({
      where: { id: ticketId }
    })

    revalidatePath('/')
  } catch (error) {
    console.error("Error borrando ticket:", error)
    return; // Si falla, no redirigimos para poder ver el error
  }
  
  // 3. Redirigimos al inicio
  redirect('/')
}

// --- EDITAR TICKET (NUEVO) ---
export async function editarTicket(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return;

  const id = formData.get('id')
  const titulo = formData.get('titulo') as string
  const descripcion = formData.get('descripcion') as string
  const prioridad = formData.get('prioridad') as string
  const categoria = formData.get('categoria') as string

  if (!id || !titulo) return;

  await prisma.ticket.update({
    where: { id: parseInt(id.toString()) },
    data: {
      titulo,
      descripcion,
      prioridad,
      categoria
    }
  })

  revalidatePath(`/ticket/${id}`)
  redirect(`/ticket/${id}`)
}

export async function cambiarEstadoTicket(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return;

  const id = formData.get('id')
  const nuevoEstado = formData.get('estado') as string 

  if (!id || !nuevoEstado) return;

  const ticketId = parseInt(id.toString())

  // 1. Actualizamos el ticket
  const ticketActualizado = await prisma.ticket.update({
    where: { id: ticketId },
    data: { estado: nuevoEstado },
    include: { creador: true } // Necesitamos saber quién es el creador para avisarle
  })

  // 2. ¡DISPARAMOS LA NOTIFICACIÓN! (NUEVO)
  // Le avisamos al creador del ticket (ticketActualizado.creadorId)
  await crearNotificacion(
    ticketActualizado.creadorId,
    `Tu ticket "${ticketActualizado.titulo}" ha cambiado a estado: ${nuevoEstado}`
  )

  revalidatePath(`/ticket/${id}`)
  revalidatePath('/') 
}

// --- AUTENTICACIÓN ---
export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', { ...Object.fromEntries(formData), redirectTo: '/' })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Credenciales inválidas. Revisa tu email o contraseña.';
        default:
          return 'Algo salió mal. Inténtalo de nuevo.';
      }
    }
    throw error;
  }
}

// --- NOTICIAS (CREAR) ---
export async function crearNoticia(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Debes iniciar sesión")

  const titulo = formData.get('titulo') as string
  const contenido = formData.get('contenido') as string

  await prisma.noticia.create({
    data: {
      titulo,
      contenido,
      autorId: parseInt(session.user.id),
    },
  })

  revalidatePath('/noticias')
  redirect('/noticias')
}

// --- NOTICIAS (BORRAR) ---
export async function borrarNoticia(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return;

  const id = formData.get('id')
  if (!id) return;

  await prisma.noticia.delete({
    where: { id: parseInt(id.toString()) }
  })

  revalidatePath('/noticias')
}

// --- NOTICIAS (EDITAR) ---
export async function editarNoticia(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return;

  const id = formData.get('id')
  const titulo = formData.get('titulo') as string
  const contenido = formData.get('contenido') as string

  if (!id) return;

  await prisma.noticia.update({
    where: { id: parseInt(id.toString()) },
    data: { titulo, contenido }
  })

  revalidatePath('/noticias')
  redirect('/noticias')
}

// --- COMENTARIOS (AGREGAR) ---
export async function agregarComentario(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return;

  const ticketId = parseInt(formData.get('ticketId')?.toString() || '0')
  const contenido = formData.get('contenido') as string
  const esInterno = formData.get('interno') === 'on'

  if (!ticketId || !contenido) return;

  // 1. Guardamos el comentario
  await prisma.comentario.create({
    data: {
      contenido,
      interno: esInterno,
      ticketId: ticketId,
      autorId: parseInt(session.user.id)
    }
  })

  // 2. Buscamos el ticket para saber de quién es
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  
  if (ticket && ticket.creadorId !== parseInt(session.user.id)) {
      // Solo notificamos si el que comenta NO es el dueño del ticket (para no auto-notificarse)
      await crearNotificacion(
        ticket.creadorId,
        `Nuevo comentario en tu ticket: "${ticket.titulo}"`
      )
  }

  revalidatePath(`/ticket/${ticketId}`)
}

// --- COMENTARIOS (BORRAR) ---
export async function borrarComentario(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return;

  const id = formData.get('id')
  const ticketId = formData.get('ticketId') 

  if (!id || !ticketId) return;
  
  await prisma.comentario.delete({
    where: { id: parseInt(id.toString()) }
  })

  revalidatePath(`/ticket/${ticketId}`)
}

// --- COMENTARIOS (EDITAR) ---
export async function editarComentario(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return;

  const id = formData.get('id')
  const ticketId = formData.get('ticketId')
  const contenido = formData.get('contenido') as string
  const esInterno = formData.get('interno') === 'on'

  if (!id || !ticketId) return;

  await prisma.comentario.update({
    where: { id: parseInt(id.toString()) },
    data: {
      contenido,
      interno: esInterno
    }
  })

  revalidatePath(`/ticket/${ticketId}`)
  redirect(`/ticket/${ticketId}`)
}

// --- NOTIFICACIONES (Lógica Interna) ---

// Esta función no se exporta como acción, la usamos nosotros dentro de otras acciones
async function crearNotificacion(usuarioId: number, mensaje: string) {
  try {
    await prisma.notificacion.create({
      data: {
        usuarioId,
        mensaje
      }
    })
  } catch (e) {
    console.error("Error creando notificación:", e)
  }
}

// Esta SÍ se exporta para usarla desde el botón de la campanita
export async function marcarNotificacionLeida(id: number) {
  await prisma.notificacion.update({
    where: { id },
    data: { leido: true }
  })
  revalidatePath('/')
}

