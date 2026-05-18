import { getDiccionario } from '@/lib/diccionario'
import prisma from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import NoticiaEditForm from './NoticiaEditForm'
import { auth } from '@/auth'

export default async function EditarNoticiaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/noticias')

  const usuarioActual = await prisma.usuario.findUnique({ where: { id: parseInt(session.user.id) } })
  if (usuarioActual?.rol !== 'ADMIN') redirect('/noticias')

  const { id } = await params
  const noticiaId = parseInt(id)

  if (isNaN(noticiaId)) return notFound()

  const noticia = await prisma.noticia.findUnique({
    where: { id: noticiaId }
  })

  if (!noticia) return notFound()

  const { t } = await getDiccionario()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <NoticiaEditForm t={t} noticia={noticia} />
    </div>
  )
}