import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import { Sidebar } from "./components/Layout/Sidebar";
import GlobalAssistant from "./components/AI/GlobalAssistant";
import { SocialChatBar } from "./components/Chat/SocialChatBar";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { OnlinePing } from "./components/UI/OnlinePing";
import { TopBar } from "./components/Layout/TopBar";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Intranet Social - Telecom Networks",
  description: "Red Social Corporativa Exclusiva",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <body>
        <Providers>
          {session ? (
            <div className="app-layout">
              <OnlinePing />
              <Sidebar />
              <main className="animate-in" style={{ flex: 1, height: "100vh", overflowY: "auto", display: 'flex', flexDirection: 'column' }}>
                <TopBar />
                <div className="container" style={{ width: "94%", maxWidth: "1720px", padding: "2rem 1.5rem", margin: "0 auto", flex: 1 }}>
                  {children}
                </div>
              </main>
              <SocialChatBar />
              <GlobalAssistant />
            </div>
          ) : (
            <>
              <main>{children}</main>
            </>
          )}
        </Providers>
      </body>
    </html>
  );
}
