import { Inter } from "next/font/google";
import Navbar from "../components/navbar";
import AuthGate from "../components/AuthGate";
import { AuthProvider } from '@/context/AuthContext';
import { MessagingProvider } from "@/context/MessagingContext";
import FloatingMessageBubble from "@/components/community/FloatingMessageBubble";
import ModerationNotice from "@/components/users/ModerationNotice";
import "../styles/global.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "HackathonHQ - Build Something Amazing",
  description: "Join hackathons, form teams, and build innovative projects",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <MessagingProvider>
            <AuthGate>
              <Navbar />
              <ModerationNotice />
              <main className="main-content">
                {children}
              </main>
              <FloatingMessageBubble />
            </AuthGate>
          </MessagingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
