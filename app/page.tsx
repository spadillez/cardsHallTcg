import Link from "next/link";
import { getDashboardData } from "@/lib/tournament/demo-data";

export default function HomePage() {
  const dashboard = getDashboardData();

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <section className="flex flex-col gap-4 rounded-[32px] border border-[var(--border)] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_35%),var(--surface)] p-8">
        <p className="text-sm uppercase tracking-[0.32em] text-[var(--accent-secondary)]">CardsHall Tournament Manager</p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Operação rápida para torneios competitivos de TCG com Swiss, standings e fluxo de mesa em tempo real.
        </h1>
        <p className="max-w-3xl text-lg text-[var(--foreground-muted)]">
          Projeto MVP focado no fluxo crítico do torneio: pairings → resultados → standings → próxima rodada, com regras configuráveis e identidade visual própria.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/ops/cardshall-league-challenge" className="rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:bg-[#2563eb]">
            Abrir modo Organizer
          </Link>
          <Link href="/event/cardshall-league-challenge" className="rounded-full border border-[var(--border)] px-5 py-3 font-semibold text-white transition hover:border-[var(--accent)]">
            Abrir página pública
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Eventos acontecendo</p>
                <h2 className="mt-2 text-2xl font-semibold">Painel principal</h2>
              </div>
              <span className="rounded-full bg-[rgba(34,197,94,0.15)] px-4 py-2 text-sm font-semibold text-[var(--success)]">
                {dashboard.activeSummary.status}
              </span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                ["Evento", dashboard.activeSummary.name],
                ["Local", dashboard.activeSummary.location],
                ["Formato", dashboard.activeSummary.format],
                ["Jogadores", dashboard.activeSummary.players],
                ["Rodada", dashboard.activeSummary.roundLabel],
                ["Tempo restante", dashboard.activeSummary.remainingTime],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--foreground-muted)]">{label}</p>
                  <p className="mt-2 text-lg font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground-muted)]">
              {dashboard.activeSummary.pendingResults} partidas pendentes na rodada atual.
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Próximos eventos</p>
            <div className="mt-4 space-y-4">
              {dashboard.upcomingEvents.map((event) => (
                <div key={event.name} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-sm text-[var(--foreground-muted)]">{event.location}</p>
                    </div>
                    <div className="text-sm text-[var(--foreground-muted)]">
                      {event.date} · {event.time} · {event.players} inscritos
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Eventos finalizados</p>
            <div className="mt-4 space-y-4">
              {dashboard.finishedEvents.map((event) => (
                <div key={event.name} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                  <h3 className="font-semibold">{event.name}</h3>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">Campeão: {event.champion}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">{event.players} jogadores · {event.format}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">{event.date}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Comando rápido</p>
            <ul className="mt-4 space-y-3 text-sm text-[var(--foreground-muted)]">
              <li>Ctrl + K → Search Player / Search Table</li>
              <li>N → próximo resultado pendente</li>
              <li>Enter → salvar resultado selecionado</li>
              <li>Modo público em <code>/event/cardshall-league-challenge</code></li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
