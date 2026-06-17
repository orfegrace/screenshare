import { Nav } from "./Nav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <Nav />
      <main className="pt-14 min-h-screen">
        {children}
      </main>
    </div>
  );
}
