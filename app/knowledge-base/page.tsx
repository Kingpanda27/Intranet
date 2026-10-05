import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { KBList } from "@/app/components/KnowledgeBase/KBList"
import { getDocuments, uploadDocument } from "@/app/actions/kbActions"
import { prisma } from "@/lib/prisma"

export default async function KBPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/")

  const documents = await getDocuments()
  const user = session.user as any

  // Obtener proyectos disponibles para elegir destino
  const projects = await (prisma.project as any).findMany({
    where: user.role === "IT_MANAGER" || user.role === "TECHNOLOGY" ? {} : { supervisors: { some: { id: user.id } } },
    select: { id: true, name: true }
  })

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "hsl(var(--background))" }}>
      <KBList initialDocuments={documents as any} userRole={user.role} currentUserId={user.id} onUpload={uploadDocument} projects={projects as any} />
    </main>
  )
}
