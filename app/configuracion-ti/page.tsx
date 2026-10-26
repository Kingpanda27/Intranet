import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { canAccessITConfig } from "@/lib/requestAuthorization"

export default async function ConfiguracionTiPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user || !canAccessITConfig(session.user as any)) {
    redirect("/acceso-denegado")
  }

  // Si está autorizado como personal de TI, redirigir al panel oficial de configuración
  redirect("/admin/config")
}
