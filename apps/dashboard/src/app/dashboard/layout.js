// The dashboard is a signed-in tool, not marketing content: keep it out of
// search indexes and give it its own tab title.
export const metadata = {
  title: "Dashboard — Aura Bot",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }) {
  return children;
}
