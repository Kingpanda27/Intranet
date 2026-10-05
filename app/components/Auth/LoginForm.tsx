"use client"

import { signIn } from "next-auth/react"
import { AlertCircle, Lock, Mail, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useTheme } from "@/app/Providers"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMs, setLoadingMs] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { theme } = useTheme()

  const handleMicrosoftSignIn = async () => {
    setLoadingMs(true)
    setError("")
    try {
      await signIn("azure-ad", { callbackUrl: "/" })
    } catch (err: any) {
      console.error("Error al iniciar sesión con Microsoft:", err)
      setError("Error al conectar con Microsoft Entra ID.")
      setLoadingMs(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError("Credenciales incorrectas o cuenta inactiva.")
        setLoading(false)
      } else {
        window.location.href = "/"
      }
    } catch (err) {
      setError("Ocurrió un error inesperado.")
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="card glass animate-in" style={{ width: "100%", maxWidth: "440px", padding: "2.5rem 2rem", border: "1px solid hsl(var(--primary) / 0.25)", boxShadow: "var(--shadow-lg)" }}>

        {/* Logo & heading */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img 
            src={theme === "light" ? "/logo_login.png" : "/logo_tn_dark.png"} 
            alt="Telecom Networks" 
            style={{ 
              height: "80px", 
              width: "auto", 
              margin: "0 auto 1.25rem", 
              display: "block" 
            }} 
          />
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.35rem" }}>Telecom Networks Connect</h1>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" }}>
            Portal Intranet Corporativo
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: "hsl(var(--destructive) / 0.1)",
            color: "hsl(var(--destructive))",
            padding: "0.75rem",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            marginBottom: "1.25rem"
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Microsoft Entra ID Primary Sign In */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={handleMicrosoftSignIn}
            disabled={loadingMs || loading}
            style={{
              width: "100%",
              padding: "0.85rem 1rem",
              borderRadius: "0.6rem",
              backgroundColor: "#2F2F2F",
              color: "#FFFFFF",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: (loadingMs || loading) ? "not-allowed" : "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.75rem",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              transition: "transform 0.15s ease, background-color 0.2s"
            }}
            className="hover-scale"
          >
            {/* Microsoft 4-color squares SVG */}
            <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1H10V10H1V1Z" fill="#F25022"/>
              <path d="M11 1H20V10H11V1Z" fill="#7FBA00"/>
              <path d="M1 11H10V20H1V11Z" fill="#00A4EF"/>
              <path d="M11 11H20V20H11V11Z" fill="#FFB900"/>
            </svg>
            <span>{loadingMs ? "Conectando con Microsoft..." : "Sign in with Microsoft 365"}</span>
          </button>
          
          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", margin: "0.25rem 0" }}>
            Usa tu cuenta corporativa @tnoutsourcing.com
          </p>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", margin: "1.5rem 0", gap: "0.75rem" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "hsl(var(--border) / 0.6)" }} />
          <button
            type="button"
            onClick={() => setShowCredentials(!showCredentials)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.78rem",
              color: "hsl(var(--muted-foreground))",
              fontWeight: 500
            }}
          >
            {showCredentials ? "Ocultar acceso legacy ▲" : "Acceso con contraseña ▼"}
          </button>
          <div style={{ flex: 1, height: "1px", backgroundColor: "hsl(var(--border) / 0.6)" }} />
        </div>

        {/* Collapsible Local Credentials Form */}
        {showCredentials && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }} className="animate-in">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(var(--muted-foreground))" }}>
                Correo Electrónico
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@tnoutsourcing.com"
                  className="input"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem 0.75rem 2.75rem",
                    borderRadius: "0.6rem",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--surface))",
                    color: "hsl(var(--foreground))",
                    fontSize: "0.95rem"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(var(--muted-foreground))" }}>
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  style={{
                    width: "100%",
                    padding: "0.75rem 2.75rem 0.75rem 2.75rem",
                    borderRadius: "0.6rem",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--surface))",
                    color: "hsl(var(--foreground))",
                    fontSize: "0.95rem"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "hsl(var(--muted-foreground))",
                    padding: "0.25rem",
                    display: "flex",
                    alignItems: "center"
                  }}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || loadingMs}
              style={{
                width: "100%",
                padding: "0.875rem",
                borderRadius: "0.6rem",
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              {loading ? "Iniciando sesión..." : "Iniciar con Contraseña"}
            </button>
          </form>
        )}

        <div style={{ marginTop: "2rem", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", textAlign: "center", lineHeight: "1.5" }}>
          Desarrollado por IT Telecom Support Team<br/>
          Soporte: <a href="mailto:support@tnoutsourcing.com" style={{ color: "hsl(var(--primary))", textDecoration: "none", fontWeight: 600 }}>support@tnoutsourcing.com</a>
        </div>
      </div>
    </div>
  )
}
