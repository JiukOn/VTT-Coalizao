# VTP Coalizão

**Virtual Tabletop Program** para o sistema de RPG homebrew **Coalizão**.

Mesa virtual completa — offline-first, sem cadastro, sem servidor obrigatório. Roda no navegador, suporta multi-jogador local (LAN/VPN) e online via relay WebSocket.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Instalação e uso](#instalação-e-uso)
- [Scripts disponíveis](#scripts-disponíveis)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Sistema Coalizão — Regras básicas](#sistema-coalizão--regras-básicas)
- [Deploy](#deploy)

---

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Mesa do Mestre** | Dashboard com entidades ativas, dados, log, ações rápidas e referência do sistema |
| **Fichas de Heróis** | Wizard 4 passos: Identidade, Classe & Atributos, Equipamento, Revisão |
| **Bestiário** | 82 criaturas + 15 especiais pré-cadastradas, buscáveis e editáveis |
| **NPCs** | 70+ NPCs por localização, com relação e notas privadas do Mestre |
| **Habilidades** | ~131 habilidades (Legado, Ativas, Passivas, Mito, Uso Único, Descendência) |
| **Itens** | ~127 itens com 43 tipos de modificação, raridades e stats completos |
| **Mapa Tático** | Canvas 3000×3000, multi-abas, grid configurável, névoa de guerra, tokens, paredes |
| **Combate Assistido** | Corpo a corpo / Distância / Mágico — rolls automáticos com aplicação de dano |
| **Tracker de Iniciativa** | Ordem de turno, contagem de efeitos por turno, checklist de ações, alerta de furtividade |
| **Efeitos e Condições** | Aplicar/remover efeitos com duração por turno; badges visíveis nos tokens |
| **Investigação & Furtividade** | 4 tipos de investigação + 3 modos furtivos com classificação Coalizão |
| **Descanso e Recuperação** | 1d20 → Crítico/Bom/Normal/Ruim/Desastre com HP recovery automático |
| **Visibilidade por Token** | Raio configurável, cone 120° com ângulo livre, ray casting contra paredes |
| **Sistema de Domínio** | PC = bônus INT + bônus CRM; 6 ações de comando; mecânicas de coalizão |
| **Evolução & TransEvolução** | 3 caminhos Nv5 + 3 caminhos Nv10 com efeitos mecânicos aplicados |
| **Modo Jogador** | Player View com 6 abas: Dados, Iniciativa, Ficha, Combate, Notas, Log |
| **Servidor Local** | Node.js + WebSocket para sessões LAN/VPN — sem internet necessária |
| **Relay Online** | Servidor stateless multi-sala para sessões pela internet |
| **PWA** | Funciona offline após primeiro carregamento, instalável em desktop/mobile |
| **Export/Import** | Campanha completa em JSON para backup e transferência |

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19, Vite 8 |
| Estilização | CSS puro com Design System (tokens, dark/light mode) |
| Armazenamento local | IndexedDB via Dexie.js 4 |
| Ícones | Lucide React |
| Fontes | Inter (UI) · Cinzel (títulos) · JetBrains Mono (stats) |
| Servidor local | Node.js + Express 5 + ws |
| Relay online | Node.js + Express 5 + ws (stateless, multi-sala) |
| PWA | Service Worker cache-first |

**Node.js 18+** necessário para servidor/relay. Para o frontend basta qualquer navegador moderno.

---

## Instalação e uso

### 1. Instalar dependências

```bash
npm install
```

### 2. Modo Solo (sem servidor)

Funciona completamente no navegador. Dados salvos no IndexedDB do navegador.

```bash
npm run dev
# Abre em http://localhost:5173
```

### 3. Modo Multi-jogador Local (LAN/VPN)

**Terminal 1 — Servidor WebSocket:**
```bash
npm run server:dev     # hot-reload
# ou
npm run server         # produção (usa /dist)
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

O servidor exibe o IP local e um código de sessão (ex: `GH4K9X`).

- Mestre: `http://localhost:5173`
- Jogadores (mesma rede): `http://{IP_DO_MESTRE}:3001/#/player`
- Jogadores via VPN (Hamachi/ZeroTier/Tailscale): mesmo endereço, usando o IP da VPN

### 4. Modo Multi-jogador Online (Relay)

Requer deploy do relay em um serviço cloud. Ver [`relay/README.md`](relay/README.md).

Após o deploy:
- **Mestre:** Aba Servidor → toggle "Online (Relay)" → insira URL `wss://` do relay → Conectar
- **Jogadores:** Acesse o VTP → toggle "Online" → insira URL + código fornecido pelo Mestre

---

## Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento Vite (localhost:5173) |
| `npm run build` | Build de produção em `/dist` |
| `npm run preview` | Preview local do build produção |
| `npm run server` | Servidor local (porta 3001, usa /dist) |
| `npm run server:dev` | Servidor local com hot-reload (node --watch) |
| `npm run relay` | Relay server (porta 4001 por padrão) |
| `npm run relay:dev` | Relay server com hot-reload |

---

## Estrutura do projeto

```
Projeto VTP/
├── src/
│   ├── components/           # Componentes React reutilizáveis
│   │   ├── abilities/        # AbilityCard, AbilityList
│   │   ├── campaign/         # MasterToolsPanel, CampaignManager
│   │   ├── characters/       # CharacterForm (4-step wizard), CharacterList,
│   │   │                     # CharacterSheet, AttributeDistributor, EvolutionModal
│   │   ├── combat/           # CombatResolver, CombatLog, InitiativeTracker
│   │   ├── common/           # Modal, SearchBar, FilterBar, ConfirmDialog
│   │   ├── dice/             # DiceRollerWidget, DiceHistory, DiceResultCard
│   │   ├── effects/          # EffectManager
│   │   ├── entities/         # CreatureCard, EntityForm
│   │   ├── items/            # ItemCard, ItemList
│   │   ├── layout/           # Header, Sidebar, BottomBar, DetailPanel, MainContent
│   │   └── map/              # Token, GridOverlay, MapToolbar, MapCanvas
│   ├── context/              # CampaignContext, ServerContext, ThemeContext
│   ├── data/                 # Dados pré-populados (um arquivo por entidade)
│   │   ├── abilities/        # ~131 habilidades
│   │   ├── auras/            # 10 auras
│   │   ├── classes/          # Classes com multiplicadores e habilidades legado
│   │   ├── creatures/        # 82 criaturas + 15 especiais
│   │   ├── effects/          # ~30 efeitos/condições
│   │   ├── heroes/           # 11 heróis da campanha Coalizão
│   │   ├── items/            # ~127 itens com stats e modificações
│   │   ├── modifications/    # 43 tipos de modificação de itens
│   │   ├── npcs/             # 70+ NPCs por localização
│   │   └── personalities/    # 13 personalidades
│   ├── hooks/                # useWebSocket (auto-reconnect, keepalive 25s)
│   ├── pages/                # Páginas do app (uma por aba de navegação)
│   ├── services/             # database.js (Dexie), campaignIO.js, dataSeeder.js
│   ├── styles/               # CSS Design System (4 arquivos)
│   ├── utils/                # characterUtils.js, combatUtils.js, diceRoller.js
│   ├── App.jsx               # Roteamento hash + estado global (tableEntities, etc.)
│   └── main.jsx              # Entry point — await seedDatabase() antes de montar React
├── server/
│   ├── index.js              # Servidor local (Express + WS, porta 3001)
│   └── sessionManager.js     # generateCode(), getLocalIPs()
├── relay/
│   ├── index.js              # Relay stateless multi-sala
│   ├── Procfile              # Deploy Railway/Heroku
│   ├── railway.json          # Config Railway
│   └── render.yaml           # Config Render
├── public/
│   ├── sw.js                 # Service Worker (PWA)
│   └── manifest.json         # Web App Manifest
├── Docs/
│   ├── Plan.txt              # Plano de desenvolvimento completo (v4.5)
│   ├── ARCHITECTURE.md       # Arquitetura técnica detalhada
│   ├── CHANGELOG.md          # Histórico de versões
│   └── Logs/                 # Logs de testes por fase (Fases 1–9)
├── vite.config.js            # base: '/Projeto-VTP/', code splitting, proxy /api
└── package.json              # v7.1.0, scripts, deps
```

---

## Sistema Coalizão — Regras básicas

### Dados usados

O sistema usa **apenas D20 e D4**.

**Classificação D20:**

| Resultado | Classificação | Cor |
|-----------|---------------|-----|
| 20 | Crítico | 🟢 Verde |
| 13–19 | Bom | 🟢 Verde claro |
| 10–12 | Normal | 🟡 Amarelo |
| 2–9 | Ruim | 🔴 Vermelho claro |
| 1 | Desastre | 🔴 Vermelho |

### 8 Atributos

| Código | Nome | Uso principal |
|--------|------|--------------|
| `VIT` | Vitalidade | HP, resistência a dano |
| `DEX` | Destreza | Esquiva, movimento, iniciativa |
| `CRM` | Carisma | Persuasão, furtividade social |
| `FRC` | Força | Corpo a corpo, empunhadura |
| `INT` | Inteligência | Investigação, lógica, domínio |
| `RES` | Resiliência | Defesa mágica |
| `PRE` | Precisão | Distância, formação mágica |
| `ENR` | Energia | Poder mágico |

**Bônus** = `⌊valorFinal / 5⌋`  
**Valor Final** = `pontosBase × multiplicadorDaClasse`

### Combate

| Tipo | Ataque | Defesa |
|------|--------|--------|
| Corpo a Corpo | 1d20 + bônus FRC | 1d20 + bônus FRC |
| Distância | 1d20 + bônus PRE | 1d20 + bônus DEX |
| Mágico | Formação PRE ≥ 12, depois 1d20 + ENR | 1d20 + bônus RES |

**Dano:** 1d4 (aplicado ao HP do defensor se total ataque > total defesa)  
**Esquiva:** 1d20 + bônus DEX > total do ataque (antes de aplicar dano)

### Evolução

- **Nível 5** — Evolução de Classe: Focada (×+0.2 no mult. primário) | Equilibrada (+0.05 todos) | Legado (+3 INT ou CRM)
- **Nível 10** — TransEvolução (requer soma base > 43): Ascendente | Transcendente | Descendente

### Pontos de Comando (Domínio)

`PC = bônus INT + bônus CRM`

6 ações disponíveis (ver Sistema de Domínio na aba Campanha).

---

## Deploy

### Frontend — GitHub Pages

1. Ajuste o `base` em `vite.config.js` para o nome do seu repositório:
   ```js
   base: '/nome-do-seu-repo/'
   ```
2. Build e deploy:
   ```bash
   npm run build
   # Faça deploy de /dist no branch gh-pages
   ```

### Relay Server — Railway / Render / Fly.io

Ver instruções completas em [`relay/README.md`](relay/README.md).

Resumo rápido (Railway):
```bash
cd relay
# Crie um projeto no Railway, conecte o repositório
# Defina o root directory como relay/
# A variável PORT é definida automaticamente
```

### Servidor Local — sem configuração de roteador

Use uma VPN ponto-a-ponto:
- [ZeroTier](https://www.zerotier.com/) (recomendado, gratuito)
- [Tailscale](https://tailscale.com/) (gratuito para uso pessoal)
- [Hamachi](https://www.vpn.net/) (alternativa clássica)

---

*Build v7.1.0 · Fases 1–9 completas · 2155 módulos · 0 erros*
