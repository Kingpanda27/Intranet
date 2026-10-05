import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import WhatsappManager from "@/app/components/Admin/Config/WhatsappManager"
import OllamaManager from "@/app/components/Admin/Config/OllamaManager"
import ApiKeysManager from "@/app/components/Admin/Config/ApiKeysManager"

async function isTechRole(role: string) {
  return role === "TECHNOLOGY" || role === "IT_MANAGER" || role === "TECHNOLOGY_ADMIN" || role === "ADMIN"
}

export default async function AdminConfigPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !(await isTechRole((session.user as any).role))) {
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
    <div className="container" style={{ padding: "2rem 1.5rem" }}>
      <h1 style={{ marginBottom: "2rem" }}>Configuración TI</h1>
      
      <div style={{ display: "grid", gap: "2rem" }}>
        <ApiKeysManager initialConfigs={apiConfigs} />
        <WhatsappManager initialConfigs={whatsappConfigs} projects={projects} documents={documents} />
        <OllamaManager initialConfigs={ollamaConfigs} documents={documents} whatsappConfigs={whatsappConfigs} />
      </div>
    </div>
  )
}
