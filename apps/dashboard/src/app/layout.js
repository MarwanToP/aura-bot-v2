import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import CyberBackground from "../components/CyberBackground";
import MouseGlow from "../components/MouseGlow";

export const metadata = {
  title: "Aura Bot — Dark Futuristic Dashboard",
  description: "Enterprise Discord Bot Management & Live Telemetry",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0b0d14] text-zinc-100 min-h-screen antialiased">
        <MouseGlow />
        <CyberBackground />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
