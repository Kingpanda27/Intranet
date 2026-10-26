import Link from "next/link"
import { ShieldAlert, ArrowLeft, Home, Lock } from "lucide-react"

export default function AccesoDenegadoPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0f1d",
        padding: "1.5rem",
        color: "#f8fafc"
      }}
    >
      <div
        style={{
          width: "min(560px, 94vw)",
          backgroundColor: "#0d1527",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          borderRadius: "1.5rem",
          padding: "2.5rem 2rem",
          boxShadow: "0 25px 60px -15px rgba(239, 68, 68, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem"
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "1.25rem",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1.5px solid rgba(239, 68, 68, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ef4444",
            boxShadow: "0 0 25px rgba(239, 68, 68, 0.2)"
          }}
        >
          <ShieldAlert size={38} />
        </div>

        <div>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "#ef4444",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              padding: "0.25rem 0.75rem",
              borderRadius: "9999px",
              textTransform: "uppercase",
              letterSpacing: "0.08em"
            }}
          >
            403 Forbidden · Acceso Restringido
          </span>
          <h1
            style={{
              fontSize: "1.65rem",
              fontWeight: 900,
              margin: "0.85rem 0 0.4rem",
              color: "#ffffff",
              letterSpacing: "-0.02em"
            }}
          >
            Acceso Denegado
          </h1>
          <p
            style={{
              fontSize: "0.92rem",
              color: "#94a3b8",
              lineHeight: 1.5,
              margin: 0,
              maxWidth: "440px"
            }}
          >
            No dispones de los permisos o alcance de datos requerido para ingresar a esta sección o ejecutar esta acción.
          </p>
        </div>

        <div
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "0.85rem",
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            textAlign: "left",
            fontSize: "0.8rem",
            color: "#94a3b8",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#f8fafc", fontWeight: 700 }}>
            <Lock size={14} color="#f59e0b" />
            <span>Política de Seguridad y Autorización (Data Scoping):</span>
          </div>
          <div>• <strong>Configuración de TI:</strong> Exclusivo para personal de Tecnología / IT.</div>
          <div>• <strong>Panel de Aprobaciones:</strong> Reservado para roles de mando sobre su equipo asignado.</div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              fontSize: "0.9rem",
              fontWeight: 800,
              color: "#ffffff",
              backgroundColor: "hsl(var(--primary))",
              textDecoration: "none",
              boxShadow: "0 4px 18px hsl(var(--primary) / 0.4)"
            }}
          >
            <Home size={16} />
            <span>Ir al Inicio</span>
          </Link>
          <Link
            href="/vacations"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.25rem",
              borderRadius: "0.75rem",
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "#94a3b8",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              textDecoration: "none"
            }}
          >
            <ArrowLeft size={16} />
            <span>Mis Solicitudes</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
