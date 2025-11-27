'use server' // Esto es OBLIGATORIO: le dice a Next.js que esto se ejecuta en el servidor

import prisma from '../lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export async function crearTicket(formData: FormData) {
  // 1. Recogemos los datos del formulario HTML
  const titulo = formData.get('titulo') as string
  const descripcion = formData.get('descripcion') as string
  const prioridad = formData.get('prioridad') as string

  // 2. Guardamos en la base de datos
  try {
    await prisma.ticket.create({
      data: {
        titulo,
        descripcion,
        prioridad,
        // IMPORTANTE: Como aún no hemos hecho el Login,
        // vamos a "fingir" que lo crea el usuario con ID 1 (el que creaste antes).
        // Más adelante cambiaremos esto por el usuario real logueado.
        creadorId: 1, 
      },
    })
  } catch (error) {
    console.error('Error creando ticket:', error)
    throw error
  }

  // 3. Avisamos a Next.js para que refresque la lista de tickets
  revalidatePath('/')
  
  // 4. Volvemos a la página principal
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