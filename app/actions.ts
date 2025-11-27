'use server' // Esto es OBLIGATORIO: le dice a Next.js que esto se ejecuta en el servidor

import prisma from '../lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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