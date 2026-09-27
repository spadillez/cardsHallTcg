"use client";

import { useMemo, useState } from "react";
import { buildStandings } from "@/lib/tournament/standings";
import { getTournamentStructure } from "@/lib/tournament/rules";
import type { MatchResultCode, Tournament, TournamentPlayer } from "@/lib/tournament/types";

const ACTION_RESULTS: Array<{ code: MatchResultCode; label: string }> = [
  { code: "A_WIN_2_0", label: "2 - 0" },
  { code: "A_WIN_2_1", label: "2 - 1" },
  { code: "B_WIN_2_1", label: "1 - 2" },
  { code: "B_WIN_2_0", label: "0 - 2" },
  { code: "DRAW", label: "Draw" },
  { code: "DOUBLE_LOSS", label: "Double Loss" },
];

function formatName(tournament: Tournament, playerId?: string) {
  return tournament.players.find((entry) => entry.player.id === playerId)?.player.fullName ?? "BYE";
}

function statCard(label: string, value: string | number, tone: string = "text-white") {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

export function TournamentOps({ initialTournament }: { initialTournament: Tournament }) {
  const [tournament, setTournament] = useState(initialTournament);
  const [playerSearch, setPlayerSearch] = useState("");
  const [registrationForm, setRegistrationForm] = useState({ name: "", playerId: "", birthDate: "" });

  const currentRound = tournament.rounds[tournament.rounds.length - 1];
  const standings = useMemo(() => buildStandings(tournament), [tournament]);
  const structure = getTournamentStructure(tournament.ruleset, tournament.players.length);
  const pendingMatches = currentRound?.matches.filter((match) => match.resultCode === "PENDING") ?? [];
  const currentPendingMatch = pendingMatches[0];
  const checkedInCount = tournament.players.filter((entry) => entry.status === "CHECKED_IN").length;

  const filteredPlayers = useMemo(() => {
    const needle = playerSearch.toLowerCase();
    return tournament.players.filter((entry) => {
      if (!needle) return true;
      return (
        entry.player.fullName.toLowerCase().includes(needle) || entry.player.playerId.toLowerCase().includes(needle)
      );
    });
  }, [playerSearch, tournament.players]);

  function updateMatch(matchId: string, resultCode: MatchResultCode) {
    setTournament((current) => ({
      ...current,
      rounds: current.rounds.map((round) =>
        round.id !== current.rounds[current.rounds.length - 1]?.id
          ? round
          : {
              ...round,
              matches: round.matches.map((match) =>
                match.id === matchId ? { ...match, resultCode, updatedAt: new Date().toISOString() } : match,
              ),
            },
      ),
    }));
  }

  function toggleDrop(player: TournamentPlayer) {
    setTournament((current) => ({
      ...current,
      players: current.players.map((entry) =>
        entry.id !== player.id
          ? entry
          : {
              ...entry,
              status: entry.status === "DROPPED" ? "CHECKED_IN" : "DROPPED",
              droppedAt: entry.status === "DROPPED" ? undefined : new Date().toISOString(),
            },
      ),
    }));
  }

  function addPlayer() {
    if (!registrationForm.name || !registrationForm.playerId || !registrationForm.birthDate) {
      return;
    }

    let playerAdded = false;
    setTournament((current) => ({
      ...(() => {
        if (current.players.some((entry) => entry.player.playerId === registrationForm.playerId)) {
          return current;
        }

        playerAdded = true;
        const nextId =
          current.players.reduce((highest, entry) => {
            const suffix = Number(entry.id.replace("tp-", ""));
            return Number.isFinite(suffix) ? Math.max(highest, suffix) : highest;
          }, 0) + 1;
        return {
          ...current,
          players: [
            ...current.players,
            {
              id: `tp-${nextId}`,
              player: {
                id: `player-${nextId}`,
                fullName: registrationForm.name,
                playerId: registrationForm.playerId,
                birthDate: registrationForm.birthDate,
                category: "MASTER",
                country: "Brasil",
                state: "SP",
                city: "São Paulo",
              },
              status: "CHECKED_IN",
              checkedInAt: new Date().toISOString(),
              hadBye: false,
              initialMatchPoints: 0,
            },
          ],
        };
      })(),
    }));
    if (playerAdded) {
      setRegistrationForm({ name: "", playerId: "", birthDate: "" });
    }
  }

  if (!currentRound) {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Organizer / Scorekeeper mode</p>
        <h2 className="mt-2 text-2xl font-semibold">Torneio sem rodadas geradas</h2>
        <p className="mt-3 text-[var(--foreground-muted)]">
          Cadastre jogadores, confirme o check-in e gere a primeira rodada para iniciar a operação.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-5">
        {statCard("Evento", tournament.name)}
        {statCard("Rodada", `${currentRound.number} / ${structure.swissRounds}`)}
        {statCard("Jogadores", tournament.players.length)}
        {statCard("Resultados", `${currentRound.matches.length - pendingMatches.length} / ${currentRound.matches.length}`)}
        {statCard("Pendentes", pendingMatches.length, pendingMatches.length ? "text-[var(--accent-secondary)]" : "text-[var(--success)]")}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Rapid Result Entry</p>
                <h2 className="mt-2 text-2xl font-semibold">Registrar resultado em poucos cliques</h2>
              </div>
              <div className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground-muted)]">
                Timer da rodada: 26:31
              </div>
            </div>

            {currentPendingMatch ? (
              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
                <p className="text-sm text-[var(--foreground-muted)]">Mesa {currentPendingMatch.tableNumber}</p>
                <div className="mt-3 text-xl font-semibold">
                  {formatName(tournament, currentPendingMatch.playerAId)} <span className="text-[var(--foreground-muted)]">vs</span>{" "}
                  {formatName(tournament, currentPendingMatch.playerBId)}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {ACTION_RESULTS.map((result) => (
                    <button
                      key={result.code}
                      type="button"
                      onClick={() => updateMatch(currentPendingMatch.id, result.code)}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-left text-lg font-semibold transition hover:border-[var(--accent)] hover:bg-[#14213d]"
                    >
                      {result.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5 text-[var(--success)]">
                ✔ Todos os resultados da rodada atual foram registrados.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Pairings</p>
                <h2 className="mt-2 text-2xl font-semibold">Round {currentRound.number} pairings</h2>
              </div>
              <div className="text-sm text-[var(--foreground-muted)]">Mesas reservadas: 1 Streaming · 2 Feature · 40 Judge</div>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)]">
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
                  {currentRound.matches.map((match) => (
                    <tr key={match.id} className="border-t border-[var(--border)] bg-[var(--surface)]">
                      <td className="px-4 py-3 font-semibold">{match.tableNumber}</td>
                      <td className="px-4 py-3">{formatName(tournament, match.playerAId)}</td>
                      <td className="px-4 py-3">{formatName(tournament, match.playerBId)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            match.resultCode === "PENDING"
                              ? "bg-[rgba(250,204,21,0.15)] text-[var(--accent-secondary)]"
                              : "bg-[rgba(34,197,94,0.15)] text-[var(--success)]"
                          }`}
                        >
                          {match.resultCode === "PENDING" ? "Pendente" : "Registrado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Check-in & Late Registration</p>
            <h2 className="mt-2 text-2xl font-semibold">Balcão rápido</h2>
            <p className="mt-3 text-sm text-[var(--foreground-muted)]">{checkedInCount} / {tournament.players.length} jogadores confirmados.</p>
            <label htmlFor="player-search" className="mt-4 block text-sm font-medium text-[var(--foreground-muted)]">
              Buscar jogador
            </label>
            <input
              id="player-search"
              aria-label="Buscar jogador por nome ou Player ID"
              value={playerSearch}
              onChange={(event) => setPlayerSearch(event.target.value)}
              placeholder="Buscar nome ou Player ID"
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
            />
            <div className="mt-4 max-h-64 space-y-3 overflow-auto pr-1">
              {filteredPlayers.slice(0, 12).map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{entry.player.fullName}</div>
                      <div className="text-sm text-[var(--foreground-muted)]">Player ID: {entry.player.playerId}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleDrop(entry)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        entry.status === "DROPPED"
                          ? "bg-[rgba(34,197,94,0.15)] text-[var(--success)]"
                          : "bg-[rgba(239,68,68,0.15)] text-[var(--danger)]"
                      }`}
                    >
                      {entry.status === "DROPPED" ? "Reativar" : "Drop imediato"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3">
              <label htmlFor="new-player-name" className="text-sm font-medium text-[var(--foreground-muted)]">
                Nome
              </label>
              <input
                id="new-player-name"
                aria-label="Nome do novo jogador"
                value={registrationForm.name}
                onChange={(event) => setRegistrationForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Novo jogador"
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
              />
              <label htmlFor="new-player-id" className="text-sm font-medium text-[var(--foreground-muted)]">
                Player ID
              </label>
              <input
                id="new-player-id"
                aria-label="Player ID do novo jogador"
                value={registrationForm.playerId}
                onChange={(event) => setRegistrationForm((current) => ({ ...current, playerId: event.target.value }))}
                placeholder="Player ID"
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
              />
              <label htmlFor="new-player-birth-date" className="text-sm font-medium text-[var(--foreground-muted)]">
                Data de nascimento
              </label>
              <input
                id="new-player-birth-date"
                aria-label="Data de nascimento do novo jogador"
                type="date"
                value={registrationForm.birthDate}
                onChange={(event) => setRegistrationForm((current) => ({ ...current, birthDate: event.target.value }))}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
              />
              <button
                type="button"
                onClick={addPlayer}
                className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white transition hover:bg-[#2563eb]"
              >
                Salvar + check-in
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Standings</p>
            <h2 className="mt-2 text-2xl font-semibold">Classificação em tempo real</h2>
            <div className="mt-4 space-y-3">
              {standings.slice(0, 8).map((standing) => (
                <div key={standing.playerId} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-[var(--foreground-muted)]">#{standing.rank}</div>
                      <div className="font-semibold">{standing.fullName}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold">{standing.record}</div>
                      <div className="text-[var(--foreground-muted)]">{standing.matchPoints} pts · OMW {standing.omw}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
