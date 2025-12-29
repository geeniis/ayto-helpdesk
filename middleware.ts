import NextAuth from "next-auth"
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname === "/"
  
  // AQUI ESTÁ LA CLAVE: Definimos las rutas públicas
  const isPublicRoute = 
    req.nextUrl.pathname === "/login" || 
    req.nextUrl.pathname === "/register" // <--- AÑADE ESTO

  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/login", req.nextUrl))
  }

  return
})

// En el matcher, asegúrate de que no bloquee los estáticos
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}