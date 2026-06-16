import { Nav } from "./Nav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <Nav />
      <main className="md:ml-52 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
