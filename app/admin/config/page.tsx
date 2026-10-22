import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ConfigTabsWrapper from "./ConfigTabsWrapper"

async function isTechRole(role: string, email?: string) {
  if (email?.toLowerCase().trim() === "ireyes@tnoutsourcing.com") return true
  return role === "TECHNOLOGY" || role === "IT_MANAGER" || role === "TECHNOLOGY_ADMIN" || role === "ADMIN"
}

export default async function AdminConfigPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !(await isTechRole((session.user as any).role, (session.user as any).email))) {
    redirect("/")
  }

  // Aseguramos que exista la configuración de Ollama
  let ollamaConfig = await prisma.ollamaConfig.findFirst({
    include: { documents: true }
  })
  
  if (!ollamaConfig) {
    ollamaConfig = await prisma.ollamaConfig.create({
      data: {
        url: "http://192.168.50.233:11434",
        modelName: "llama3.2"
      },
      include: { documents: true }
    })
  }

  const [whatsappConfigs, projects, documents, ollamaConfigs, apiConfigs] = await Promise.all([
    prisma.whatsappConfig.findMany({
      include: { projects: true, documents: true }
    }),
    prisma.project.findMany(),
    prisma.document.findMany(),
    prisma.ollamaConfig.findMany({
        include: { documents: true }
    }),
    prisma.apiConfiguration.findMany()
  ])

  return (
    <div className="container" style={{ padding: "1.5rem 1rem", maxWidth: "1600px", margin: "0 auto" }}>
      <ConfigTabsWrapper
        apiConfigs={apiConfigs}
        whatsappConfigs={whatsappConfigs}
        projects={projects}
        documents={documents}
        ollamaConfigs={ollamaConfigs}
      />
    </div>
  )
}
