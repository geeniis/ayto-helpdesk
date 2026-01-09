'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function cambiarIdioma(nuevoIdioma: string) {
  // Guardamos la cookie por 30 días
  const cookieStore = await cookies()
  cookieStore.set('idioma', nuevoIdioma, { maxAge: 60 * 60 * 24 * 30 })
  
  // Recargamos la caché para que la web se actualice al instante
  revalidatePath('/') 
}
