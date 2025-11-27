import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod'; // Zod viene con Next.js, sirve para validar datos
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config'; // Crearemos esto en el siguiente paso

// Esquema para validar que el email y pass tienen formato correcto
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig, // Importamos la config básica
  providers: [
    Credentials({
      async authorize(credentials) {
        // 1. Validamos que los datos sean correctos
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          // 2. Buscamos al usuario en la base de datos
          const user = await prisma.usuario.findUnique({ where: { email } });
          if (!user || !user.password) return null;

          // 3. Comparamos la contraseña introducida con la encriptada en la BD
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return { ...user, id: user.id.toString() };
        }

        console.log('Credenciales inválidas');
        return null;
      },
    }),
  ],
});