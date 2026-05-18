import { getDiccionario } from '@/lib/diccionario'
import NoticiaForm from './NoticiaForm'

export default async function NuevaNoticiaPage() {
  const { t } = await getDiccionario()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <NoticiaForm t={t} />
    </div>
  )
}