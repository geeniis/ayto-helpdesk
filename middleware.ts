import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// 1. Inicializamos NextAuth
const { auth } = NextAuth(authConfig);

// 2. Exportamos la función 'auth' como default (Esto es el Middleware)
export default auth;

// 3. Configuración de rutas (Igual que antes)
export const config = {
  // Excluir rutas internas de Next.js y archivos estáticos
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};