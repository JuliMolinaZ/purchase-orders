import { auth } from '@/auth';
import { NextResponse } from 'next/server';

/**
 * NOTA: El middleware siempre se ejecuta en Edge Runtime en Next.js 15.
 * Las dependencias nativas como bcrypt no se cargan aquí gracias a:
 * 1. Importación dinámica en auth.ts
 * 2. Configuración serverComponentsExternalPackages en next.config.js
 */

/**
 * Middleware de NextAuth para proteger rutas
 *
 * Rutas protegidas:
 * - /orden - Requiere autenticación
 * - /api/pdf - Requiere autenticación
 *
 * Rutas públicas:
 * - /login
 * - / (redirige a /orden si está autenticado, o /login si no)
 */
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isLoginPage = nextUrl.pathname === '/login';
  const isHomePage = nextUrl.pathname === '/';
  const isProtectedRoute = nextUrl.pathname.startsWith('/orden') ||
                          nextUrl.pathname.startsWith('/api/pdf');

  // Si está en la página de login y ya está autenticado, redirigir a /orden
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/orden', nextUrl));
  }

  // Si está en home, redirigir según autenticación
  if (isHomePage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/orden', nextUrl));
    } else {
      return NextResponse.redirect(new URL('/login', nextUrl));
    }
  }

  // Si intenta acceder a ruta protegida sin autenticación, redirigir a login
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

/**
 * Configuración del matcher
 * Define qué rutas pasan por el middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
