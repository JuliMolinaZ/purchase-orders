import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { User } from './lib/auth/users';

/**
 * Configuración de NextAuth v5
 * Sistema de autenticación robusto y seguro
 * 
 * NOTA: authenticateUser se importa dinámicamente dentro de authorize
 * para evitar que bcrypt (módulo nativo) se cargue en Edge Runtime (middleware)
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'admin@runsolutions.com',
        },
        password: {
          label: 'Contraseña',
          type: 'password',
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Importación dinámica para evitar cargar bcrypt en Edge Runtime
        const { authenticateUser } = await import('./lib/auth/users');

        const user = await authenticateUser(
          credentials.email as string,
          credentials.password as string
        );

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        };
      },
    }),
  ],

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as User).role;
        token.department = (user as User).department;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || '';
        session.user.role = (token.role as 'admin' | 'user') || 'user';
        session.user.department = (token.department as string) || undefined;
        // Asegurar que name y email existan
        if (!session.user.name && token.email) {
          session.user.name = token.email as string;
        }
        if (!session.user.email && token.email) {
          session.user.email = token.email as string;
        }
      }
      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas
  },

  secret: process.env.AUTH_SECRET || 'RUN-SOLUTIONS-NEARLINK360-SECRET-KEY-CHANGE-IN-PRODUCTION',

  debug: process.env.NODE_ENV === 'development',

  // Configurar trustHost para desarrollo local
  trustHost: true,
});
