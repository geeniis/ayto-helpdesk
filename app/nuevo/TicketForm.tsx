// 📂 Archivo: app/nuevo/TicketForm.tsx
'use client'

import { crearTicket } from '@/app/actions'
import Link from 'next/link'
import { useState } from 'react'

// Recibimos 't' (el diccionario) desde el padre
export default function TicketForm({ t }: { t: any }) {
  const [subiendo, setSubiendo] = useState(false)
  const [urlImagen, setUrlImagen] = useState('')

  // Tu función de subida intacta
  const manejarSubida = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSubiendo(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'ml_default') 
    
    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/ddikcnviw/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      setUrlImagen(data.secure_url) 
    } catch (error) {
      console.error('Error subiendo imagen:', error)
      alert('Error al subir la imagen')
    } finally {
      setSubiendo(false)
    }
  }

  // Protección por si el diccionario tarda
  if (!t) return <div className="p-10 text-center">Cargando formulario...</div>

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
            📝 {t.botones?.nuevo || 'Nuevo Ticket'}
        </h1>
        
        <form action={crearTicket} className="space-y-4">
          
          <input type="hidden" name="adjuntoUrl" value={urlImagen} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.formulario?.titulo || 'Título'}
            </label>
            <input name="titulo" type="text" required placeholder="Ej: Pantalla azul..." className="w-full border rounded p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.formulario?.categoria || 'Categoría'}
            </label>
            <select name="categoria" className="w-full border rounded p-2 bg-white">
              <option value="HARDWARE">{t.valores?.HARDWARE || 'Hardware'}</option>
              <option value="SOFTWARE">{t.valores?.SOFTWARE || 'Software'}</option>
              <option value="RED">{t.valores?.RED || 'Red / Internet'}</option>
              {/* Añadimos las nuevas categorías que pediste */}
              <option value="CUENTAS">Cuentas / Accesos</option>
              <option value="OTROS">{t.valores?.OTRO || 'Otros'}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.formulario?.prioridad || 'Prioridad'}
            </label>
            <select name="prioridad" className="w-full border rounded p-2 bg-white">
              <option value="BAJA">{t.valores?.BAJA || 'Baja'}</option>
              <option value="MEDIA">{t.valores?.MEDIA || 'Media'}</option>
              <option value="ALTA">{t.valores?.ALTA || 'Alta'}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.ticket?.descripcion || 'Descripción'}
            </label>
            <textarea name="descripcion" required rows={4} placeholder={t.formulario?.descripcion} className="w-full border rounded p-2"></textarea>
          </div>

          {/* ZONA DE ADJUNTOS */}
          <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center hover:bg-gray-50 transition">
            <label className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer">
                📸 {t.formulario?.adjunto || 'Adjuntar Imagen'}
            </label>
            <input 
              type="file" 
              accept="image/*,video/*"
              onChange={manejarSubida}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {subiendo && <p className="text-blue-500 text-xs mt-2 animate-pulse">Subiendo archivo...</p>}
            
            {urlImagen && (
              <div className="mt-2 relative bg-green-50 p-2 rounded border border-green-200">
                <p className="text-green-600 text-xs font-bold mb-1">¡Adjunto subido correctamente!</p>
                <img src={urlImagen} alt="Vista previa" className="mt-2 h-20 mx-auto rounded border" />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/" className="flex-1 text-center py-2 px-4 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition text-sm flex items-center justify-center">
                 {t.formulario?.cancelar || 'Cancelar'}
            </Link>
            <button 
                type="submit" 
                disabled={subiendo} 
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:bg-gray-400 font-medium shadow"
            >
                {subiendo ? '...' : (t.formulario?.guardar || 'Crear Ticket')}
            </button>
          </div>
        </form>
    </div>
  )
}