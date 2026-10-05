"use client"

import { useState } from "react"
import { Calendar, Plus, Trash2 } from "lucide-react"
import { addHoliday, getHolidays } from "@/app/actions/timeOffActions"

export function HolidayManager({ initialHolidays }: { initialHolidays: any[] }) {
  const [holidays, setHolidays] = useState(initialHolidays)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const date = formData.get("date") as string

    const res = await addHoliday(name, date)
    if (res.success) {
      window.location.reload()
    } else {
      alert(res.error)
    }
    setLoading(false)
  }

  return (
    <div className="card glass animate-in" style={{ marginTop: "2rem" }}>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Calendar size={20} color="hsl(var(--primary))" />
        Gestión de Feriados (Admin)
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem" }}>Nombre del Feriado</label>
            <input name="name" className="input" placeholder="Año Nuevo" required />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem" }}>Fecha</label>
            <input name="date" type="date" className="input" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Plus size={16} />
            {loading ? "Agregando..." : "Agregar Feriado"}
          </button>
        </form>

        <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", padding: "1rem" }}>
          <h3 style={{ fontSize: "0.9rem", marginBottom: "1rem", color: "hsl(var(--muted-foreground))" }}>Próximos Feriados</h3>
          {holidays.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>No hay feriados registrados.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {holidays.map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", padding: "0.5rem", background: "hsl(var(--muted)/0.3)", borderRadius: "0.25rem" }}>
                  <span>{h.name}</span>
                  <span style={{ fontWeight: 600 }}>{new Date(h.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
