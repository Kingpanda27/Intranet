import React from 'react'

export type UserStatus = {
  status: string
  label: string
  color: string
  returnDate: Date | null
  type: string
}

type UserStatusBadgeProps = {
  status: UserStatus
  showText?: boolean
  className?: string
  style?: React.CSSProperties
}

export function UserStatusBadge({ status, showText = true, className = "", style = {} }: UserStatusBadgeProps) {
  const isAvailable = status.status === "AVAILABLE"
  
  let tooltipText = status.label
  if (!isAvailable && status.returnDate) {
    const returnDateStr = new Date(status.returnDate).toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })
    tooltipText += ` (Regreso: ${returnDateStr})`
  }

  return (
    <div 
      className={`user-status-badge ${className}`}
      title={tooltipText}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        backgroundColor: "hsl(var(--surface))",
        border: `1px solid ${status.color}33`,
        padding: showText ? "0.2rem 0.5rem" : "0.2rem",
        borderRadius: "9999px",
        cursor: "default",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        ...style
      }}
    >
      <span 
        style={{
          display: "inline-block",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: status.color,
          boxShadow: `0 0 0 2px ${status.color}33`
        }}
      />
      {showText && (
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "hsl(var(--foreground))", whiteSpace: "nowrap" }}>
          {isAvailable ? "Disponible" : status.label}
        </span>
      )}
    </div>
  )
}
