'use client'

import { crearTicket } from '@/app/actions'
import Link from 'next/link'
import { useState } from 'react'

export default function NuevoTicketPage() {
  const [subiendo, setSubiendo] = useState(false)
  const [urlImagen, setUrlImagen] = useState('')

  // Función mágica para subir a Cloudinary
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
      setUrlImagen(data.secure_url) // Guardamos la URL que nos devuelve Cloudinary
    } catch (error) {
      console.error('Error subiendo imagen:', error)
      alert('Error al subir la imagen')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">📝 Nuevo Ticket</h1>
        
        <form action={crearTicket} className="space-y-4">
          
          {/* Input Oculto para enviar la URL al servidor */}
          <input type="hidden" name="adjuntoUrl" value={urlImagen} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input name="titulo" type="text" required placeholder="Ej: Pantalla azul..." className="w-full border rounded p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select name="categoria" className="w-full border rounded p-2">
              <option value="HARDWARE">Hardware</option>
              <option value="SOFTWARE">Software</option>
              <option value="RED">Red / Internet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <select name="prioridad" className="w-full border rounded p-2">
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea name="descripcion" required rows={4} placeholder="Detalla el problema..." className="w-full border rounded p-2"></textarea>
          </div>

          {/* ZONA DE ADJUNTOS */}
          <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">📸 Adjuntar Imagen o Captura</label>
            <input 
              type="file" 
              accept="image/*,video/*"
              onChange={manejarSubida}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {subiendo && <p className="text-blue-500 text-xs mt-2">Subiendo archivo...</p>}
            
            {urlImagen && (
              <div className="mt-2 relative">
                <p className="text-green-600 text-xs font-bold">¡Adjunto subido correctamente!</p>
                <img src={urlImagen} alt="Vista previa" className="mt-2 h-20 mx-auto rounded border" />
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={subiendo} // Bloqueamos el botón mientras sube la foto
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {subiendo ? 'Subiendo imagen...' : 'Crear Ticket'}
          </button>
        </form>

        <Link href="/" className="block text-center text-gray-500 text-sm mt-4 hover:underline">
          Cancelar y volver
        </Link>
      </div>
    </div>
  )
}