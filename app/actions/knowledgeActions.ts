"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getKnowledgeCategories() {
  return await prisma.knowledgeCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { articles: true } }
    }
  })
}

export async function getKnowledgeArticles(categoryId?: string, query?: string) {
  return await prisma.knowledgeArticle.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(query ? {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } }
        ]
      } : {})
    },
    orderBy: [
      { isFeatured: 'desc' },
      { createdAt: 'desc' }
    ],
    include: {
      author: { select: { name: true, image: true } },
      category: { select: { name: true, icon: true } }
    }
  })
}

export async function getKnowledgeArticle(id: string) {
  const article = await prisma.knowledgeArticle.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, image: true } },
      category: { select: { name: true, icon: true } }
    }
  })
  
  if (article) {
    // Fire and forget view increment
    prisma.knowledgeArticle.update({
      where: { id },
      data: { views: { increment: 1 } }
    }).catch(console.error)
  }
  
  return article
}
