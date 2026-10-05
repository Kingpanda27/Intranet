"use client"

import { QRCodeSVG } from "qrcode.react"
import { useState, useEffect } from "react"
import { QrCode, X, CheckCircle2 } from "lucide-react"

export default function WhatsappQR({ onLinked }: { onLinked: (code: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<"generate" | "scan" | "success">("generate")
  const [dummyCode, setDummyCode] = useState("")

  const startLinking = () => {
    setIsOpen(true)
    setStep("scan")
    // Simulamos un código de vinculación aleatorio
    const newCode = "WA-" + Math.random().toString(36).substring(2, 9).toUpperCase()
    setDummyCode(newCode)
  }

  const simulateSuccess = () => {
    setStep("success")
    setTimeout(() => {
      onLinked(dummyCode)
      setIsOpen(false)
      setStep("generate")
    }, 2000)
  }

  if (!isOpen) {
    return (
      <button className="btn btn-surface" onClick={startLinking} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <QrCode size={18} /> Vincular por QR
      </button>
    )
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(4px)"
    }}>
      <div className="card" style={{ maxWidth: "400px", width: "90%", position: "relative", textAlign: "center", padding: "2rem" }}>
        <button 
          onClick={() => setIsOpen(false)} 
          style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))" }}
        >
          <X size={24} />
        </button>

        {step === "scan" && (
          <>
            <h2 style={{ marginBottom: "1rem" }}>Escanea el Código</h2>
            <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", marginBottom: "1.5rem" }}>
              Abre WhatsApp en tu teléfono {">"} Dispositivo vinculados {">"} Vincular un dispositivo.
            </p>
            <div style={{ backgroundColor: "white", padding: "1rem", borderRadius: "0.5rem", display: "inline-block", marginBottom: "1.5rem" }}>
              <QRCodeSVG value={dummyCode} size={200} />
            </div>
            <p style={{ fontWeight: 600, color: "hsl(var(--primary))", marginBottom: "1rem" }}>{dummyCode}</p>
            <button className="btn btn-primary" onClick={simulateSuccess}>Simular Escaneo Exitoso</button>
          </>
        )}

        {step === "success" && (
          <div style={{ padding: "2rem 0" }}>
            <CheckCircle2 size={64} color="#10b981" style={{ margin: "0 auto 1.5rem" }} />
            <h2 style={{ marginBottom: "0.5rem" }}>¡Vinculado!</h2>
            <p style={{ color: "hsl(var(--muted-foreground))" }}>La cuenta se ha sincronizado correctamente.</p>
          </div>
        )}
      </div>
    </div>
  )
}
