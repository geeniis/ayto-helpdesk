'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  enviarMensajeDirecto, 
  obtenerMensajesDirectos, 
  marcarMensajesComoLeidos, 
  obtenerContactosConNoLeidos 
} from '@/app/actions'

interface Contacto {
  id: number
  nombre: string
  email: string
  rol: string
  mensajesEnviados?: { id: number }[]
}

interface Mensaje {
  id: number
  contenido: string
  creadoEn: Date | string
  remitenteId: number
  destinatarioId: number
}

interface ChatClienteProps {
  miId: number
  contactos: Contacto[]
  contactoSeleccionado: Contacto | null
  mensajesIniciales: Mensaje[]
}

const formatFechaHora = (dateInput: Date | string) => {
  const d = new Date(dateInput)
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const anio = d.getFullYear()
  const horas = String(d.getHours()).padStart(2, '0')
  const minutos = String(d.getMinutes()).padStart(2, '0')
  return `${dia}/${mes}/${anio} a las ${horas}:${minutos}`
}

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = base64Str
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      } else {
        resolve(base64Str)
      }
    }
    img.onerror = () => resolve(base64Str)
  })
}

const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.type = 'sine'
    // Dynamic warm synthesized notification ping (D5 -> A5 note blend)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12)

    gainNode.gain.setValueAtTime(0.06, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } catch (err) {
    console.warn("Audio playback blocked by autoplay rules or failed:", err)
  }
}

export default function ChatCliente({
  miId,
  contactos,
  contactoSeleccionado,
  mensajesIniciales,
}: ChatClienteProps) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [mensajeTexto, setMensajeTexto] = useState('')
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales)
  const [contactosList, setContactosList] = useState<Contacto[]>(contactos)
  const [enviando, setEnviando] = useState(false)
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null)
  const [imagenAdjunta, setImagenAdjunta] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Deduce if current user is Admin/Technician
  const esAdminOTecnico = contactos.some(c => c.rol === 'USER' || c.rol === 'EMPLEADO')

  // Initialize contacts list once on mount or when props update
  useEffect(() => {
    setContactosList(contactos)
  }, [contactos])

  // Sync initial messages when active selected contact changes
  useEffect(() => {
    setMensajes(mensajesIniciales)
    setImagenAdjunta(null) // Clear any unsent draft image from another chat!

    if (contactoSeleccionado) {
      marcarMensajesComoLeidos(miId, contactoSeleccionado.id).catch(err =>
        console.error("Error al marcar como leídos en carga inicial:", err)
      )
    }
  }, [contactoSeleccionado?.id])

  // Keep a ref of the message count to avoid dependency re-triggering of the polling loop
  const mensajesCountRef = useRef(mensajes.length)
  useEffect(() => {
    mensajesCountRef.current = mensajes.length
  }, [mensajes])

  // Track the total sum of unread messages across all contacts to sound alerts on incoming background messages
  const totalNoLeidosRef = useRef(0)
  useEffect(() => {
    const unreadCount = contactosList.reduce((acc, c) => acc + (c.mensajesEnviados?.length || 0), 0)
    totalNoLeidosRef.current = unreadCount
  }, [contactosList])

  const scrollToBottom = (smooth = true) => {
    scrollRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }

  const handleIncomingMessages = (nuevos: Mensaje[]) => {
    const container = scrollRef.current?.parentElement
    // Check if user is looking near the bottom
    const isNearBottom = container
      ? container.scrollHeight - container.scrollTop - container.clientHeight < 250
      : true

    setMensajes(nuevos)

    if (isNearBottom) {
      setTimeout(() => {
        scrollToBottom(true)
      }, 50)
    }
  }

  // Scroll to bottom immediately on contact change (initial load)
  useEffect(() => {
    if (contactoSeleccionado) {
      scrollToBottom(false)
    }
  }, [contactoSeleccionado])

  // Polling para sincronizar y recibir nuevos mensajes en segundo plano cada 3 segundos
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // 1. Sync messages for the active contact
        if (contactoSeleccionado) {
          const nuevos = await obtenerMensajesDirectos(miId, contactoSeleccionado.id)
          if (nuevos.length !== mensajesCountRef.current) {
            // Play sound if the last incoming message was sent by the other contact
            const ultimoMsg = nuevos[nuevos.length - 1]
            if (ultimoMsg && ultimoMsg.remitenteId !== miId) {
              playNotificationSound()
            }
            handleIncomingMessages(nuevos as any)
            await marcarMensajesComoLeidos(miId, contactoSeleccionado.id)
          }
        }

        // 2. Poll contacts list to update sidebar unread badges in real time
        const contactosActualizados = await obtenerContactosConNoLeidos(miId, esAdminOTecnico)
        const nuevoNoLeidos = contactosActualizados.reduce((acc, c) => acc + (c.mensajesEnviados?.length || 0), 0)
        
        // Play notification sound if an unread message arrives from any other contact
        if (nuevoNoLeidos > totalNoLeidosRef.current) {
          playNotificationSound()
        }

        setContactosList(contactosActualizados as any)
      } catch (error) {
        console.error('Error en el sincronizador del chat:', error)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [contactoSeleccionado, miId, esAdminOTecnico])

  // Filter contacts by search query
  const contactosFiltrados = contactosList.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleSelectContacto = (id: number) => {
    router.push(`/chat?con=${id}`)
  }

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactoSeleccionado || enviando) return

    const texto = mensajeTexto.trim()
    const imageBase64 = imagenAdjunta

    if (!texto && !imageBase64) return

    setMensajeTexto('')
    setImagenAdjunta(null)
    setEnviando(true)

    try {
      // 1. If there's an attached image, send it first
      if (imageBase64) {
        const msgOptImg: Mensaje = {
          id: Date.now(),
          contenido: imageBase64,
          creadoEn: new Date(),
          remitenteId: miId,
          destinatarioId: contactoSeleccionado.id
        }
        setMensajes(prev => [...prev, msgOptImg])
        setTimeout(() => scrollToBottom(true), 50)

        const resImg = await enviarMensajeDirecto(contactoSeleccionado.id, imageBase64)
        setMensajes(prev =>
          prev.map(m => (m.id === msgOptImg.id ? (resImg as any) : m))
        )
      }

      // 2. If there's also text, send it
      if (texto) {
        // Offset ID slightly to prevent key collision with image bubble
        const msgOptText: Mensaje = {
          id: Date.now() + 1,
          contenido: texto,
          creadoEn: new Date(),
          remitenteId: miId,
          destinatarioId: contactoSeleccionado.id
        }
        setMensajes(prev => [...prev, msgOptText])
        setTimeout(() => scrollToBottom(true), 50)

        const resText = await enviarMensajeDirecto(contactoSeleccionado.id, texto)
        setMensajes(prev =>
          prev.map(m => (m.id === msgOptText.id ? (resText as any) : m))
        )
      }
    } catch (error) {
      console.error('Error al enviar mensaje directo o adjunto:', error)
    } finally {
      setEnviando(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !contactoSeleccionado || enviando) return

    // Limit image size to 2.5MB for SQLite storage optimization
    if (file.size > 2.5 * 1024 * 1024) {
      alert("⚠️ La imagen es demasiado grande. El límite para optimización es de 2.5 MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const base64Raw = reader.result as string
      setEnviando(true)
      try {
        const base64 = await compressImage(base64Raw)
        setImagenAdjunta(base64)
      } catch (err) {
        console.error("Error al comprimir archivo de imagen:", err)
      } finally {
        setEnviando(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const file = e.clipboardData.files?.[0]
    if (file && file.type.startsWith('image/')) {
      e.preventDefault() // Stop default text paste for files

      if (!contactoSeleccionado || enviando) return

      // Limit size to 2.5MB for SQLite performance optimization
      if (file.size > 2.5 * 1024 * 1024) {
        alert("⚠️ La imagen es demasiado grande. El límite para optimización es de 2.5 MB.")
        return
      }

      const reader = new FileReader()
      reader.onload = async () => {
        const base64Raw = reader.result as string
        setEnviando(true)
        try {
          const base64 = await compressImage(base64Raw)
          setImagenAdjunta(base64)
        } catch (err) {
          console.error("Error al comprimir imagen pegada:", err)
        } finally {
          setEnviando(false)
        }
      }
      reader.readAsDataURL(file)
    }
  }


  return (
    <div className="flex w-full h-full divide-x divide-slate-200/80">
      {/* 1. Directorio de Contactos (Columna Izquierda) */}
      <div className="w-full md:w-80 flex flex-col h-full bg-white/45 shrink-0">
        <div className="p-4 border-b border-slate-200/80">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar contacto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-white/90 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition-all text-slate-800 placeholder-slate-400 shadow-sm"
            />
            <div className="absolute left-3.5 top-3 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Listado */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3 mb-2">
            Contactos Disponibles ({contactosFiltrados.length})
          </div>
          {contactosFiltrados.length === 0 ? (
            <div className="text-center py-10 opacity-60">
              <span className="text-2xl block mb-2">👥</span>
              <p className="text-xs text-slate-400 font-medium">Ningún contacto encontrado</p>
            </div>
          ) : (
            contactosFiltrados.map((c) => {
              const seleccionado = contactoSeleccionado?.id === c.id
              const inicial = c.nombre ? c.nombre[0].toUpperCase() : 'U'
              const colorRol = c.rol === 'ADMIN' 
                ? 'bg-purple-100 text-purple-700 border-purple-200' 
                : c.rol === 'TECNICO'
                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'

              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectContacto(c.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                    seleccionado
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/15 scale-[1.01]'
                      : 'hover:bg-white/80 text-slate-700 hover:shadow-sm border border-transparent hover:border-slate-200/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center shrink-0 text-sm shadow-sm ${
                    seleccionado ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {inicial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <p className={`font-bold text-xs truncate ${seleccionado ? 'text-white' : 'text-slate-800'}`}>
                        {c.nombre}
                      </p>
                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border shrink-0 ${
                        seleccionado 
                          ? 'bg-white/20 text-white border-white/10' 
                          : colorRol
                      }`}>
                        {c.rol}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2 mt-0.5">
                      <p className={`text-[10px] truncate ${seleccionado ? 'text-blue-100' : 'text-slate-400'}`}>
                        {c.email}
                      </p>
                      {c.mensajesEnviados && c.mensajesEnviados.length > 0 && (
                        <span className={`h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center text-[9px] font-black tracking-tighter shrink-0 animate-bounce shadow-md ${
                          seleccionado 
                            ? 'bg-white/30 text-white' 
                            : 'bg-rose-500 text-white border border-white'
                        }`}>
                          {c.mensajesEnviados.length}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 2. Ventana de Conversación (Columna Derecha) */}
      <div className="flex-1 flex flex-col h-full bg-slate-50/30">
        {contactoSeleccionado ? (
          <>
            {/* Header del Chat */}
            <div className="bg-white/80 backdrop-blur-md p-4 border-b border-slate-200/80 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200 text-sm">
                  {contactoSeleccionado.nombre[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-800">{contactoSeleccionado.nombre}</h3>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Activo ahora • {contactoSeleccionado.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Listado de Mensajes */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {mensajes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-55">
                  <span className="text-4xl mb-3 block">💬</span>
                  <p className="text-slate-400 text-xs font-bold text-center">¡El chat está vacío!</p>
                  <p className="text-slate-400 text-[10px] text-center mt-1">Escribe tu primer mensaje a continuación para iniciar la conversación.</p>
                </div>
              ) : (
                mensajes.map((m) => {
                  const esMio = m.remitenteId === miId
                  return (
                    <div key={m.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] md:max-w-[60%] p-4 rounded-2xl text-xs leading-relaxed shadow-sm relative group hover:shadow-md transition-all ${
                        esMio
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                      }`}>
                        {m.contenido.startsWith('data:image/') ? (
                          <div className="relative rounded-lg overflow-hidden group">
                            <img
                              src={m.contenido}
                              alt="Imagen enviada"
                              className="rounded-xl max-w-full max-h-60 object-contain shadow-sm border border-slate-200/40 hover:brightness-95 transition-all cursor-zoom-in"
                              onClick={() => setImagenAmpliada(m.contenido)}
                            />
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{m.contenido}</p>
                        )}
                        <p className={`text-[9px] mt-2 text-right font-medium opacity-65 ${esMio ? 'text-blue-100' : 'text-slate-400'}`}>
                          {formatFechaHora(m.creadoEn)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={scrollRef} />
            </div>

            {/* Formulario de Entrada */}
            <div className="bg-white/80 border-t border-slate-200/80 shrink-0 flex flex-col">
              {imagenAdjunta && (
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center gap-3 animate-in fade-in duration-200">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-sm border border-slate-200 shrink-0 group">
                    <img src={imagenAdjunta} alt="Vista previa" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImagenAdjunta(null)}
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-150"
                      title="Eliminar imagen"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Imagen lista para enviar</p>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">Presiona el botón de enviar o escribe un mensaje para acompañarla.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImagenAdjunta(null)}
                    className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg transition-all hover:bg-slate-100 shrink-0"
                    title="Descartar imagen"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="p-4">
                <form onSubmit={handleEnviar} className="flex gap-3 items-center">
                  {/* File input invisible */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Botón de Cámara/Galería */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={enviando}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-3 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0 shadow-sm border border-slate-200/40"
                    title="Enviar imagen"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>

                  <input
                    type="text"
                    placeholder={imagenAdjunta ? "Escribe un comentario opcional para esta imagen..." : "Escribe tu mensaje aquí..."}
                    value={mensajeTexto}
                    onChange={(e) => setMensajeTexto(e.target.value)}
                    onPaste={handlePaste}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition-all text-slate-800 shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={(!mensajeTexto.trim() && !imagenAdjunta) || enviando}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center shrink-0"
                  >
                    <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-60">
            <span className="text-6xl mb-4 block animate-bounce">💬</span>
            <h3 className="font-extrabold text-slate-700 text-base">Tus Mensajes Directos</h3>
            <p className="text-xs text-slate-400 text-center mt-1.5 max-w-sm leading-relaxed">
              Selecciona un administrador o técnico de la columna izquierda para iniciar una conversación privada en tiempo real.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox / Modal de Imagen Ampliada */}
      {imagenAmpliada && (
        <div 
          className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setImagenAmpliada(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all active:scale-95"
            onClick={() => setImagenAmpliada(null)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img 
            src={imagenAmpliada} 
            alt="Imagen ampliada" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
          />
        </div>
      )}

    </div>
  )
}
