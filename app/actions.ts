'use server' // Esto es OBLIGATORIO: le dice a Next.js que esto se ejecuta en el servidor

import prisma from '@/lib/prisma' // Asegúrate de que la ruta es correcta (@/lib/prisma o ../lib/prisma)
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { signIn, signOut } from '@/auth'
import { AuthError } from 'next-auth'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
// --- CREAR TICKET ---

async function verificarPermisos(ticketId: number, usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id: parseInt(usuarioId) } })
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })

  if (!usuario || !ticket) throw new Error("No encontrado")

  const esAdmin = usuario.rol === 'ADMIN'
  const esDuenio = ticket.creadorId === parseInt(usuarioId)

  return { esAdmin, esDuenio, ticket, usuario }
}
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
  
  const id = parseInt(formData.get('id') as string)

  // Verificamos permisos
  const { esAdmin, esDuenio } = await verificarPermisos(id, session.user.id)

  // Solo borra si es Admin o Dueño
  if (!esAdmin && !esDuenio) {
      throw new Error("No autorizado")
  }

  // ... borrado de comentarios y ticket (igual que tenías) ...
  await prisma.comentario.deleteMany({ where: { ticketId: id } })
  await prisma.ticket.delete({ where: { id } })

  revalidatePath('/')
  redirect('/')
}
// --- EDITAR TICKET (NUEVO) ---
export async function editarTicket(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return;

  const id = parseInt(formData.get('id') as string)
  
  // 1. VERIFICAMOS PERMISOS
  const { esAdmin, esDuenio, ticket } = await verificarPermisos(id, session.user.id)

  // Si no es dueño ni admin -> NO PUEDE TOCAR
  if (!esAdmin && !esDuenio) {
    throw new Error("No tienes permiso para editar este ticket")
  }

  const titulo = formData.get('titulo') as string
  const descripcion = formData.get('descripcion') as string
  const prioridad = formData.get('prioridad') as string
  const categoria = formData.get('categoria') as string
  
  // OJO AQUÍ: El estado solo se cambia si es ADMIN
  // Si es usuario normal, mantenemos el estado que ya tenía el ticket
  let estado = ticket.estado 
  if (esAdmin) {
      // Solo el admin lee el campo 'estado' del formulario
      estado = formData.get('estado') as string || ticket.estado
  }

  await prisma.ticket.update({
    where: { id },
    data: {
      titulo,
      descripcion,
      prioridad,
      categoria,
      estado // <--- Usamos la variable controlada
    }
  })

  // ... notificaciones y revalidate ...
  if (estado !== ticket.estado) { /* lógica de notificación si cambió estado */ }

  revalidatePath(`/ticket/${id}`)
  redirect(`/ticket/${id}`)
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
// --- REGISTRO DE USUARIOS ---

export async function registrarUsuario(formData: FormData) {
  const nombre = formData.get('nombre') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password || !nombre) {
    return // O podrías devolver un error
  }

  // 1. Comprobar si el email ya existe
  const existe = await prisma.usuario.findUnique({
    where: { email }
  })

  if (existe) {
    // En una app real, aquí devolveríamos un error al formulario
    console.log("El usuario ya existe")
    return
  }

  // 2. Encriptar la contraseña
  const hashedPassword = await bcrypt.hash(password, 10)

  // 3. Crear el usuario
  await prisma.usuario.create({
    data: {
      nombre,
      email,
      password: hashedPassword,
      rol: "USER" // Por defecto todos son USER
    }
  })

  // 4. Redirigir al login para que entre
  redirect('/login')
}
export async function cambiarRolUsuario(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return;

  // VERIFICAR QUE EL QUE EJECUTA ESTO ES ADMIN (¡IMPORTANTE!)
  const yo = await prisma.usuario.findUnique({ where: { id: parseInt(session.user.id) } })
  if (yo?.rol !== 'ADMIN') return;

  const usuarioId = parseInt(formData.get('usuarioId') as string)
  const nuevoRol = formData.get('nuevoRol') as string // 'ADMIN' o 'USER'

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { rol: nuevoRol }
  })

  revalidatePath('/admin/usuarios')
}

export async function cambiarEstadoTicket(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return;

  // 1. SEGURIDAD: Solo ADMIN puede cambiar estados
  const yo = await prisma.usuario.findUnique({ where: { id: parseInt(session.user.id) } })
  
  if (yo?.rol !== 'ADMIN') {
    throw new Error("⛔ Solo los administradores pueden cambiar el estado.")
  }

  const id = formData.get('id')
  const nuevoEstado = formData.get('estado') as string 

  if (!id || !nuevoEstado) return;

  const ticketId = parseInt(id.toString())

  // 2. Actualizamos el ticket
  const ticketActualizado = await prisma.ticket.update({
    where: { id: ticketId },
    data: { estado: nuevoEstado },
    include: { creador: true }
  })

  // 3. Notificamos al usuario
  if (ticketActualizado.creadorId !== yo.id) {
    await crearNotificacion(
      ticketActualizado.creadorId,
      `El estado de tu ticket ha cambiado a: ${nuevoEstado}`
    )
  }

  revalidatePath(`/ticket/${ticketId}`)
  revalidatePath('/') 
}