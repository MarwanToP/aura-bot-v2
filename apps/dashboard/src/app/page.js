import LandingPage from "../components/LandingPage";

// Public landing page. The dashboard lives at /dashboard and is a separate
// experience; nothing on this route renders dashboard UI.
export const metadata = {
  title: "Aura Bot — Moderation, tickets and community tools for Discord",
  description:
    "Aura Bot is a Discord bot for moderation, security, tickets, leveling and welcome flows, managed from a web dashboard.",
  openGraph: {
    title: "Aura Bot — Moderation, tickets and community tools for Discord",
    description:
      "Moderation, security, tickets, leveling and welcome flows for your Discord server, managed from a web dashboard.",
    type: "website",
  },
};

export default function Home() {
  return <LandingPage />;
}
