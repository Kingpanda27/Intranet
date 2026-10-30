"use client"

import React from 'react'
import { useTranslation } from "@/lib/i18n/LanguageContext"

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
  const { t, locale } = useTranslation()
  const isAvailable = status.status === "AVAILABLE"
  
  const getStatusLabel = () => {
    switch (status.status) {
      case "AVAILABLE": return t("userStatus.available")
      case "OFFLINE": return t("userStatus.offline")
      case "VACATION": return t("userStatus.vacation")
      case "SICK_LEAVE": return t("userStatus.sickLeave")
      case "MEDICAL_LEAVE": return t("userStatus.medicalLeave")
      case "MATERNITY_LEAVE": return t("userStatus.maternityLeave")
      case "PATERNITY_LEAVE": return t("userStatus.paternityLeave")
      case "BEREAVEMENT_LEAVE": return t("userStatus.bereavementLeave")
      case "SPECIAL_PERMISSION": return t("userStatus.specialPermission")
      default: return status.label || t("userStatus.offline")
    }
  }

  const translatedLabel = getStatusLabel()

  let tooltipText = translatedLabel
  if (!isAvailable && status.returnDate) {
    const localeCode = locale === "en" ? "en-US" : "es-ES"
    const returnDateStr = new Date(status.returnDate).toLocaleDateString(localeCode, { day: 'numeric', month: 'short' })
    tooltipText += ` (${t("userStatus.returns")}: ${returnDateStr})`
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
          {translatedLabel}
        </span>
      )}
    </div>
  )
}
