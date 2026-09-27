import { notFound } from "next/navigation";
import { TournamentOps } from "@/components/tournament-ops";
import { buildDemoTournament } from "@/lib/tournament/demo-data";

export default async function OperationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const tournament = buildDemoTournament();
  const { slug } = await params;

  if (slug !== tournament.slug) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <div className="mb-8 rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent-secondary)]">Organizer / Scorekeeper mode</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{tournament.name}</h1>
        <p className="mt-3 text-[var(--foreground-muted)]">Fluxo focado em operações presenciais: registrar resultado, acompanhar pairings, check-in e standings sem refresh manual.</p>
      </div>
      <TournamentOps initialTournament={tournament} />
    </main>
  );
}
