"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Bell, Search, Check, CheckCircle2 } from 'lucide-react'
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '@/app/actions/notificationActions'
import Link from 'next/link'
import { LanguageSwitcher } from '@/app/components/UI/LanguageSwitcher'
import { useTranslation } from '@/lib/i18n/LanguageContext'

export function TopBar() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState<any[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [loading, setLoading] = useState(true)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 20000) // Poll every 20s
    const onNotifUpdate = () => fetchNotifications()
    window.addEventListener('notification-updated', onNotifUpdate)
    return () => {
      clearInterval(interval)
      window.removeEventListener('notification-updated', onNotifUpdate)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowPanel(false)
      }
    }

    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPanel])

  const fetchNotifications = async () => {
    const data = await getNotifications()
    setNotifications(data || [])
    setLoading(false)
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead()
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
  }

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id)
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 1.5rem',
      backgroundColor: 'hsl(var(--surface) / 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid hsl(var(--border))',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      {/* Search Bar */}
      <div style={{ flex: 1, maxWidth: '400px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
          <input 
            type="text" 
            placeholder={t("topbar.searchPlaceholder")} 
            className="input"
            style={{ paddingLeft: '2.5rem', borderRadius: '999px', backgroundColor: 'hsl(var(--background))' }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', position: 'relative' }}>
        {/* Selector de Idioma (i18n) */}
        <LanguageSwitcher />

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-assistant'))}
          className="btn btn-surface hover-scale"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '999px',
            border: '1px solid hsl(var(--primary)/0.2)',
            color: 'hsl(var(--primary))', fontWeight: 600,
            fontSize: '0.85rem', cursor: 'pointer',
            backgroundColor: 'hsl(var(--primary) / 0.05)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            height: '38px' // Similar to input height
          }}
          title={t("topbar.assistantTitle")}
        >
          <span style={{ fontSize: '1rem' }}>✨</span>
          <span>{t("topbar.assistant")}</span>
        </button>
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => {
              if (!showPanel) fetchNotifications()
              setShowPanel(!showPanel)
            }}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              position: 'relative', width: '40px', height: '40px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: showPanel ? 'hsl(var(--surface-hover))' : 'transparent',
              transition: 'background-color 0.2s'
            }}
          >
            <Bell size={20} color="hsl(var(--foreground))" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '8px', right: '8px',
                backgroundColor: 'hsl(var(--destructive))', color: 'white',
                fontSize: '0.65rem', fontWeight: 'bold', width: '16px', height: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', border: '2px solid hsl(var(--surface))'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Panel Dropdown */}
          {showPanel && (
            <div className="card animate-in" style={{
              position: 'absolute', top: '110%', right: '0', width: '380px',
              padding: '0', display: 'flex', flexDirection: 'column',
              maxHeight: '450px', zIndex: 50, overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid hsl(var(--border))' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{t("topbar.notifications")}</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                    <CheckCircle2 size={14} /> {t("topbar.markAllRead")}
                  </button>
                )}
              </div>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {loading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>{t("common.loading")}</div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>{t("topbar.emptyNotifications")}</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => !n.isRead && handleMarkRead(n.id)}
                      style={{ 
                        padding: '1rem', borderBottom: '1px solid hsl(var(--border))',
                        backgroundColor: n.isRead ? 'transparent' : 'hsl(var(--primary) / 0.05)',
                        cursor: n.isRead ? 'default' : 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', fontWeight: n.isRead ? 500 : 700 }}>
                          {n.title}
                        </h4>
                        <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }} suppressHydrationWarning>
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                        {n.message}
                      </p>
                      {n.link && (
                        <Link 
                          href={n.link} 
                          onClick={() => {
                            if (!n.isRead) handleMarkRead(n.id)
                            setShowPanel(false)
                          }}
                          style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          {t("topbar.viewDetails")}
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
