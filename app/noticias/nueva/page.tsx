import { getDiccionario } from '@/lib/diccionario'
import NoticiaForm from './NoticiaForm'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function NuevaNoticiaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/noticias')

  const usuarioActual = await prisma.usuario.findUnique({ where: { id: parseInt(session.user.id) } })
  if (usuarioActual?.rol !== 'ADMIN') redirect('/noticias')

  const { t } = await getDiccionario()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <NoticiaForm t={t} />
    </div>
  )
}