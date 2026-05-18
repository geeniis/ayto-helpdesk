'use client'

import { useState, useRef, useEffect } from 'react'
import { enviarMensajeChat } from '@/app/actions'

interface Comentario {
  id: number
  contenido: string
  creadoEn: Date | string
  autorId: number
  autor: {
    nombre: string
    email: string
  }
}

interface Ticket {
  id: number
  comentarios: Comentario[]
}

interface FloatingChatProps {
  miId: number
  chatTicket: Ticket
}

const formatTime = (dateInput: Date | string) => {
  const d = new Date(dateInput)
  const horas = String(d.getHours()).padStart(2, '0')
  const minutos = String(d.getMinutes()).padStart(2, '0')
  return `${horas}:${minutos}`
}

export default function FloatingChat({ miId, chatTicket }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [comentarios, setComentarios] = useState<Comentario[]>(chatTicket.comentarios)
  const [cargando, setCargando] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100)
    }
  }, [isOpen, comentarios])

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mensaje.trim() || cargando) return

    const texto = mensaje.trim()
    setMensaje('')
    setCargando(true)

    // Optimistic UI Update: add temporary local message
    const nuevoComentarioOptimista: Comentario = {
      id: Date.now(),
      contenido: texto,
      creadoEn: new Date(),
      autorId: miId,
      autor: {
        nombre: 'Tú',
        email: ''
      }
    }

    setComentarios(prev => [...prev, nuevoComentarioOptimista])

    try {
      const res = await enviarMensajeChat(chatTicket.id, texto)
      // Replace optimistic comment with the real database comment
      setComentarios(prev =>
        prev.map(c => (c.id === nuevoComentarioOptimista.id ? (res as any) : c))
      )
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center relative group active:scale-95"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
          </span>
          {/* Tooltip */}
          <span className="absolute right-16 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-md pointer-events-none">
            💬 Chat con Soporte Técnico
          </span>
        </button>
      )}

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 w-[360px] h-[480px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Cabecera */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-700 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm relative">
                <span className="text-xl">🏢</span>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-400 border border-white rounded-full"></span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-wide">Soporte Municipal</h3>
                <p className="text-[10px] text-indigo-100 font-medium">Chat General / Consultas rápidas</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Listado de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            <div className="bg-blue-50/80 border border-blue-100/50 p-3 rounded-2xl text-[11px] text-blue-800 leading-relaxed">
              👋 <strong>¡Hola!</strong> Aquí puedes consultar dudas generales sobre el soporte informático o problemas de red. Para fallos graves, recuerda registrar un ticket formal.
            </div>

            {comentarios.map((c) => {
              const esMio = c.autorId === miId || c.autor.nombre === 'Tú'
              return (
                <div key={c.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    esMio 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                  }`}>
                    {!esMio && (
                      <p className="font-extrabold text-[10px] text-indigo-600 mb-1">
                        {c.autor.nombre} (Técnico)
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{c.contenido}</p>
                    <p className={`text-[9px] mt-1 text-right font-medium opacity-60 ${esMio ? 'text-blue-100' : 'text-slate-400'}`}>
                      {formatTime(c.creadoEn)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de Envío */}
          <form onSubmit={handleEnviar} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
            <input
              type="text"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe tu consulta aquí..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition-all"
            />
            <button
              type="submit"
              disabled={!mensaje.trim() || cargando}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl shadow transition-colors active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
