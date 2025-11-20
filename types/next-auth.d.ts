import { DefaultSession } from 'next-auth';

/**
 * Extensión de tipos de NextAuth
 * Agrega campos personalizados a User y Session
 */
declare module 'next-auth' {
  interface User {
    id: string;
    role: 'admin' | 'user';
    department?: string;
  }

  interface Session {
    user: {
      id: string;
      role: 'admin' | 'user';
      department?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'admin' | 'user';
    department?: string;
    email?: string;
    name?: string;
  }
}
