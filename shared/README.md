# 🤝 Módulo SHARED — Motor de Regras, Combate, Áudio, UI & Assets Públicos

O módulo **SHARED** é o núcleo compartilhado do **VTT Coalizão**, contendo funções puras de regras de RPG, fórmulas de combate, sintetizadores de áudio, validação de mensagens WebSocket, componentes de interface e todos os assets públicos estáticos da aplicação.

---

## 📂 Estrutura Interna

```
shared/
├── rules/                        # Regras canônicas oficiais da Coalizão
│   ├── coalizaoAuras.js          # Auras oficiais e raio de efeito
│   ├── elementalAffinities.js    # Matriz elemental e multiplicadores (+50% / -50%)
│   ├── coalizaoSpecies.js        # Modificadores raciais de atributos
│   ├── coalizaoSkills.js         # Lançador de habilidades e custo de ENR
│   ├── coalizaoBiomes.js         # Modificadores ambientais e climáticos por bioma
│   ├── coalizaoConditions.js     # Resolução de testes de condições (1d4, 1d20)
│   └── coalizaoTendencies.js     # Bônus de aptidão por tendência
├── combat/                       # Fórmulas de combate e física do jogo
│   ├── combatUtils.js            # Resolução de ataques corpo a corpo, à distância e magia
│   ├── diceRoller.js             # Rolagem e classificação oficial de D20 e D4
│   ├── characterUtils.js         # Cálculo de bônus ⌊Valor / 5⌋ e pontos de vida
│   ├── coverUtils.js             # Detecção de cobertura tática (Meia, 3/4, Total)
│   ├── stealthUtils.js           # Furtividade vs Percepção Passiva
│   ├── ammoTracker.js            # Contador de munição e recargas
│   ├── craftingWorkshop.js       # Modificações de armas e armaduras
│   ├── energyShields.js          # Pontos de escudo (SP) e recarga progressiva
│   ├── lingeringInjuries.js      # Sequelas de combate e traumas
│   ├── initiativeDeck.js         # Baralho de iniciativa tática
│   └── opportunityAttack.js      # Detecção de ataques de oportunidade
├── audio/                        # Sintetizadores procedurais Web Audio API
│   ├── sfxPlayer.js              # Efeitos sonoros (dados, acertos, erros, alertas)
│   └── ambientSynth.js           # Trilhas sonoras atmosféricas contínuas
├── schemas/                      # Schemas de validação de rede
│   └── wsMessages.js             # Schemas Zod para todas as mensagens WebSocket
├── public/                       # Assets públicos estáticos servidos pelo Vite
│   ├── assets/                   # Fontes, ícones e imagens
│   ├── sfx/                      # Arquivos de áudio .mp3
│   ├── favicon.svg               # Ícone vetorial da aplicação
│   ├── manifest.json             # Manifesto PWA
│   └── sw.js                     # Service Worker offline
├── components/                   # Componentes visuais compartilhados
│   └── Modal, SearchBar, FilterBar, ConfirmDialog, RollCard, DiceThrowOverlay
├── context/                      # Provedores de Tema e Idioma (pt-BR / en-US)
├── hooks/                        # Hooks reaproveitáveis (useWebSocket, useUndoStack)
├── styles/                       # Folhas de estilo CSS e tokens de design
├── index.js                      # Barrel export de todo o módulo
└── package.json                  # Manifesto do módulo
```

---

## 📦 Como Importar

Qualquer módulo da aplicação pode importar diretamente do `@shared`:

```javascript
import { rollDice, getBonus, sfx, validatePlayerMessage } from '@shared'
```
