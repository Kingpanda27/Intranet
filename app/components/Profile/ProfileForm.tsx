"use client"

import { useState, useRef } from "react"
import { User, Mail, Shield, Image as ImageIcon, Save, CheckCircle2, AlertCircle, UploadCloud, MapPin, Briefcase, FileText, Phone, Linkedin, Users, Globe, Star, X, Edit3 } from "lucide-react"
import { updateProfile } from "@/app/actions/userActions"

type ProfileFormProps = {
  user: {
    name: string | null
    email: string | null
    role: string
    image: string | null
    position: string | null
    location: string | null
    extension: string | null
    aboutMe: string | null
    skills: string | null
    socialLinkedIn: string | null
    socialTeams: string | null
    socialWebsite: string | null
    birthday: Date | null
    showBirthday: boolean
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [skillsStr, setSkillsStr] = useState(user.skills || "")

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setMessage(null)
    
    // Add skills manually
    formData.set("skills", skillsStr)

    const result = await updateProfile(formData)
    
    setLoading(false)
    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: "Perfil actualizado correctamente. Los cambios pueden tardar unos minutos en reflejarse." })
      setFileName(null)
      setTimeout(() => {
        setIsEditing(false)
        setMessage(null)
      }, 2500)
    }
  }

  if (!isEditing) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button 
          onClick={() => setIsEditing(true)}
          className="btn animate-in fade-in"
          style={{
            backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))",
            padding: "0.75rem 1.5rem", borderRadius: "2rem", display: "flex", alignItems: "center", gap: "0.5rem",
            fontWeight: 700, fontSize: "0.9rem", boxShadow: "0 4px 12px hsl(var(--primary)/0.3)"
          }}
        >
          <Edit3 size={16} /> Editar Mi Perfil
        </button>
      </div>
    )
  }

  return (
    <div className="card animate-in zoom-in-sm" style={{ 
      padding: "2rem", border: "1px solid hsl(var(--border)/0.6)", backgroundColor: "hsl(var(--surface))",
      borderRadius: "1.5rem", boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
      position: "relative"
    }}>
      <button 
        onClick={() => setIsEditing(false)}
        style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))" }}
      >
        <X size={20} />
      </button>

      <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Edit3 size={24} color="hsl(var(--primary))" /> Editar Información Personal
      </h2>
      
      <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Identidad */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>NOMBRE COMPLETO</label>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
              <input name="name" type="text" defaultValue={user.name || ""} className="input" style={{ paddingLeft: "2.8rem" }} required />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>CARGO O POSICIÓN</label>
            <div style={{ position: "relative" }}>
              <Briefcase size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
              <input name="position" type="text" defaultValue={user.position || ""} className="input" style={{ paddingLeft: "2.8rem" }} placeholder="Ej: Especialista de TI" />
            </div>
          </div>
        </div>

        {/* Contacto y Ubicación */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>UBICACIÓN</label>
            <div style={{ position: "relative" }}>
              <MapPin size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
              <input name="location" type="text" defaultValue={user.location || ""} className="input" style={{ paddingLeft: "2.8rem" }} placeholder="Ej: Santiago / Remoto" />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>EXTENSIÓN TELEFÓNICA</label>
            <div style={{ position: "relative" }}>
              <Phone size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
              <input name="extension" type="text" defaultValue={user.extension || ""} className="input" style={{ paddingLeft: "2.8rem" }} placeholder="Ej: 1045" />
            </div>
          </div>
        </div>

        {/* Acerca de Mí */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>ACERCA DE MÍ (Max 500 caract.)</label>
          <textarea 
            name="aboutMe" 
            defaultValue={user.aboutMe || ""} 
            className="input" 
            rows={4}
            maxLength={500}
            style={{ padding: "1rem", resize: "none" }} 
            placeholder="Escribe una breve descripción personal o profesional..."
          />
        </div>

        {/* Habilidades */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>HABILIDADES (Separadas por comas)</label>
          <input 
            type="text" 
            value={skillsStr}
            onChange={(e) => setSkillsStr(e.target.value)}
            className="input" 
            style={{ padding: "0.875rem 1rem" }} 
            placeholder="Ej: Microsoft 365, Soporte Técnico, React, Excel"
          />
        </div>

        {/* Redes Sociales */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>LINKEDIN (URL)</label>
            <div style={{ position: "relative" }}>
              <Linkedin size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
              <input name="socialLinkedIn" type="url" defaultValue={user.socialLinkedIn || ""} className="input" style={{ paddingLeft: "2.8rem" }} placeholder="https://linkedin.com/in/usuario" />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>MS TEAMS (Correo/Usuario)</label>
            <div style={{ position: "relative" }}>
              <Users size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
              <input name="socialTeams" type="text" defaultValue={user.socialTeams || ""} className="input" style={{ paddingLeft: "2.8rem" }} placeholder="usuario@dominio.com" />
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>SITIO WEB PROFESIONAL</label>
            <div style={{ position: "relative" }}>
              <Globe size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
              <input name="socialWebsite" type="url" defaultValue={user.socialWebsite || ""} className="input" style={{ paddingLeft: "2.8rem" }} placeholder="https://mipagina.com" />
            </div>
          </div>
        </div>

        {/* Cumpleaños e Imagen */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", padding: "1.5rem", backgroundColor: "hsl(var(--muted)/0.2)", borderRadius: "1rem" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>FECHA DE CUMPLEAÑOS</label>
            <input 
              name="birthday" 
              type="date" 
              defaultValue={user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : ""} 
              className="input" 
              style={{ padding: "0.875rem 1rem" }} 
            />
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
              <input type="checkbox" name="showBirthday" value="true" defaultChecked={user.showBirthday} />
              Mostrar mi cumpleaños a otros empleados
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>FOTO DE PERFIL</label>
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: "3.5rem", 
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "hsl(var(--muted)/0.3)", borderRight: "1px solid hsl(var(--border))",
                borderTopLeftRadius: "0.875rem", borderBottomLeftRadius: "0.875rem"
              }}>
                <UploadCloud size={18} color="hsl(var(--muted-foreground))" />
              </div>
              <input 
                name="image"
                type="file" 
                accept="image/*,.heic,.heif,.avif,.webp,.png,.jpg,.jpeg"
                className="input" 
                onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
                style={{ paddingLeft: "4.5rem", color: fileName ? "hsl(var(--foreground))" : "transparent" }} 
              />
            </div>
            <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
              {fileName ? fileName : "Formatos válidos: JPG, PNG, WEBP. Max 5MB."}
            </span>
          </div>

        </div>

        {/* Solo Lectura */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", opacity: 0.7 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>CORREO CORPORATIVO (Solo lectura)</label>
            <input type="email" value={user.email || ""} disabled className="input" style={{ backgroundColor: "transparent", borderStyle: "dashed" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", opacity: 0.7 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>NIVEL DE ACCESO (Solo lectura)</label>
            <input type="text" value={user.role} disabled className="input" style={{ backgroundColor: "transparent", borderStyle: "dashed" }} />
          </div>
        </div>

        {message && (
          <div className="animate-in zoom-in-sm" style={{ 
            padding: "1rem 1.25rem", borderRadius: "0.875rem", 
            backgroundColor: message.type === "success" ? "hsla(145, 60%, 45%, 0.08)" : "hsla(0, 84%, 60%, 0.08)",
            color: message.type === "success" ? "hsl(145, 60%, 35%)" : "hsl(0, 84%, 45%)",
            border: message.type === "success" ? "1px solid hsla(145, 60%, 45%, 0.2)" : "1px solid hsla(0, 84%, 60%, 0.2)",
            fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem"
          }}>
            {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
          <button type="button" onClick={() => setIsEditing(false)} className="btn btn-outline" style={{ borderRadius: "2rem", padding: "0.875rem 2rem" }}>
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading} 
            style={{ borderRadius: "2rem", padding: "0.875rem 2.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            {loading ? "Guardando..." : <><Save size={18} /> Guardar Cambios</>}
          </button>
        </div>
      </form>
    </div>
  )
}
