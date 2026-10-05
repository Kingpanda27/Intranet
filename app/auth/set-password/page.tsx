"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { setInitialPassword } from "@/app/actions/userActions"
import { Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

function SetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  if (!token) {
    return (
      <div className="card glass animate-in" style={{ textAlign: "center", padding: "3rem" }}>
        <AlertCircle size={48} style={{ color: "hsl(var(--destructive))", marginBottom: "1rem" }} />
        <h2 style={{ marginBottom: "0.5rem" }}>Enlace Inválido</h2>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>Este enlace de invitación no es válido o ha expirado.</p>
        <button onClick={() => router.push("/")} className="btn btn-primary" style={{ marginTop: "1.5rem" }}>Volver al Inicio</button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setStatus({ type: 'error', text: "Las contraseñas no coinciden." })
      return
    }
    if (password.length < 6) {
      setStatus({ type: 'error', text: "La contraseña debe tener al menos 6 caracteres." })
      return
    }

    setIsPending(true)
    setStatus(null)

    try {
      const result = await setInitialPassword(token, password)
      if (result.success) {
        setStatus({ type: 'success', text: "¡Contraseña configurada con éxito! Ya puedes iniciar sesión." })
        setTimeout(() => router.push("/"), 3000)
      } else {
        setStatus({ type: 'error', text: result.error || "Error al configurar contraseña." })
      }
    } catch (err) {
      setStatus({ type: 'error', text: "Ocurrió un error inesperado." })
    } finally {
      setIsPending(false)
    }
  }

  if (status?.type === 'success') {
    return (
      <div className="card glass animate-in" style={{ textAlign: "center", padding: "3rem" }}>
        <CheckCircle2 size={48} style={{ color: "hsl(145 60% 45%)", marginBottom: "1rem" }} />
        <h2 style={{ marginBottom: "0.5rem" }}>¡Todo listo!</h2>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>{status.text}</p>
        <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "hsl(var(--primary))" }}>
          <Loader2 className="animate-spin" size={16} /> Redirigiendo...
        </div>
      </div>
    )
  }

  return (
    <div className="card glass animate-in" style={{ width: "100%", maxWidth: "420px", padding: "2.5rem 2rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "0.8rem",
          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(262 60% 55%))",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.25rem", color: "white"
        }}>
          <Lock size={28} />
        </div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Configura tu Contraseña</h1>
        <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" }}>
          Bienvenido a la Intranet de TN. Por favor, establece una contraseña para tu cuenta.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {status?.type === 'error' && (
          <div style={{
            backgroundColor: "hsl(var(--destructive) / 0.1)",
            color: "hsl(var(--destructive))",
            padding: "0.75rem",
            borderRadius: "var(--radius-md)",
            display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem"
          }}>
            <AlertCircle size={18} />
            <span>{status.text}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(var(--muted-foreground))" }}>
            Nueva Contraseña
          </label>
          <input
            type="password"
            required
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ paddingLeft: "1rem" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(var(--muted-foreground))" }}>
            Confirmar Contraseña
          </label>
          <input
            type="password"
            required
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            style={{ paddingLeft: "1rem" }}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary"
          style={{ marginTop: "0.5rem", padding: "0.875rem" }}
        >
          {isPending ? "Guardando..." : "Confirmar Contraseña"}
        </button>
      </form>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <div className="auth-layout" style={{ minHeight: "100vh", padding: "2rem" }}>
      <Suspense fallback={<div>Cargando...</div>}>
        <SetPasswordForm />
      </Suspense>
    </div>
  )
}
