import { Inter } from "next/font/google";
import Navbar from "../components/navbar";
import { AuthProvider } from '@/context/AuthContext';
import "../styles/global.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "HackForge - Build Something Amazing",
  description: "Join hackathons, form teams, and build innovative projects",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
        <Navbar />
        <main className="main-content">
          {children}
        </main>
        </AuthProvider>
      </body>
    </html>
  );
}