"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  text: string;
}

export interface SupportProfile {
  name: string;
  email: string;
  project: string;
  location: 'onsite' | 'wfh' | '';
  box: string;
}

interface SupportContextType {
  isSupportOpen: boolean;
  openSupportChat: (view?: 'chat' | 'admin') => void;
  closeSupportChat: () => void;
  toggleSupportChat: () => void;
  activeView: 'chat' | 'admin';
  setActiveView: (view: 'chat' | 'admin') => void;
  canAccessAdmin: boolean;
  
  // Profile
  profile: SupportProfile;
  setProfileLocation: (loc: 'onsite' | 'wfh') => void;
  setProfileBox: (box: string) => void;
  isProfileConfirmed: boolean;
  confirmProfile: () => void;

  // Categories & Chat State
  selectedCategory: string | null;
  selectedCategoryName: string | null;
  selectCategory: (categoryKey: string, categoryLabel: string) => void;
  attempt: number;
  setAttempt: React.Dispatch<React.SetStateAction<number>>;
  step: 'AWAITING_INITIAL_ISSUE' | 'EVALUATING_SOLUTIONS' | 'COLLECT_DATA' | 'SUBMITTING' | 'IDLE';
  setStep: React.Dispatch<React.SetStateAction<'AWAITING_INITIAL_ISSUE' | 'EVALUATING_SOLUTIONS' | 'COLLECT_DATA' | 'SUBMITTING' | 'IDLE'>>;
  messages: ChatMessage[];
  addMessage: (type: 'user' | 'agent' | 'system', text: string) => void;
  userIssueText: string;
  setUserIssueText: (issue: string) => void;

  // Language
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;

  // Reset
  resetSession: () => void;
}

const STORAGE_KEY = 'support_aillama_persistent_session_v1';

const ALLOWED_ADMIN_EMAILS = [
  "rurena@tnoutsourcing.com",
  "ireyes@tnoutsourcing.com"
];

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export function SupportProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user as any;

  // View state
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'admin'>('chat');

  // Permission calculation based on Intranet user role + email whitelist
  const userRole = (user?.role || '').toUpperCase();
  const userEmail = (user?.email || '').toLowerCase().trim();
  const canAccessAdmin = 
    userRole === 'TECHNOLOGY' ||
    userRole === 'IT_MANAGER' ||
    userRole === 'TECHNOLOGY_ADMIN' ||
    userRole === 'ADMIN' ||
    userRole === 'SUPERVISOR' ||
    userRole === 'MANAGER' ||
    ALLOWED_ADMIN_EMAILS.includes(userEmail) ||
    userEmail.startsWith('ireyes@') ||
    userEmail.startsWith('rurena@');

  // Profile
  const [profile, setProfile] = useState<SupportProfile>({
    name: user?.name || '',
    email: user?.email || '',
    project: user?.projectName || 'Telecom Networks',
    location: '',
    box: '',
  });
  const [isProfileConfirmed, setIsProfileConfirmed] = useState(false);

  // Language state (default: 'es')
  const [language, setLanguageState] = useState<'es' | 'en'>('es');

  // Chat
  const [selectedCategory, setSelectedCategoryState] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryNameState] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<number>(1);
  const [step, setStep] = useState<'AWAITING_INITIAL_ISSUE' | 'EVALUATING_SOLUTIONS' | 'COLLECT_DATA' | 'SUBMITTING' | 'IDLE'>('AWAITING_INITIAL_ISSUE');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userIssueText, setUserIssueText] = useState<string>('');

  // Auto-fill profile whenever session updates
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        project: user.projectName || prev.project || 'Telecom Networks'
      }));
    }
  }, [user]);

  // Rehydrate state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profile) setProfile(prev => ({ ...prev, ...parsed.profile }));
        if (parsed.isProfileConfirmed) setIsProfileConfirmed(Boolean(parsed.isProfileConfirmed));
        if (parsed.selectedCategory) setSelectedCategoryState(parsed.selectedCategory);
        if (parsed.selectedCategoryName) setSelectedCategoryNameState(parsed.selectedCategoryName);
        if (parsed.attempt) setAttempt(Number(parsed.attempt));
        if (parsed.step) setStep(parsed.step);
        if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
        if (parsed.userIssueText) setUserIssueText(parsed.userIssueText);
        if (parsed.language === 'es' || parsed.language === 'en') setLanguageState(parsed.language);
      }
    } catch (e) {
      console.error("[SupportContext] Error restoring session from localStorage:", e);
    }
  }, []);

  // Save to localStorage in real time
  useEffect(() => {
    try {
      const dataToSave = {
        profile,
        isProfileConfirmed,
        selectedCategory,
        selectedCategoryName,
        attempt,
        step,
        messages,
        userIssueText,
        language
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error("[SupportContext] Error persisting to localStorage:", e);
    }
  }, [profile, isProfileConfirmed, selectedCategory, selectedCategoryName, attempt, step, messages, userIssueText, language]);

  const openSupportChat = (view: 'chat' | 'admin' = 'chat') => {
    if (view === 'admin' && !canAccessAdmin) {
      setActiveView('chat');
    } else {
      setActiveView(view);
    }
    setIsSupportOpen(true);
  };

  const closeSupportChat = () => {
    setIsSupportOpen(false);
  };

  const toggleSupportChat = () => {
    setIsSupportOpen(prev => !prev);
  };

  const setProfileLocation = (loc: 'onsite' | 'wfh') => {
    setProfile(prev => ({
      ...prev,
      location: loc,
      box: loc === 'wfh' ? 'WFH' : (prev.box === 'WFH' ? '' : prev.box)
    }));
  };

  const setProfileBox = (box: string) => {
    setProfile(prev => ({
      ...prev,
      box: box
    }));
  };

  const confirmProfile = () => {
    if (!profile.location) return;
    if (profile.location === 'onsite' && !profile.box.trim()) return;
    setIsProfileConfirmed(true);
  };

  const selectCategory = (categoryKey: string, categoryLabel: string) => {
    setSelectedCategoryState(categoryKey);
    setSelectedCategoryNameState(categoryLabel);

    // Initial greeting if no messages yet
    if (messages.length === 0) {
      const greeting = language === 'es'
        ? `¡Hola! Soy **AILlama**, tu asistente de TI. Has seleccionado **${categoryLabel}**. ¿Podrías describir detalladamente el problema que estás presentando?`
        : `Hi! I'm **AILlama**, your IT Support Assistant. You selected **${categoryLabel}**. Could you please describe the specific issue you are experiencing?`;

      const introMsg: ChatMessage = {
        id: 'intro-' + Date.now(),
        type: 'agent',
        text: greeting
      };
      setMessages([introMsg]);
      setStep('AWAITING_INITIAL_ISSUE');
      setAttempt(1);
    }
  };

  const setLanguage = (lang: 'es' | 'en') => {
    setLanguageState(lang);
    // If only the initial greeting exists in the chat, translate it smoothly
    if (messages.length === 1 && messages[0].type === 'agent') {
      const currentCat = selectedCategoryName || (lang === 'es' ? 'Soporte IT' : 'IT Support');
      const updatedGreeting = lang === 'es'
        ? `¡Hola! Soy **AILlama**, tu asistente de TI. Has seleccionado **${currentCat}**. ¿Podrías describir detalladamente el problema que estás presentando?`
        : `Hi! I'm **AILlama**, your IT Support Assistant. You selected **${currentCat}**. Could you please describe the specific issue you are experiencing?`;
      setMessages([{ ...messages[0], text: updatedGreeting }]);
    }
  };

  const addMessage = (type: 'user' | 'agent' | 'system', text: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
      type,
      text
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const resetSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSelectedCategoryState(null);
    setSelectedCategoryNameState(null);
    setAttempt(1);
    setStep('AWAITING_INITIAL_ISSUE');
    setMessages([]);
    setUserIssueText('');
    setIsProfileConfirmed(false);
    setProfile(prev => ({
      ...prev,
      location: '',
      box: ''
    }));
  };

  return (
    <SupportContext.Provider
      value={{
        isSupportOpen,
        openSupportChat,
        closeSupportChat,
        toggleSupportChat,
        activeView,
        setActiveView,
        canAccessAdmin,
        profile,
        setProfileLocation,
        setProfileBox,
        isProfileConfirmed,
        confirmProfile,
        selectedCategory,
        selectedCategoryName,
        selectCategory,
        attempt,
        setAttempt,
        step,
        setStep,
        messages,
        addMessage,
        userIssueText,
        setUserIssueText,
        language,
        setLanguage,
        resetSession
      }}
    >
      {children}
    </SupportContext.Provider>
  );
}

export function useSupportChat() {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error('useSupportChat must be used within a SupportProvider');
  }
  return context;
}
