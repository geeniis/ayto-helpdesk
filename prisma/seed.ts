import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando el semillado de datos...')

  // 1. OPCIÓN NUCLEAR: Desactivar comprobaciones de seguridad para limpiar
  // Esto permite borrar usuarios aunque tengan datos vinculados en tablas ocultas
  try {
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`)
    
    // Borramos las tablas principales
    await prisma.comentario.deleteMany()
    await prisma.ticket.deleteMany()
    await prisma.usuario.deleteMany()

    // Intentamos borrar tablas de NextAuth por si existen (usando SQL directo para evitar errores de TypeScript)
    await prisma.$executeRawUnsafe(`DELETE FROM Account;`).catch(() => {})
    await prisma.$executeRawUnsafe(`DELETE FROM Session;`).catch(() => {})
    await prisma.$executeRawUnsafe(`DELETE FROM Authenticator;`).catch(() => {})
    await prisma.$executeRawUnsafe(`DELETE FROM VerificationToken;`).catch(() => {})

    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`)
    console.log('🗑️  Base de datos limpiada a la fuerza.')
  } catch (error) {
    console.log('⚠️ Aviso al limpiar (puede ser normal en la primera ejecución):', error)
  }

  // 2. Crear Usuarios Base
  const passwordHash = await bcrypt.hash('123456', 10)

  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Administrador Jefe',
      email: 'admin@admin.com',
      password: passwordHash,
      rol: 'ADMIN'
    }
  })

  const usuario = await prisma.usuario.create({
    data: {
      nombre: 'Empleado Ejemplar',
      email: 'user@user.com',
      password: passwordHash,
      rol: 'USER'
    }
  })

  console.log('👤 Usuarios creados: admin@admin.com y user@user.com')

  // 3. Crear 50 Tickets aleatorios
  const ticketsData = []
  
  const categorias = ['HARDWARE', 'SOFTWARE', 'RED', 'CUENTAS', 'OTROS']
  const prioridades = ['BAJA', 'MEDIA', 'ALTA']
  const estados = ['ABIERTO', 'EN_PROCESO', 'RESUELTO']

  for (let i = 0; i < 50; i++) {
    const creadorId = Math.random() > 0.5 ? admin.id : usuario.id
    const fechaCreacion = faker.date.past({ years: 0.5 })
    
    ticketsData.push({
      titulo: faker.hacker.phrase(),
      descripcion: faker.lorem.paragraph(),
      categoria: categorias[Math.floor(Math.random() * categorias.length)],
      prioridad: prioridades[Math.floor(Math.random() * prioridades.length)],
      estado: estados[Math.floor(Math.random() * estados.length)],
      creadorId: creadorId,
      creadoEn: fechaCreacion,
      adjuntoUrl: null
    })
  }

  await prisma.ticket.createMany({
    data: ticketsData
  })

  console.log('🎫 Se han generado 50 tickets falsos.')
  console.log('✅ ¡Semillado completado con éxito!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })