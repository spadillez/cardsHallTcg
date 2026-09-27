# CardsHall Tournament Manager

Aplicação web em Next.js + TypeScript para operação de torneios competitivos de TCG com foco no fluxo de torneio presencial.

## MVP entregue

- dashboard com eventos ativos, futuros e finalizados;
- modo Organizer/Scorekeeper com pairings, rapid result entry, standings e balcão de check-in/late registration;
- página pública do evento em `/event/cardshall-league-challenge`;
- regras configuráveis em `lib/tournament/rules.ts`;
- utilitários de pairings, standings e máquina de estados em `lib/tournament`;
- schema Prisma com organizações, torneios, rounds, matches, penalties, judge calls, snapshots e audit log;
- seed demo para `CardsHall League Challenge` com 32 jogadores fictícios.

## Rodando localmente

```bash
npm install
npm run dev
```

### Testes

```bash
npm run test
```

### Prisma

Configure `DATABASE_URL` para PostgreSQL e rode:

```bash
npm run prisma:generate
npm run seed
```

## Arquitetura

- `app/`: rotas do dashboard, modo de operação e página pública.
- `components/`: UI interativa do modo Organizer/Scorekeeper.
- `lib/tournament/`: domínio configurável de torneio (regras, pairings, standings, state machine, demo data).
- `prisma/schema.prisma`: modelo de dados SaaS/multi-tenant.
- `tests/`: testes direcionados para pairings, standings e state machine.

## Observações

- o projeto possui identidade visual própria e não usa assets oficiais da Pokémon;
- regras competitivas sensíveis ficam configuráveis em `TournamentRuleset`;
- os jogadores seedados são fictícios.
