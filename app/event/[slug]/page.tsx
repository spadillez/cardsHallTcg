import { notFound } from "next/navigation";
import { buildDemoTournament } from "@/lib/tournament/demo-data";
import { buildStandings } from "@/lib/tournament/standings";

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const tournament = buildDemoTournament();
  const { slug } = await params;

  if (slug !== tournament.slug) {
    notFound();
  }

  const currentRound = tournament.rounds[tournament.rounds.length - 1];
  const standings = buildStandings(tournament);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent-secondary)]">Página pública do evento</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{tournament.name}</h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--foreground-muted)]">
          <span>{tournament.location}</span>
          <span>•</span>
          <span>Round {currentRound.number}</span>
          <span>•</span>
          <span>Timer 26:31</span>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Pairings</p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)]">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--surface-strong)] text-left text-[var(--foreground-muted)]">
                <tr>
                  <th className="px-4 py-3">Mesa</th>
                  <th className="px-4 py-3">Jogador A</th>
                  <th className="px-4 py-3">Jogador B</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {currentRound.matches.map((match) => {
                  const playerA = tournament.players.find((entry) => entry.player.id === match.playerAId)?.player.fullName ?? "BYE";
                  const playerB = tournament.players.find((entry) => entry.player.id === match.playerBId)?.player.fullName ?? "BYE";
                  return (
                    <tr key={match.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-3 font-semibold">{match.tableNumber}</td>
                      <td className="px-4 py-3">{playerA}</td>
                      <td className="px-4 py-3">{playerB}</td>
                      <td className="px-4 py-3 text-[var(--foreground-muted)]">{match.resultCode === "PENDING" ? "Pendente" : "Resultado registrado"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Standings</p>
          <div className="mt-4 space-y-3">
            {standings.slice(0, 16).map((standing, index) => (
              <div key={standing.playerId} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                {index === 8 ? (
                  <div className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-secondary)]">
                    ━━━━━━━━ Top 8 Cut ━━━━━━━━
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-[var(--foreground-muted)]">#{standing.rank}</div>
                    <div className="font-semibold">{standing.fullName}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{standing.record}</div>
                    <div className="text-[var(--foreground-muted)]">{standing.matchPoints} pts · OMW {standing.omw}% · GW {standing.gw}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
