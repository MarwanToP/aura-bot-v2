import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  title: "Aura Bot — Cyber-Minimal Glassmorphic Dashboard",
  description: "Ultra-premium Discord Bot Management & Live Telemetry",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
