# 🗺️ Mapeamento & Inventário Arquitetural Consolidado — VTT Coalizão

Este documento apresenta a **arquitetura limpa e consolidada** do projeto **VTT Coalizão**, agora operando sob uma **Arquitetura Híbrida Ativa (Node.js Gateway + Python FastAPI Engine)**.

---

## 🏛️ Diretórios de Primeiro Nível da Raiz

```
Projeto VTT/
├── server/          ← 🌐 Backend Híbrido: Node.js WS (server/src) + Python FastAPI (server/engine) + Relay
├── master/          ← 👑 Aplicação autônoma do Mestre (GM Panel, Canvas 2D)
├── player/          ← 🛡️ Aplicação autônoma do Jogador (Player View, HUD)
├── database/        ← 💾 Dados Canônicos JSON, Serviços Dexie IndexedDB e Saves
├── shared/          ← 🤝 Motor de Regras, Combate, Áudio, Schemas, Estilos e Assets Públicos (shared/public)
├── infra/           ← ⚙️ Testes Automatizados (infra/tests), Scripts e Scratch
├── docs/            ← 📚 Documentações, Capturas de Tela, Logs e Referências
└── src/             ← 🚀 Ponto de entrada raiz unificado (src/main.jsx)
```

---

## 📋 Distribuição Consolidada de Arquivos e Pastas

| Diretório Raiz | Conteúdo Consolidado | Papel no Sistema |
| :--- | :--- | :--- |
| **🌐 `server/`** | `src/` (Gateway WS Node.js), `engine/` (FastAPI Python), `relay/` | Tempo real, IA, geradores procedurais, A* e relay online. |
| **👑 `master/`** | `src/pages/`, `src/components/`, `src/context/`, `src/access/` | Interface completa do Mestre de Jogo e TV Mode. |
| **🛡️ `player/`** | `src/pages/`, `src/components/`, `src/access/`, `src/memory/` | Interface leve e responsiva do Jogador. |
| **💾 `database/`** | `infodata/` (classes, espécies, skills, etc.), `services/`, `saves/` | Acervo canônico do Coalizão RPG e persistência local. |
| **🤝 `shared/`** | `rules/`, `combat/`, `audio/`, `schemas/`, `components/`, `styles/`, `public/` | Motor de regras, fórmulas, design system e assets estáticos. |
| **⚙️ `infra/`** | `tests/` (testes Vitest JS + Python unittest), `scripts/`, `scratch/`, `configs/` | Qualidade de código, 216 testes automatizados e automação. |
| **📚 `docs/`** | `captures/`, `reference/`, `logs/` | Documentação histórica, capturas de tela e manuais. |
| **🚀 `src/`** | `main.jsx` | Ponto de entrada inicial do Vite com roteamento Hash. |

---

## 🧪 Status Atual de Validação

- **Vitest (em `infra/tests/`):** 211/211 testes JavaScript passando (100%) ✅
- **Python Unittest (em `infra/tests/`):** 5/5 testes Python passando (100%) ✅
- **ESLint:** 0 erros, 0 avisos ✅
- **Vite Build (Produção):** Compilado com sucesso em ~410ms ✅
