"use server"

import { requireAuth, hasPermission, requirePermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { saveFile } from "./fileActions"

export async function createPost(formData: FormData) {
  const user = await requireAuth()

  const content = formData.get("content") as string
  const imageFile = formData.get("image") as File
  if (!content || content.trim().length === 0) return { error: "El contenido no puede estar vacío" }

  let imageUrl = null
  if (imageFile && imageFile.size > 0) {
    imageUrl = await saveFile(imageFile, "posts")
  }

  await prisma.post.create({
    data: {
      content: content.trim(),
      authorId: user.id,
      imageUrl: imageUrl
    }
  })

  revalidatePath("/")
  return { success: true }
}

export async function toggleReaction(postId: string, reaction: string = "LIKE") {
  const user = await requireAuth()
  const userId = user.id

  const existingLike = await prisma.like.findUnique({
    where: {
      authorId_postId: {
        authorId: userId,
        postId: postId
      }
    }
  })

  if (existingLike) {
    if (existingLike.reaction === reaction) {
      await prisma.like.delete({ where: { id: existingLike.id } })
    } else {
      await prisma.like.update({ 
        where: { id: existingLike.id },
        data: { reaction }
      })
    }
  } else {
    await prisma.like.create({
      data: {
        authorId: userId,
        postId: postId,
        reaction: reaction
      }
    })
  }

  revalidatePath("/")
  return { success: true }
}

export async function togglePostFeatured(postId: string, isFeatured: boolean) {
  await requirePermission("posts:feature")

  await prisma.post.update({
    where: { id: postId },
    data: { isFeatured }
  })

  revalidatePath("/")
  return { success: true }
}

export async function addComment(postId: string, content: string) {
  const user = await requireAuth()

  if (!content || content.trim().length === 0) return { error: "El comentario no puede estar vacío" }

  await prisma.comment.create({
    data: {
      content: content.trim(),
      postId: postId,
      authorId: user.id
    }
  })

  revalidatePath("/")
  return { success: true }
}

export async function deletePost(postId: string) {
  const user = await requireAuth()

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) return { error: "Publicación no encontrada" }

  const canDeleteAnyPost = hasPermission(user.role, "posts:delete")
  const isAuthor = post.authorId === user.id

  if (!canDeleteAnyPost && !isAuthor) {
    return { error: "No tienes permisos de moderación ni autoría para borrar esta publicación" }
  }

  try {
    // Cascada manual
    await prisma.like.deleteMany({ where: { postId: postId } })
    await prisma.comment.deleteMany({ where: { postId: postId } })
    await prisma.post.delete({ where: { id: postId } })
    
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al eliminar la publicación de la base de datos" }
  }
}
