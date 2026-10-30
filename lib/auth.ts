import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import AzureADProvider from "next-auth/providers/azure-ad"

export const SUPERADMIN_EMAILS = [
  "ireyes@tnoutsourcing.com",
  "rurena@tnoutsourcing.com",
  "pbrun@tnoutsourcing.com"
]

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return SUPERADMIN_EMAILS.includes(email.toLowerCase().trim())
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID || "",
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "openid profile email User.Read"
        }
      },
      profile(profile) {
        const oid = profile.oid || profile.sub
        const rawName = profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim() || profile.preferred_username || "Usuario Microsoft"
        const rawEmail = (profile.email || profile.preferred_username || profile.upn || "").toLowerCase().trim()
        
        return {
          id: oid,
          name: rawName,
          email: rawEmail,
          image: null,
          role: "AGENT",
          status: "ACTIVE",
          entraObjectId: oid,
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (process.env.NODE_ENV === "development") {
        console.log("=== NEXTAUTH SIGNIN CALLBACK ===");
        console.log("Provider:", account?.provider);
        console.log("User Email:", user?.email);
      }
      
      try {
        // 1. Manejo de autenticación corporativa Microsoft Entra ID
        if (account?.provider === "azure-ad") {
          const expectedTenantId = process.env.AZURE_AD_TENANT_ID
          const receivedTenantId = (profile as any)?.tid || (account as any)?.tenantId

          // Validación estricta de Single-Tenant
          if (expectedTenantId && receivedTenantId && receivedTenantId !== expectedTenantId) {
            console.error("Acceso denegado: Tenant ID no coincide con la organización autorizada.");
            return false
          }

          const userEmail = (user.email || (profile as any)?.preferred_username || (profile as any)?.upn || "").toLowerCase().trim()
          if (!userEmail) {
            console.error("Acceso denegado: No se pudo obtener el correo corporativo.");
            return false
          }

          const entraObjectId = (profile as any)?.oid || (profile as any)?.sub || user.id

          try {
            // Buscar usuario existente por entraObjectId o email
            let dbUser = await prisma.user.findFirst({
              where: {
                OR: [
                  { entraObjectId: entraObjectId },
                  { email: userEmail }
                ]
              }
            })

            if (dbUser) {
              // Si el usuario existe pero no tiene entraObjectId registrado, vincularlo
              if (!dbUser.entraObjectId && entraObjectId) {
                await prisma.user.update({
                  where: { id: dbUser.id },
                  data: {
                    entraObjectId,
                    emailVerified: new Date()
                  }
                })
              }

              // Verificar si la cuenta está inactiva o ha causado baja
              if (dbUser.status === "INACTIVE" || dbUser.role === "NO_ROLE" || dbUser.isActive === false) {
                console.warn(`Intento de login de usuario inactivo o dado de baja: ${userEmail}`);
                return false
              }
            } else {
              // Auto-provisioning: Creación de nuevo empleado como AGENT
              const userName = user.name || (profile as any)?.name || userEmail.split("@")[0]
              const newUser = await prisma.user.create({
                data: {
                  name: userName,
                  email: userEmail,
                  role: "AGENT",
                  status: "ACTIVE",
                  entraObjectId: entraObjectId,
                  emailVerified: new Date()
                }
              })

              // Registrar creación automática en AuditLog
              try {
                await prisma.auditLog.create({
                  data: {
                    userId: newUser.id,
                    userName: userName,
                    action: "USER_CREATED_ENTRA_ID",
                    target: userEmail,
                    result: "SUCCESS"
                  }
                })
              } catch (auditErr) {
                console.error("Error al registrar AuditLog de auto-provisioning:", auditErr);
              }
            }

            return true
          } catch (dbErr) {
            console.error("Error en base de datos durante sign in con Entra ID:", dbErr);
            return false
          }
        }

        // 2. Manejo de autenticación local Credentials (usuarios creados en base de datos)
        if (account?.provider === "credentials") {
          return Boolean(user && user.email)
        }

        console.error("Provider no coincide:", account?.provider);
        return false
      } catch (globalErr) {
        console.error("ERROR GLOBAL EN SIGNIN CALLBACK:", globalErr);
        return false
      }
    },

    async jwt({ token, user, account, profile }) {
      const email = token.email || user?.email
      const entraObjectId = (profile as any)?.oid || (profile as any)?.sub

      if (email || entraObjectId || token.id) {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              ...(token.id ? [{ id: token.id as string }] : []),
              ...(entraObjectId ? [{ entraObjectId }] : []),
              ...(email ? [{ email: String(email).trim().toLowerCase() }] : [])
            ]
          },
          select: { 
            id: true, email: true, role: true, name: true, status: true, isActive: true, entraObjectId: true, position: true, 
            project: { select: { name: true } },
            projects: { select: { name: true } }
          }
        })

        if (dbUser) {
          token.id = dbUser.id
          token.role = String(dbUser.role || "AGENT").trim()
          token.name = dbUser.name
          token.status = dbUser.status || "ACTIVE"
          token.isActive = Boolean(dbUser.isActive ?? true) && dbUser.status !== "INACTIVE"
          token.entraObjectId = dbUser.entraObjectId
          token.position = dbUser.position || ""
          token.projectName = (dbUser.projects && dbUser.projects.length > 0)
            ? dbUser.projects.map((p: any) => p.name).join(", ")
            : (dbUser.project?.name || "Telecom Networks")
          token.isSuperAdmin = isSuperAdminEmail(String(email || dbUser.email || ''))
        }
      }

      const emailStr = String(email || token.email || '').toLowerCase().trim()
      if (isSuperAdminEmail(emailStr)) {
        token.isSuperAdmin = true
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).status = token.status || "ACTIVE"
        ;(session.user as any).isActive = token.isActive !== false
        ;(session.user as any).entraObjectId = token.entraObjectId
        ;(session.user as any).name = token.name || session.user.name
        ;(session.user as any).position = (token as any).position || ""
        ;(session.user as any).projectName = (token as any).projectName || "Telecom Networks"
        ;(session.user as any).isSuperAdmin = Boolean(token.isSuperAdmin || (session.user?.email && isSuperAdminEmail(session.user.email)))
      }
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
}
