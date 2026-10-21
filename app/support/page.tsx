"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupportChat } from '@/app/components/SupportAILlama/SupportContext';

export default function SupportPage() {
  const router = useRouter();
  const { openSupportChat } = useSupportChat();

  useEffect(() => {
    openSupportChat('chat');
    router.replace('/');
  }, [openSupportChat, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
      <span>Cargando IT Support Chat...</span>
    </div>
  );
}
