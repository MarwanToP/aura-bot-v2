import "./globals.css";
import { Inter, Poppins } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import CyberBackground from "../components/CyberBackground";
import MouseGlow from "../components/MouseGlow";

// The per-request CSP nonce (middleware/security.js) can only be injected into
// server-rendered HTML, so this app must render dynamically (Next.js docs:
// nonces require dynamic rendering; statically prerendered pages have no
// request to read the nonce from and their scripts would be blocked).
export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  title: "Aura Bot — Command Center",
  description: "Aurora glass command center for the Aura Discord bot. Manage servers, members, automation and moderation in one calm, glassy dashboard.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body
        className="bg-[#05070D] text-slate-100 min-h-screen antialiased font-sans"
        suppressHydrationWarning
      >
        <MouseGlow />
        <CyberBackground />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
