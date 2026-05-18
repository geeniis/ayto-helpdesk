import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'

// Configuración del Transporter para SMTP real si existen las variables de entorno
const host = process.env.SMTP_HOST
const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS
const from = process.env.SMTP_FROM || '"Ayto-HelpDesk" <noreply@ayuntamiento.local>'

let transporter: nodemailer.Transporter | null = null

if (host && user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true para 465, false para otros puertos
    auth: {
      user,
      pass
    }
  })
}

// Estilos de la plantilla premium de email (Royal Blue Municipal)
function obtenerPlantillaHTML(titulo: string, saludo: string, mensaje: string, botonTexto?: string, botonUrl?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${titulo}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
            border: 1px border #e2e8f0;
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            padding: 32px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
          }
          .content {
            padding: 32px;
            line-height: 1.6;
          }
          .content h2 {
            margin-top: 0;
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
          }
          .content p {
            font-size: 15px;
            color: #475569;
            margin-bottom: 24px;
          }
          .btn-container {
            text-align: center;
            margin: 32px 0 16px 0;
          }
          .btn {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 28px;
            font-weight: 600;
            font-size: 14px;
            border-radius: 10px;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
            transition: background-color 0.2s;
          }
          .btn:hover {
            background-color: #1d4ed8;
          }
          .footer {
            background-color: #f1f5f9;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
          }
          .footer a {
            color: #64748b;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ Ayto-HelpDesk</h1>
          </div>
          <div class="content">
            <h2>${saludo}</h2>
            <p>${mensaje}</p>
            ${botonTexto && botonUrl ? `
              <div class="btn-container">
                <a href="${botonUrl}" class="btn">${botonTexto}</a>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>Este es un correo automático enviado por el Departamento de Informática y Telecomunicaciones.</p>
            <p>© ${new Date().getFullYear()} Ayuntamiento - Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

interface EnviarEmailParams {
  to: string
  subject: string
  titulo: string
  saludo: string
  mensaje: string
  botonTexto?: string
  botonUrl?: string
}

export async function enviarEmail({ to, subject, titulo, saludo, mensaje, botonTexto, botonUrl }: EnviarEmailParams) {
  const htmlContent = obtenerPlantillaHTML(titulo, saludo, mensaje, botonTexto, botonUrl)

  // SI SMTP ESTÁ CONFIGURADO, ENVIAR EMAIL REAL
  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent
      })
      console.log(`[EMAIL SERVICE] Correo electrónico REAL enviado con éxito a: ${to}`)
      return
    } catch (error) {
      console.error('[EMAIL SERVICE ERROR] Error enviando email real, reintentando con fallback offline...', error)
    }
  }

  // FALLBACK OFFLINE: GUARDAR COMO .HTML EN EL WORKSPACE E IMPRIMIR EN CONSOLA
  try {
    const tempDir = path.join(process.cwd(), 'temp_emails')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const fileName = `${Date.now()}_${safeSubject}.html`
    const filePath = path.join(tempDir, fileName)

    fs.writeFileSync(filePath, htmlContent, 'utf-8')

    console.log('\n============================================================')
    console.log(`📧 [EMAIL SIMULADO ENVIADO (MODO OFFLINE)]`)
    console.log(`   Destinatario: ${to}`)
    console.log(`   Asunto:       ${subject}`)
    console.log(`   Detalle:      ${mensaje.replace(/<[^>]*>/g, '')}`) // Limpiar tags HTML básicos para consola
    console.log(`   Visualizar HTML en navegador:`)
    console.log(`   👉 file:///${filePath.replace(/\\/g, '/')}`)
    console.log('============================================================\n')
  } catch (err) {
    console.error('[EMAIL FALLBACK ERROR] No se pudo guardar el archivo HTML:', err)
  }
}
