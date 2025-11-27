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