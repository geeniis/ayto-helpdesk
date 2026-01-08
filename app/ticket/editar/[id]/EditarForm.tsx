'use client'

import { useState } from 'react'
import { editarTicket } from '@/app/actions'
import Link from 'next/link'

// Definimos qué datos necesita este formulario
interface Props {
  ticket: {
    id: number
    titulo: string
    descripcion: string
    prioridad: string
    categoria: string
    estado: string
    adjuntoUrl: string | null
  }
  esAdmin: boolean
}

export default function EditarForm({ ticket, esAdmin }: Props) {
  const [subiendo, setSubiendo] = useState(false)
  const [urlImagen, setUrlImagen] = useState(ticket.adjuntoUrl || '')

  // Lógica de subida a Cloudinary
  const manejarSubida = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSubiendo(true)
    const formData = new FormData()
    formData.append('file', file)
    // ⚠️ RECUERDA PONER TUS DATOS AQUÍ OTRA VEZ
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

  return (
    <form action={editarTicket} className="space-y-4">
      <input type="hidden" name="id" value={ticket.id} />
      {/* Input oculto para enviar la URL final */}
      <input type="hidden" name="adjuntoUrl" value={urlImagen} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
        <input name="titulo" type="text" defaultValue={ticket.titulo} required className="w-full border rounded p-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select name="categoria" defaultValue={ticket.categoria} className="w-full border rounded p-2">
            <option value="HARDWARE">Hardware</option>
            <option value="SOFTWARE">Software</option>
            <option value="RED">Red / Internet</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
          <select name="prioridad" defaultValue={ticket.prioridad} className="w-full border rounded p-2">
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
          </select>
        </div>
      </div>

      {/* Selector de ESTADO (Solo visible si es ADMIN) */}
      {esAdmin && (
        <div className="bg-purple-50 p-3 rounded border border-purple-200">
          <label className="block text-sm font-bold text-purple-800 mb-1">👮 Estado (Solo Admin)</label>
          <select name="estado" defaultValue={ticket.estado} className="w-full border rounded p-2">
            <option value="ABIERTO">Abierto</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="RESUELTO">Resuelto</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea name="descripcion" required rows={6} defaultValue={ticket.descripcion} className="w-full border rounded p-2"></textarea>
      </div>

      {/* ZONA DE ADJUNTOS */}
      <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-2">📸 Cambiar Imagen o Adjunto</label>
        <input 
          type="file" 
          accept="image/*,video/*"
          onChange={manejarSubida}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {subiendo && <p className="text-blue-500 text-xs mt-2">Subiendo nuevo archivo...</p>}
        
        {urlImagen && (
          <div className="mt-4 relative">
            <p className="text-gray-500 text-xs mb-2">Imagen actual:</p>
            {urlImagen.includes('.mp4') ? (
                 <video src={urlImagen} className="h-20 mx-auto rounded border" />
            ) : (
                 <img src={urlImagen} alt="Actual" className="h-20 mx-auto rounded border" />
            )}
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <button 
          type="submit" 
          disabled={subiendo}
          className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {subiendo ? 'Subiendo...' : 'Guardar Cambios'}
        </button>
        <Link href={`/ticket/${ticket.id}`} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 text-gray-700">
          Cancelar
        </Link>
      </div>
    </form>
  )
}