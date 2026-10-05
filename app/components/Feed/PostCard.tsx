"use client"

import { useState } from "react"
import { Heart, MessageCircle, Send, Trash2, MoreHorizontal, Share2, Pin } from "lucide-react"
import { toggleReaction, addComment, deletePost, togglePostFeatured } from "@/app/actions/postActions"
import { UserStatusBadge } from "@/app/components/UI/UserStatusBadge"

export const REACTION_TYPES = {
  LIKE: { icon: "👍", label: "Me gusta", color: "hsl(210 100% 50%)" },
  CLAP: { icon: "👏", label: "Celebrar", color: "hsl(150 80% 40%)" },
  CELEBRATE: { icon: "🎉", label: "Felicitar", color: "hsl(40 90% 50%)" },
  IDEA: { icon: "💡", label: "Buena idea", color: "hsl(50 90% 45%)" },
  HEART: { icon: "❤️", label: "Me encanta", color: "hsl(340 80% 60%)" }
}

type PostProps = {
  post: {
    id: string
    content: string
    imageUrl: string | null
    createdAt: Date
    isFeatured?: boolean
    type?: string
    author: { id: string; name: string | null; image: string | null; currentStatus?: any }
    likes: { id: string; authorId: string; reaction?: string }[]
    comments: { id: string; content: string; author: { name: string | null; image: string | null; currentStatus?: any }; createdAt: Date }[]
  }
  currentUserId: string
  currentUserRole: string
  hasLiked: boolean
  userReaction?: string
  index: number
}

export function PostCard({ post, currentUserId, currentUserRole, hasLiked, userReaction, index }: PostProps) {
  const [optimisticReaction, setOptimisticReaction] = useState(userReaction || null)
  const [likeCount, setLikeCount] = useState(post.likes.length)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [showReactions, setShowReactions] = useState(false)

  const handleReaction = async (reaction: string) => {
    const isRemoving = optimisticReaction === reaction
    const nextReaction = isRemoving ? null : reaction
    
    // Adjust count only if transitioning from null to active or active to null. 
    // If just changing reaction, count stays same.
    if (!optimisticReaction && nextReaction) setLikeCount(prev => prev + 1)
    if (optimisticReaction && !nextReaction) setLikeCount(prev => prev - 1)
      
    setOptimisticReaction(nextReaction)
    setShowReactions(false)
    await toggleReaction(post.id, reaction)
  }

  const handleToggleFeature = async () => {
    setIsSubmitting(true)
    const result = await togglePostFeatured(post.id, !post.isFeatured)
    if (result?.error) alert(result.error)
    setIsSubmitting(false)
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || isSubmitting) return

    setIsSubmitting(true)
    await addComment(post.id, commentText)
    setCommentText("")
    setIsSubmitting(false)
  }

  const handleDeletePost = async () => {
    if (!confirm("¿Seguro que deseas eliminar esta publicación permanentemente?")) return
    setIsSubmitting(true)
    const result = await deletePost(post.id)
    if (result?.error) {
      alert(result.error)
    }
    setIsSubmitting(false)
  }

  const canDelete = ["MANAGER", "SUPERVISOR", "TECHNOLOGY", "IT_MANAGER"].includes(currentUserRole) || post.author.id === currentUserId;

  return (
    <div 
      className="card glass animate-in slide-in-bottom-sm post-card-hover" 
      style={{ 
        padding: "1.5rem", 
        display: "flex", 
        gap: "1.25rem", 
        alignItems: "flex-start",
        borderRadius: "1.25rem",
        border: "1px solid hsl(var(--border)/0.5)",
        backgroundColor: "hsl(var(--surface))",
        boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        animationDelay: `${index * 100}ms`
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .post-card-hover:hover {
          transform: translateY(-2px);
          boxShadow: 0 12px 30px rgba(0,0,0,0.06);
          border-color: hsl(var(--primary)/0.2);
        }
      `}} />

      {/* Avatar Sidebar */}
      <div style={{ position: "relative" }}>
        <div style={{ 
          width: 48, 
          height: 48, 
          borderRadius: "50%", 
          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.6))",
          color: "white", 
          overflow: "hidden",
          border: "2px solid hsl(var(--background))",
          boxShadow: "0 4px 12px hsl(var(--primary)/0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "1.2rem",
          flexShrink: 0
        }}>
          {post.author.image ? (
            <img src={post.author.image} alt={post.author.name || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            post.author.name?.charAt(0).toUpperCase() || "U"
          )}
        </div>
        {/* Online Indicator Glow */}
        {post.author.currentStatus && (
          <div style={{
            position: "absolute", bottom: "2px", right: "2px",
            width: "12px", height: "12px", borderRadius: "50%",
            backgroundColor: post.author.currentStatus.color,
            border: "2px solid hsl(var(--surface))",
            boxShadow: `0 0 8px ${post.author.currentStatus.color}`
          }} title={post.author.currentStatus.label} />
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>{post.author.name || "Usuario"}</h4>
            {post.author.currentStatus && post.author.currentStatus.status !== "AVAILABLE" && (
              <UserStatusBadge status={post.author.currentStatus} showText={true} />
            )}
            {post.author.id === "admin" && (
              <Pin size={12} style={{ color: "hsl(var(--primary))", transform: "rotate(45deg)" }} title="Pinned Post" />
            )}
            <span style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
              · {new Date(post.createdAt).toLocaleDateString("es-ES", {
                day: "numeric", month: "short"
              })} a las {new Date(post.createdAt).toLocaleTimeString("es-ES", {
                hour: "2-digit", minute:"2-digit"
              })}
            </span>
          </div>
          
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {canDelete && (
              <button 
                onClick={handleDeletePost}
                disabled={isSubmitting}
                className="btn btn-ghost hover-scale"
                title="Eliminar publicación"
                style={{ 
                  padding: "0.4rem", 
                  borderRadius: "50%",
                  color: "hsl(var(--muted-foreground))",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "hsl(var(--destructive))";
                  e.currentTarget.style.backgroundColor = "hsla(0, 84%, 60%, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "hsl(var(--muted-foreground))";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {isSubmitting ? <span style={{ fontSize: "0.7rem" }}>...</span> : <Trash2 size={16} />}
              </button>
            )}
            
            {["MANAGER", "SUPERVISOR", "TECHNOLOGY", "IT_MANAGER"].includes(currentUserRole) && (
              <button 
                onClick={handleToggleFeature}
                disabled={isSubmitting}
                className="btn btn-ghost hover-scale" 
                title={post.isFeatured ? "Quitar destacado" : "Destacar publicación"}
                style={{ 
                  padding: "0.4rem", borderRadius: "50%", 
                  color: post.isFeatured ? "hsl(340 80% 60%)" : "hsl(var(--muted-foreground))" 
                }}
              >
                <Pin size={16} />
              </button>
            )}

            <button className="btn btn-ghost hover-scale" style={{ padding: "0.4rem", borderRadius: "50%", color: "hsl(var(--muted-foreground))" }}>
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <p style={{ color: "hsl(var(--foreground))", fontSize: "1rem", lineHeight: "1.6", whiteSpace: "pre-wrap", marginBottom: "1.25rem", marginTop: "0.5rem" }}>
          {post.content}
        </p>

        {post.imageUrl && (
          <div style={{ 
            marginBottom: "1.25rem", 
            borderRadius: "1rem", 
            overflow: "hidden", 
            border: "1px solid hsl(var(--border) / 0.5)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            maxHeight: "520px"
          }}>
            <img src={post.imageUrl} alt="Publicación" style={{ width: "100%", maxHeight: "520px", objectFit: "cover" }} />
          </div>
        )}

        {/* Action Stats */}
        <div style={{ 
          display: "flex", 
          gap: "1.5rem", 
          marginTop: "0.5rem",
          paddingTop: "0.5rem",
          borderTop: "1px solid hsl(var(--border)/0.3)",
          position: "relative"
        }}>
          {showReactions && (
            <div className="animate-in fade-in slide-in-bottom-sm" style={{
              position: "absolute", bottom: "100%", left: 0, marginBottom: "0.5rem",
              display: "flex", gap: "0.5rem", padding: "0.5rem",
              backgroundColor: "hsl(var(--surface))", borderRadius: "2rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid hsl(var(--border)/0.5)",
              zIndex: 10
            }} onMouseLeave={() => setShowReactions(false)}>
              {Object.entries(REACTION_TYPES).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => handleReaction(key)}
                  className="hover-scale"
                  title={data.label}
                  style={{
                    background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer",
                    padding: "0.25rem", transition: "transform 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  {data.icon}
                </button>
              ))}
            </div>
          )}

          <div style={{ position: "relative" }} onMouseEnter={() => setShowReactions(true)}>
            <button 
              onClick={() => handleReaction(optimisticReaction || "LIKE")}
              className="btn btn-ghost hover-scale" 
              style={{ 
                color: optimisticReaction ? (REACTION_TYPES[optimisticReaction as keyof typeof REACTION_TYPES]?.color || "hsl(var(--primary))") : "hsl(var(--muted-foreground))",
                padding: "0.5rem 0.75rem",
                borderRadius: "9999px",
                boxShadow: "none",
                background: optimisticReaction ? "hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.1)" : "transparent",
                gap: "0.4rem",
                transition: "all 0.2s"
              }}
            >
              <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{optimisticReaction ? REACTION_TYPES[optimisticReaction as keyof typeof REACTION_TYPES]?.icon : "👍"}</span>
              <span style={{ fontSize: "0.85rem", fontWeight: optimisticReaction ? 800 : 600 }}>{likeCount}</span>
            </button>
          </div>

          <button 
            onClick={() => setShowComments(!showComments)}
            className="btn btn-ghost hover-scale" 
            style={{ 
              color: showComments ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              padding: "0.5rem 0.75rem",
              borderRadius: "9999px",
              boxShadow: "none",
              background: showComments ? "hsl(var(--primary)/0.1)" : "transparent",
              gap: "0.4rem",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "hsl(var(--primary))";
              e.currentTarget.style.backgroundColor = "hsl(var(--primary)/0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = showComments ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))";
              e.currentTarget.style.backgroundColor = showComments ? "hsl(var(--primary)/0.1)" : "transparent";
            }}
          >
            <MessageCircle size={18} />
            <span style={{ fontSize: "0.85rem", fontWeight: showComments ? 800 : 600 }}>{post.comments.length}</span>
          </button>
          
          <button 
            className="btn btn-ghost hover-scale" 
            style={{ 
              color: "hsl(var(--muted-foreground))",
              padding: "0.5rem 0.75rem",
              borderRadius: "9999px",
              boxShadow: "none",
              background: "transparent",
              gap: "0.4rem",
              marginLeft: "auto"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "hsl(var(--foreground))";
              e.currentTarget.style.backgroundColor = "hsl(var(--muted))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "hsl(var(--muted-foreground))";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* Comments Panel */}
        {showComments && (
          <div className="animate-in slide-in-top-sm" style={{ 
            marginTop: "1rem", 
            display: "flex", 
            flexDirection: "column", 
            gap: "1.25rem", 
            borderTop: "1px dashed hsl(var(--border) / 0.8)", 
            paddingTop: "1.25rem" 
          }}>
            {post.comments.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {post.comments.map(comment => (
                  <div key={comment.id} style={{ display: "flex", gap: "0.75rem" }}>
                    <div style={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: "50%", 
                      background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.6))",
                      color: "white",
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      fontWeight: 800, 
                      fontSize: "0.85rem",
                      flexShrink: 0,
                      boxShadow: "0 2px 8px hsl(var(--primary)/0.2)"
                    }}>
                      {comment.author.image ? (
                        <img src={comment.author.image} alt={comment.author.name || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        comment.author.name?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        backgroundColor: "hsl(var(--muted) / 0.4)", 
                        padding: "0.75rem 1rem", 
                        borderRadius: "1rem",
                        border: "1px solid hsl(var(--border) / 0.3)"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>
                            {comment.author.name}
                          </span>
                          {comment.author.currentStatus && comment.author.currentStatus.status !== "AVAILABLE" && (
                            <UserStatusBadge status={comment.author.currentStatus} showText={false} style={{ padding: "0.1rem 0.2rem" }} />
                          )}
                          <span style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))" }}>
                            {new Date(comment.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "hsl(var(--foreground))", lineHeight: "1.5" }}>
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", position: "relative" }}>
              <div style={{ 
                width: 36, height: 36, borderRadius: "50%", 
                backgroundColor: "hsl(var(--muted))", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, border: "1px solid hsl(var(--border))", fontWeight: 800, fontSize: "0.85rem", color: "hsl(var(--muted-foreground))"
              }}>
                T
              </div>
              <div style={{ position: "relative", flex: 1 }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Escribe tu respuesta..." 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{ 
                    fontSize: "0.9rem", 
                    padding: "0.75rem 1.25rem", 
                    paddingRight: "3.5rem",
                    borderRadius: "9999px",
                    backgroundColor: "transparent",
                    transition: "all 0.3s"
                  }}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary hover-scale" 
                  disabled={isSubmitting || !commentText.trim()} 
                  style={{ 
                    position: "absolute", 
                    right: "4px", 
                    top: "4px", 
                    bottom: "4px", 
                    padding: "0",
                    width: "36px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: (!commentText.trim()) ? "hsl(var(--muted))" : "linear-gradient(135deg, hsl(var(--primary)), hsl(280 80% 60%))",
                    color: (!commentText.trim()) ? "hsl(var(--muted-foreground))" : "white",
                    boxShadow: (!commentText.trim()) ? "none" : "0 4px 12px hsl(var(--primary)/0.3)",
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
