import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const isHttps = process.env.NEXTAUTH_URL?.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https' || request.url.startsWith('https://')
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: isHttps || request.cookies.has('__Secure-next-auth.session-token')
  })
  const { pathname } = request.nextUrl

  // Proteger endpoints de API que no sean /api/auth
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  // Si no está autenticado y accede a rutas del sistema, redirigir a la página raíz/login
  if (!token) {
    const isProtectedRoute = 
      pathname.startsWith('/admin') || 
      pathname.startsWith('/dashboard') || 
      pathname.startsWith('/vacations') || 
      pathname.startsWith('/calendar') || 
      pathname.startsWith('/profile') || 
      pathname.startsWith('/groups') ||
      pathname.startsWith('/social') ||
      pathname.startsWith('/knowledge-base')

    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  const rawRole = (token as any)?.role || 'USER'
  const role = String(rawRole).trim()

  // 1. Control de accesos de Administración (rutas /admin/*)
  // Solo accesible por IT_MANAGER, TECHNOLOGY_ADMIN, TECHNOLOGY, HR
  if (pathname.startsWith('/admin')) {
    const allowedAdminRoles = ['IT_MANAGER', 'TECHNOLOGY_ADMIN', 'TECHNOLOGY', 'HR']
    if (!allowedAdminRoles.includes(role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // 2. Control de accesos de Dashboard (ruta /dashboard)
  // Solo accesible por SUPERVISOR, MANAGER, IT_MANAGER, TECHNOLOGY_ADMIN, HR
  if (pathname.startsWith('/dashboard')) {
    const allowedDashboardRoles = ['SUPERVISOR', 'MANAGER', 'IT_MANAGER', 'TECHNOLOGY_ADMIN', 'HR']
    if (!allowedDashboardRoles.includes(role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

// Configuración de rutas que el middleware interceptará
export const config = {
  matcher: [
    '/admin/:path*', 
    '/dashboard/:path*', 
    '/vacations/:path*', 
    '/calendar/:path*', 
    '/profile/:path*', 
    '/groups/:path*',
    '/social/:path*',
    '/knowledge-base/:path*',
    '/api/:path*'
  ]
}
