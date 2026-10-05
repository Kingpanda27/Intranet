import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export type Role =
  | "AGENT"
  | "USER"
  | "SUPERVISOR"
  | "MANAGER"
  | "HR"
  | "TECHNOLOGY"
  | "TECHNOLOGY_ADMIN"
  | "IT_MANAGER"
  | "NO_ROLE"

export type Permission =
  | "users:create"
  | "users:edit"
  | "users:delete"
  | "users:view_all"
  | "users:role:request"
  | "users:role:approve"
  | "users:role:reject"
  | "documents:create"
  | "documents:read"
  | "documents:delete"
  | "posts:delete"
  | "posts:feature"
  | "vacations:approve"
  | "vacations:create_on_behalf"
  | "hr:manage"
  | "it:manage"
  | "admin:full"
  | "config:manage"

export const ROLE_HIERARCHY: Record<string, number> = {
  NO_ROLE: 0,
  USER: 10,
  AGENT: 10,
  SUPERVISOR: 20,
  MANAGER: 30,
  HR: 35,
  TECHNOLOGY: 40,
  IT_MANAGER: 50,
  TECHNOLOGY_ADMIN: 50,
}

const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  TECHNOLOGY_ADMIN: new Set([
    "users:create", "users:edit", "users:delete", "users:view_all",
    "users:role:request", "users:role:approve", "users:role:reject",
    "documents:create", "documents:read", "documents:delete",
    "posts:delete", "posts:feature",
    "vacations:approve", "vacations:create_on_behalf",
    "hr:manage", "it:manage", "admin:full", "config:manage"
  ]),
  IT_MANAGER: new Set([
    "users:create", "users:edit", "users:delete", "users:view_all",
    "users:role:request", "users:role:approve", "users:role:reject",
    "documents:create", "documents:read", "documents:delete",
    "posts:delete", "posts:feature",
    "vacations:approve", "vacations:create_on_behalf",
    "hr:manage", "it:manage", "admin:full", "config:manage"
  ]),
  TECHNOLOGY: new Set([
    "users:create", "users:edit", "users:view_all",
    "users:role:request", "users:role:approve", "users:role:reject",
    "documents:create", "documents:read", "documents:delete",
    "posts:delete", "posts:feature",
    "vacations:approve", "vacations:create_on_behalf",
    "it:manage", "config:manage"
  ]),
  HR: new Set([
    "users:create", "users:edit", "users:view_all",
    "users:role:request",
    "documents:create", "documents:read", "documents:delete",
    "posts:delete", "posts:feature",
    "vacations:approve", "vacations:create_on_behalf",
    "hr:manage"
  ]),
  MANAGER: new Set([
    "users:view_all",
    "users:role:request",
    "documents:create", "documents:read",
    "posts:delete", "posts:feature",
    "vacations:approve", "vacations:create_on_behalf"
  ]),
  SUPERVISOR: new Set([
    "users:role:request",
    "documents:read",
    "posts:feature",
    "vacations:approve", "vacations:create_on_behalf"
  ]),
  AGENT: new Set([
    "documents:read"
  ]),
  USER: new Set([
    "documents:read"
  ]),
  NO_ROLE: new Set([])
}

export function hasPermission(role: Role | string, permission: Permission): boolean {
  const cleanRole = (role || "").trim() as Role
  const roleSet = ROLE_PERMISSIONS[cleanRole]
  if (!roleSet) return false
  return roleSet.has(permission)
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !(session.user as any).id) {
    throw new Error("No autenticado: Inicia sesión para realizar esta acción.")
  }
  const rawRole = (session.user as any).role || "USER"
  const cleanRole = String(rawRole).trim() as Role
  const user = {
    ...(session.user as any),
    role: cleanRole
  } as { id: string; name?: string; email?: string; role: Role; image?: string }

  if (user.role === "NO_ROLE") {
    throw new Error("Acceso denegado: Tu cuenta no tiene un rol activo asignado.")
  }
  return user
}

export async function requirePermission(permission: Permission) {
  const user = await requireAuth()
  if (!hasPermission(user.role, permission)) {
    throw new Error(`Acceso denegado: Se requiere el permiso ${permission}.`)
  }
  return user
}
