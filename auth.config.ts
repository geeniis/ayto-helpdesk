import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/'); // Esto incluye TODA la web
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isOnRegister = nextUrl.pathname.startsWith('/register');

      // 1. SI YA ESTÁS LOGUEADO Y VAS AL LOGIN O REGISTER...
      // ¡Te mandamos a la Home automáticamente!
      if ((isOnLogin || isOnRegister) && isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl));
      }

      // 2. PROTECCIÓN DE RUTAS
      if (isOnDashboard) {
        if (isOnLogin || isOnRegister) return true; // Deja ver login/register si no estás logueado
        if (isLoggedIn) return true; // Deja pasar si tienes sesión
        return false; // Si no, redirige al login
      }
      return true;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = String(user.id);
      }
      return token;
    }
  },
  providers: [],
} satisfies NextAuthConfig;