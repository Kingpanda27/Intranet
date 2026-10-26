import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { canViewAuditLogs } from '@/lib/auditPermissions'
import { isCEO, canAccessITConfig, canAccessApprovalsPanel } from '@/lib/authorizationRoles'

export async function middleware(request: NextRequest) {
  const isHttps = process.env.NEXTAUTH_URL?.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https' || request.url.startsWith('https://')
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: isHttps || request.cookies.has('__Secure-next-auth.session-token')
  })
  const { pathname } = request.nextUrl

  // 1. Proteger todos los endpoints de API excepto /api/auth (NextAuth endpoints)
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  // 2. Si no está autenticado y accede a rutas privadas del sistema, redirigir a la página raíz
  if (!token) {
    const isProtectedRoute = 
      pathname.startsWith('/admin') || 
      pathname.startsWith('/dashboard') || 
      pathname.startsWith('/configuracion-ti') ||
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

  // 3. Bypass maestro para CEO y Master Admin
  if (isCEO(token as any)) {
    return NextResponse.next()
  }

  // 4. Bloqueo estricto de Configuración TI (rutas UI y APIs de infraestructura/whatsapp)
  // Exclusivo para personal de Technology / IT y IT Manager
  const isITConfigUI = pathname.startsWith('/admin/config') || pathname.startsWith('/configuracion-ti')
  const isITConfigAPI = pathname.startsWith('/api/whatsapp')

  if (isITConfigUI) {
    if (!canAccessITConfig(token as any)) {
      return NextResponse.redirect(new URL('/acceso-denegado', request.url))
    }
  }

  if (isITConfigAPI) {
    if (!canAccessITConfig(token as any)) {
      return new NextResponse(
        JSON.stringify({ error: "Acceso denegado: Se requieren permisos exclusivos del departamento de TI" }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  const rawRole = (token as any)?.role || 'USER'
  const role = String(rawRole).trim().toUpperCase()

  // 5. Control de accesos de Administración (rutas /admin/*)
  // Excepción: /admin/audit-logs accesible por Supervisores, Managers, IT y AI & Software Development
  if (pathname.startsWith('/admin')) {
    if (pathname.startsWith('/admin/audit-logs')) {
      if (!canViewAuditLogs(token)) {
        return NextResponse.redirect(new URL('/acceso-denegado', request.url))
      }
    } else if (!isITConfigUI) {
      const allowedAdminRoles = ['IT_MANAGER', 'TECHNOLOGY_ADMIN', 'TECHNOLOGY', 'HR', 'MANAGER']
      if (!allowedAdminRoles.includes(role)) {
        return NextResponse.redirect(new URL('/acceso-denegado', request.url))
      }
    }
  }

  // 6. Control de accesos de Dashboard (ruta /dashboard)
  // Solo accesible por CEO, HR, MANAGER, IT_MANAGER, TECHNOLOGY_ADMIN, SUPERVISOR, TEAM_LEAD, TECHNOLOGY
  if (pathname.startsWith('/dashboard')) {
    if (!canAccessApprovalsPanel(token as any)) {
      return NextResponse.redirect(new URL('/acceso-denegado', request.url))
    }
  }

  return NextResponse.next()
}

// Configuración de rutas que el middleware interceptará
export const config = {
  matcher: [
    '/admin/:path*', 
    '/dashboard/:path*', 
    '/configuracion-ti/:path*',
    '/vacations/:path*', 
    '/calendar/:path*', 
    '/profile/:path*', 
    '/groups/:path*',
    '/social/:path*',
    '/knowledge-base/:path*',
    '/api/:path*'
  ]
}
