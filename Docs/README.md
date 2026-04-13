# VTP Coalizão — Documentação Teórica do Projeto

## O que é o VTP Coalizão?

**VTP** (Virtual Table Program) é uma mesa de RPG digital, completamente local e offline, desenvolvida especificamente para o sistema homebrew **Coalizão**. O objetivo central é oferecer aos Mestres e jogadores uma ferramenta digital integrada que substitua fichas de papel, cadernos de campanha, mapas físicos e tabelas manuais, reunindo tudo em um único ambiente visual e interativo no navegador.

---

## Motivação e Propósito

Sistemas de RPG homebrew sofrem de um problema fundamental: as ferramentas existentes (Roll20, Foundry VTT, Fantasy Grounds) são genéricas e projetadas para sistemas conhecidos como D&D ou Pathfinder. Adaptar essas plataformas ao Coalizão exigiria horas de configuração manual a cada campanha, duplicação de dados e workarounds constantes.

O VTP Coalizão resolve isso ao ser construído **de dentro para fora do sistema**:

- Todas as 40+ classes do Coalizão já estão modeladas.
- Os 8 atributos exclusivos (VIT, DEX, CRM, FRC, INT, RES, PRE, ENR) são o núcleo da ficha de personagem.
- A mecânica de dados é exatamente a do sistema: **apenas D20 e D4**, com classificação automática (Crítico, Bom, Normal, Ruim, Desastre).
- Criaturas, habilidades e itens do universo Coalizão já vêm pré-cadastrados, prontos para uso.

A ferramenta não é genérica. Ela é uma extensão digital do próprio jogo.

---

## Arquitetura Conceitual

### Offline-First

O VTP Coalizão não possui backend, servidor ou banco de dados externo. Toda a persistência de dados ocorre diretamente no navegador do usuário via **IndexedDB** (usando a biblioteca Dexie.js), com preferências de interface salvas via localStorage.

Isso traz consequências importantes:

- **Privacidade total**: nenhum dado de campanha sai da máquina do usuário.
- **Zero dependência de infraestrutura**: funciona sem internet após o primeiro carregamento.
- **Distribuição simples**: basta acessar uma URL (GitHub Pages) — sem instalação, login ou conta.

A contrapartida é que dados ficam presos ao navegador local. Por isso, o sistema prevê exportação e importação de campanhas em JSON, permitindo backup e compartilhamento manual entre usuários.

### Camadas da Aplicação

```
┌─────────────────────────────────────────────┐
│              Interface (React)              │
│   Páginas, Componentes, Formulários, UI     │
├─────────────────────────────────────────────┤
│           Estado Global (Context API)       │
│   CampaignContext · ThemeContext            │
├─────────────────────────────────────────────┤
│              Serviços                       │
│   database.js · campaignIO.js · dataSeeder  │
├─────────────────────────────────────────────┤
│           Persistência (Dexie/IndexedDB)    │
│   11 tabelas · Consultas indexadas          │
└─────────────────────────────────────────────┘
```

A UI nunca acessa o banco diretamente; os serviços fazem a mediação. O Context API distribui o estado ativo (campanha selecionada, tema) para todos os componentes sem prop drilling.

---

## Modelo de Dados

O banco local possui 11 tabelas, cada uma representando um domínio do jogo:

| Tabela | Domínio |
|---|---|
| `campaigns` | Campanhas criadas pelo Mestre |
| `characters` | Personagens jogadores (heróis) |
| `npcs` | Personagens não-jogadores |
| `creatures` | Bestiário (82+ criaturas pré-cadastradas) |
| `abilities` | Habilidades (100+ pré-cadastradas) |
| `items` | Itens, armas, armaduras (100+ pré-cadastrados) |
| `modifications` | Modificações e encantamentos de itens |
| `maps` | Mapas táticos |
| `encounters` | Encontros de combate |
| `diceLog` | Histórico de rolagens de dados |
| `sessionNotes` | Anotações de sessão |

O conceito de **campanhas** é o eixo central: personagens, NPCs, mapas, encontros e notas existem sempre dentro do escopo de uma campanha, permitindo que o Mestre gerencie múltiplas histórias simultaneamente sem conflito de dados.

---

## Funcionalidades Previstas

### Mesa (Dashboard)
Visão geral da campanha ativa: contagem de heróis, criaturas, habilidades e itens. Ponto de entrada rápido para as principais ações.

### Mapa Tático
Canvas HTML5 com grade configurável, tokens arrastáveis, zoom/pan, medição de distância e controle de visibilidade (Névoa de Guerra). Projeta o campo de batalha diretamente na tela.

### Personagens
Fichas completas dos heróis: atributos, bônus automáticos, nível, XP, classe, espécie, tendências, auras, traços de personalidade, habilidades e itens equipados. Suporte ao sistema de evolução do Coalizão (Nível 5: Evolução, Nível 10: TransEvolução).

### NPCs e Bestiário
Catálogo pesquisável de criaturas e personagens não-jogadores, com descrições, imagens e estatísticas. Criaturas personalizadas podem ser criadas pelo Mestre.

### Habilidades e Itens
Bancos de dados completos do sistema Coalizão, com filtros por categoria, classe, raridade e tipo. Suporte a comparação de itens e modificações de equipamento.

### Combate
Rastreador de iniciativa com gerenciamento de turnos, rolagem assistida de ataque e dano, log de combate cronológico e gerenciamento de efeitos de status (doenças, maldições, condições psicológicas) com contagem regressiva de duração.

### Dados
Rolador de D20 e D4 com suporte a modificadores, vantagem/desvantagem e classificação automática do resultado. Histórico completo de rolagens por sessão.

### Campanha
Notas de sessão numeradas, gerenciamento do arco narrativo e exportação/importação de toda a campanha em um único arquivo JSON.

---

## Sistema de Design

A identidade visual é construída sobre um **sistema de tokens CSS** sem dependências externas de UI (sem Tailwind, sem Bootstrap). O tema padrão é escuro, com acento em roxo (#9B59E8), evocando a estética fantástica do Coalizão.

**Duas tipografias principais:**
- **Cinzel** (serifada, elegante): títulos e cabeçalhos — remete a tomos antigos e inscrições.
- **Inter** (sans-serif, moderna): interface e corpo de texto — clareza e legibilidade em tela.
- **JetBrains Mono**: valores numéricos, estatísticas e dados — diferenciação visual clara.

O sistema suporta alternância entre tema escuro (padrão) e claro, com persistência da preferência entre sessões.

---

## Tecnologias Utilizadas

| Função | Tecnologia |
|---|---|
| Framework de UI | React 19 |
| Build e Dev Server | Vite 8 |
| Banco de Dados Local | Dexie.js 4 (IndexedDB) |
| Ícones | Lucide React |
| Canvas do Mapa | HTML5 Canvas API |
| Fontes | Google Fonts (Inter, Cinzel, JetBrains Mono) |
| Hospedagem | GitHub Pages |
| Estilo | CSS puro com Custom Properties |

A escolha de não utilizar frameworks de CSS pesados ou gerenciadores de estado complexos (Redux, Zustand) é intencional: o projeto prioriza **leveza** e **autonomia** — o bundle final deve ser menor que 2MB, carregando instantaneamente mesmo em conexões lentas.

---

## Público-Alvo

O VTP Coalizão é desenvolvido para:

- **Mestres do sistema Coalizão** que conduzem campanhas regulares e precisam de uma ferramenta que entenda o sistema nativamente.
- **Jogadores** que queiram consultar fichas, habilidades e itens durante as sessões.
- **Grupos** que jogam presencialmente e precisam de uma tela de apoio, ou que jogam remotamente e precisam de uma mesa compartilhável via URL.

Não é um produto para o mercado geral de RPG. É uma ferramenta artesanal para uma comunidade específica, com o grau de especialização que isso permite e exige.

---

## Estado Atual do Projeto (12/04/2026)

O projeto encontra-se **completo** após 9 fases de implementação:

- ✅ **Fases 1–6**: Foundation, bancos de dados, combate, mapa tático, polimento, PWA
- ✅ **Fase 7A**: Servidor local Node.js + WebSocket (LAN/VPN)
- ✅ **Fase 7B**: Relay server stateless para conexões online
- ✅ **Fase 8**: Sistemas de suporte (Investigação, Furtividade, Descanso, Visibilidade por token)
- ✅ **Fase 9**: Progressão (Equipamento slots, Sistema de Domínio, Evolução/TransEvolução)

**Build:** 2155 módulos · 0 erros · ~66KB JS gzipped

Todas as funcionalidades descritas neste documento foram implementadas. Consulte `Plan.txt` (v4.5) para o roadmap completo e `Docs/CHANGELOG.md` para o histórico de versões.

---

*Este documento descreve os objetivos e a arquitetura do projeto VTP Coalizão. Para detalhes técnicos, consulte `Docs/ARCHITECTURE.md` e o código-fonte em `src/`.*
