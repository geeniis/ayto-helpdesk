import { cookies } from 'next/headers'

const diccionarios = {
  es: {
    titulo: 'Panel de Control',
    bienvenida: 'Bienvenido de nuevo,',
    botones: {
      usuarios: 'Usuarios',
      noticias: 'Noticias',
      nuevo: 'Nuevo Ticket',
      salir: 'Salir'
    },
    noticias: {
      titulo: 'Tablón de Anuncios',
      subtitulo: 'Novedades y actualizaciones del sistema.',
      vacio: 'No hay noticias publicadas actualmente.',
      publicado: 'Publicado el',
      leido: 'Marcar como leída',
      redactar: '+ Redactar',
      volver: 'Volver',
      editar: 'Editar',
      borrar: 'Borrar',
      nueva: 'Nueva Noticia',
      aviso: 'Aviso público'
    },
    formulario: {
      titulo: 'Título del Incidente',
      descripcion: 'Detalla qué está pasando...',
      categoria: 'Categoría',
      prioridad: 'Prioridad',
      adjunto: 'Adjuntar Archivo o Foto (Opcional)',
      guardar: 'Crear Ticket',
      cancelar: 'Cancelar'
    },
    kpis: {
      urgentes: 'Tickets Urgentes',
      pendientes: 'Pendientes',
      enMarcha: 'En Marcha',
      equipos: 'Mis Equipos'
    },
    columnas: {
      pendientes: 'Pendientes',
      proceso: 'En Proceso',
      resueltos: 'Resueltos',
      vacio: 'No hay tickets en esta columna'
    },
    valores: {
      ALTA: 'Alta',
      MEDIA: 'Media',
      BAJA: 'Baja',
      HARDWARE: 'Hardware',
      SOFTWARE: 'Software',
      RED: 'Red',
      OTRO: 'Otro',
      ABIERTO: 'Abierto',
      EN_PROCESO: 'En Proceso',
      RESUELTO: 'Resuelto'
    },
    paginacion: {
      anterior: 'Anterior',
      siguiente: 'Siguiente',
      pagina: 'Página',
      de: 'de'
    },
    ticket: {
      volver: 'Volver al Panel',
      estado: 'Estado',
      creado: 'Creado el',
      descripcion: 'Descripción',
      comentarios: 'Comentarios',
      escribirComentario: 'Escribe un comentario...',
      enviar: 'Enviar',
      historial: 'Historial',
      editar: 'Editar Ticket',
      borrar: 'Eliminar Ticket',
      prioridad_label: 'Prioridad:',
      adjunto_label: 'Archivo Adjunto',
      adjunto_clic: 'Clic para ver tamaño completo',
      autor: 'Autor:',
      notaInterna: 'Nota Interna',
      esNotaInterna: 'Es una Nota Interna'
    }
  },
  ca: {
    titulo: 'Panell de Control',
    bienvenida: 'Benvingut de nou,',
    botones: {
      usuarios: 'Usuaris',
      noticias: 'Notícies',
      nuevo: 'Nou Tiquet',
      salir: 'Sortir'
    },
    noticias: {
      titulo: 'Taulell d\'Anuncis',
      subtitulo: 'Novetats i actualitzacions del sistema.',
      vacio: 'No hi ha notícies publicades actualment.',
      publicado: 'Publicat el',
      leido: 'Marcar com a llegida',
      redactar: '+ Redactar',
      volver: 'Tornar',
      editar: 'Editar',
      borrar: 'Esborrar',
      nueva: 'Nova Notícia',
      aviso: 'Avís públic'
    },
    formulario: {
      titulo: 'Títol de la Incidència',
      descripcion: 'Detalla què està passant...',
      categoria: 'Categoria',
      prioridad: 'Prioritat',
      adjunto: 'Adjuntar Arxiu o Foto (Opcional)',
      guardar: 'Crear Tiquet',
      cancelar: 'Cancel·lar'
    },
    kpis: {
      urgentes: 'Tiquets Urgents',
      pendientes: 'Pendents',
      enMarcha: 'En Marxa',
      equipos: 'Els meus Equips'
    },
    columnas: {
      pendientes: 'Pendents',
      proceso: 'En Procés',
      resueltos: 'Resolts',
      vacio: 'No hi ha tiquets en aquesta columna'
    },
    valores: {
      ALTA: 'Alta',
      MEDIA: 'Mitjana',
      BAJA: 'Baixa',
      HARDWARE: 'Hardware',
      SOFTWARE: 'Software',
      RED: 'Xarxa',
      OTRO: 'Altre',
      ABIERTO: 'Obert',
      EN_PROCESO: 'En Procés',
      RESUELTO: 'Resolt'
    },
    paginacion: {
      anterior: 'Anterior',
      siguiente: 'Següent',
      pagina: 'Pàgina',
      de: 'de'
    },
    ticket: {
      volver: 'Tornar al Panell',
      estado: 'Estat',
      creado: 'Creat el',
      descripcion: 'Descripció',
      comentarios: 'Comentaris',
      escribirComentario: 'Escriu un comentari...',
      enviar: 'Enviar',
      historial: 'Historial',
      editar: 'Editar Tiquet',
      borrar: 'Eliminar Tiquet',
      prioridad_label: 'Prioritat:',
      adjunto_label: 'Arxiu Adjunt',
      adjunto_clic: 'Clic per veure mida completa',
      autor: 'Autor:',
      notaInterna: 'Nota Interna',
      esNotaInterna: 'És una Nota Interna'
    }
  }
}

export type Lang = keyof typeof diccionarios

export async function getDiccionario() {
  const cookieStore = await cookies()
  const langCookie = cookieStore.get('idioma')?.value
  
  // Validamos que el idioma sea 'es' o 'ca', si no, forzamos 'es'
  const lang: Lang = (langCookie === 'ca') ? 'ca' : 'es'

  return { 
    t: diccionarios[lang], 
    lang: lang 
  }
}