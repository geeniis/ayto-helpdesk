'use server' // Esto es OBLIGATORIO: le dice a Next.js que esto se ejecuta en el servidor

import prisma from '../lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { auth } from '@/auth'

export async function crearTicket(formData: FormData) {
  try {
    // 1. Obtenemos la sesión para saber quién eres
    const session = await auth()
    
    // Si no hay usuario logueado o no tiene ID, paramos todo (Seguridad)
    if (!session?.user?.id) {
       throw new Error("Usuario no identificado")
    }

    const titulo = formData.get('titulo') as string
    const descripcion = formData.get('descripcion') as string
    const prioridad = formData.get('prioridad') as string

    await prisma.ticket.create({
      data: {
        titulo,
        descripcion,
        prioridad,
        // 2. ¡AQUÍ ESTÁ EL CAMBIO! Usamos tu ID real
        // Convertimos el ID de string a número porque la base de datos espera un número
        creadorId: parseInt(session.user.id), 
      },
    })

    revalidatePath('/')
    
  } catch (error) {
    console.error("❌ Error creando el ticket:", error)
    // Opcional: Podrías redirigir a una página de error
  }
  
  redirect('/')
}

export async function cambiarEstadoTicket(id: number, nuevoEstado: string) {
  try {
    await prisma.ticket.update({
      where: { id: id },
      data: { estado: nuevoEstado }
    })
    
    revalidatePath('/') // Actualiza la home
    revalidatePath(`/ticket/${id}`) // Actualiza la página del ticket
    
  } catch (error) {
    console.error("Error actualizando ticket:", error)
  }
}

export async function borrarTicket(id: number) {
  try {
    await prisma.ticket.delete({
      where: { id: id }
    })
    revalidatePath('/')
  } catch (error) {
    console.error("Error borrando ticket:", error)
  }
}

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

export async function crearNoticia(formData: FormData) {
  // 1. Verificar quién eres
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Debes iniciar sesión para publicar noticias")
  }

  // 2. Recoger datos del formulario
  const titulo = formData.get('titulo') as string
  const contenido = formData.get('contenido') as string

  // 3. Guardar en Base de Datos
  await prisma.noticia.create({
    data: {
      titulo,
      contenido,
      autorId: parseInt(session.user.id), // Se guarda con TU firma
    },
  })

  // 4. Actualizar la lista y volver
  revalidatePath('/noticias')
  redirect('/noticias')
}

export async function borrarNoticia(formData: FormData) {
  // 1. Verificamos sesión
  const session = await auth()
  if (!session?.user?.id) return;

  const id = formData.get('id')
  if (!id) return;

  try {
    // 2. Borramos la noticia
    await prisma.noticia.delete({
      where: {
        id: parseInt(id.toString())
      }
    })

    // 3. Refrescamos la página
    revalidatePath('/noticias')
    
  } catch (error) {
    console.error("Error borrando noticia:", error)
  }
}

export async function editarNoticia(formData: FormData) {
  // 1. Verificamos sesión
  const session = await auth()
  if (!session?.user?.id) return;

  // 2. Recogemos datos
  const id = formData.get('id')
  const titulo = formData.get('titulo') as string
  const contenido = formData.get('contenido') as string

  if (!id) return;

  // 3. Actualizamos en base de datos
  await prisma.noticia.update({
    where: { 
      id: parseInt(id.toString()) 
    },
    data: { 
      titulo, 
      contenido 
    }
  })

  // 4. Volvemos al listado
  revalidatePath('/noticias')
  redirect('/noticias')
}

export async function agregarComentario(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return;

  const ticketId = formData.get('ticketId')
  const contenido = formData.get('contenido') as string
  // Si el checkbox está marcado, 'interno' valdrá "on", si no, será null
  const esInterno = formData.get('interno') === 'on'

  if (!ticketId || !contenido) return;

  await prisma.comentario.create({
    data: {
      contenido,
      interno: esInterno,
      ticketId: parseInt(ticketId.toString()),
      autorId: parseInt(session.user.id)
    }
  })

  // Recargamos la página del ticket para ver el mensaje nuevo
  revalidatePath(`/ticket/${ticketId}`)
}

// ... (Tus funciones anteriores)

// --- BORRAR COMENTARIO ---
export async function borrarComentario(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return;

  const id = formData.get('id')
  const ticketId = formData.get('ticketId') // Necesitamos saber de qué ticket era para volver

  if (!id || !ticketId) return;

  // Solo dejamos borrar si eres el dueño (o podrías añadir check de admin aquí)
  // Por simplicidad, asumimos que el botón solo se muestra si puedes borrarlo.
  
  await prisma.comentario.delete({
    where: { id: parseInt(id.toString()) }
  })

  revalidatePath(`/ticket/${ticketId}`)
}

// --- EDITAR COMENTARIO ---
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

  // Volvemos al ticket
  revalidatePath(`/ticket/${ticketId}`)
  redirect(`/ticket/${ticketId}`)
}