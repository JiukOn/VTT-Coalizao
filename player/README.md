# 🛡️ Módulo PLAYER — Dashboard & HUD do Jogador

O módulo **PLAYER** é uma aplicação web leve, responsiva e focada na experiência do jogador em tempo real, projetada tanto para computadores quanto para tablets e smartphones.

---

## 📂 Estrutura Interna

```
player/
├── src/
│   ├── main.jsx                  # Ponto de entrada da aplicação do Jogador
│   ├── pages/
│   │   ├── PlayerLoginPage.jsx   # Login por código de sessão e seleção de personagem
│   │   └── PlayerDashboard.jsx   # Dashboard com as 7 abas ativas do jogador
│   ├── components/
│   │   ├── character/            # Habilidades ENR, Oficina, Loja, LevelUp, Rest, Equip
│   │   ├── hud/                  # ActionBar flutuante, Macros rápidas, VoiceStatusBar
│   │   ├── map/                  # PlayerMap com Névoa em 3 Camadas, Shroud e LoS
│   │   └── handouts/             # Visualizador de documentos e cenas do Mestre
│   ├── access/                   # playerAuth.js, codeValidator.js, characterSelector.jsx
│   └── memory/                   # Notas de sessão salvas localmente
└── package.json                  # Manifesto do módulo
```

---

## 🎮 Principais Recursos do Jogador

1. **🔮 Habilidades Canônicas & Gasto de Energia (ENR):**
   - Modal com catálogo de habilidades ativas e de legado.
   - Consumo automático de ENR e contagem de turnos.
2. **🔬 Oficina de Customização de Armas:**
   - Instalação de miras holográficas, canos estendidos, supressores e células de munição estendidas.
3. **🏪 Loja Interativa de Mercadores:**
   - Compra e venda de itens e espólios diretamente com o Mestre.
4. **🗺️ Player Map com Névoa em 3 Camadas:**
   - Visão atual (0% névoa), memória de exploração (*shroud* 50% névoa) e escuridão total (96% névoa).
   - Inimigos fora do campo de visão são automaticamente ocultados.
5. **🎲 Rolador de Dados e Chat de Voz:**
   - Rolagens rápidas de atributos (VIT, DEX, CRM, FRC, INT, RES, PRE, ENR) com 1 clique na ficha.
   - Indicador de fala e volume no token via WebRTC P2P Voice Chat.
