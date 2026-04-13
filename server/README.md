# VTP Coalizão — Servidor Local (Fase 7A)

Servidor Node.js + Express + WebSocket para sessões multi-jogador em rede local (LAN) ou via VPN.

**Quando usar:** Todos os jogadores estão na mesma rede WiFi, ou usam VPN (ZeroTier, Tailscale, Hamachi).  
**Alternativa online:** Use o relay server (`relay/`) para conexões pela internet sem VPN.

---

## Como iniciar

```bash
# Do diretório raiz do projeto:
npm run server        # produção (serve /dist + API)
npm run server:dev    # desenvolvimento (hot-reload)
```

O servidor exibe no terminal:

```
┌────────────────────────────────────────────────┐
│   VTP COALIZÃO — Servidor Local (Fase 7A)     │
├────────────────────────────────────────────────┤
│   Porta     : 3001
│   Código    : GH4K9X
│   IPs da rede:
│     Ethernet: http://192.168.1.10:3001
│     Wi-Fi:    http://192.168.1.10:3001
├────────────────────────────────────────────────┤
│   Mestre:  http://localhost:5173               │
│   Jogador: http://{ip}:3001/#/player           │
└────────────────────────────────────────────────┘
```

**O Mestre** acessa o VTP normalmente em `localhost:5173` (dev) ou `localhost:3001` (produção).  
**Os Jogadores** abrem `http://{IP_EXIBIDO}:3001/#/player` no navegador e inserem o código de sessão.

---

## Configuração

### Porta

A porta padrão é `3001`. Para usar outra porta:

```bash
PORT=8080 npm run server
```

### Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `3001` | Porta HTTP/WS |

---

## Endpoints REST

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/status` | Retorna código de sessão, jogadores conectados, IPs |
| POST | `/api/new-code` | Gera novo código de sessão |

Exemplo `/api/status`:
```json
{
  "online": true,
  "sessionCode": "GH4K9X",
  "playerCount": 2,
  "players": [
    { "name": "Akali", "id": "uuid-1" },
    { "name": "Aurelio", "id": "uuid-2" }
  ],
  "ips": ["192.168.1.10"]
}
```

---

## Salvamento de notas

Notas dos jogadores são salvas automaticamente como arquivos JSON em:

```
saves/
└── {CÓDIGO_DE_SESSÃO}/
    ├── Akali_notes.json
    ├── Aurelio_notes.json
    └── ...
```

Cada arquivo contém:
```json
{
  "playerName": "Akali",
  "sessionCode": "GH4K9X",
  "notes": "Conteúdo das notas...",
  "savedAt": "2026-04-12T20:30:00.000Z"
}
```

---

## Protocolo WebSocket

### Handshake do Host

```
Host → Server: { type: "host_hello" }
Server → Host: { type: "host_welcome", sessionCode: "GH4K9X" }
```

### Handshake do Jogador

```
Player → Server: { type: "join", campaignCode: "GH4K9X", playerName: "Akali" }
Server → Player: { type: "welcome", playerId: "uuid", playerName: "Akali", gameState: {...} }
                 // ou em caso de erro:
Server → Player: { type: "error", message: "Código de campanha inválido." }
```

### Eventos em tempo real

| Evento | De | Para | Descrição |
|--------|-----|------|-----------|
| `game_state_update` | Host | Players | Estado completo da mesa (novos jogadores recebem ao entrar) |
| `entity_update` | Host | Players | HP, efeitos, posição de uma entidade |
| `turn_change` | Host | Players | Mudança de turno no tracker |
| `map_update` | Host | Players | Atualização do mapa |
| `combat_event` | Host | Players | Resultado de combate |
| `dice_roll` | Player | Host | Rolagem do jogador |
| `token_move` | Player | Host | Movimento do token do jogador |
| `notes_save` | Player | Disk + Host | Notas pessoais (salvas em /saves e repassadas ao host) |
| `ping` / `pong` | Bilateral | — | Keepalive a cada 25s |

---

## Usando VPN (sem configuração de roteador)

Para jogar com amigos remotos sem abrir portas no roteador:

### ZeroTier (recomendado)

1. Todos instalam [ZeroTier](https://www.zerotier.com/download/)
2. Mestre cria uma rede em [my.zerotier.com](https://my.zerotier.com) (gratuito)
3. Compartilha o Network ID com os jogadores
4. Todos entram na rede com `zerotier-cli join {NETWORK_ID}`
5. Jogadores usam o IP ZeroTier do Mestre no lugar do IP local

### Tailscale

1. Todos instalam [Tailscale](https://tailscale.com/download)
2. Todos fazem login (pode usar conta Google)
3. Mestre verifica seu IP Tailscale em `http://100.x.x.x:3001/api/status`
4. Jogadores usam esse endereço

### Hamachi

1. Todos instalam [Hamachi](https://www.vpn.net/)
2. Mestre cria uma rede com senha
3. Jogadores entram na rede com o ID e senha
4. Usam o IP Hamachi do Mestre (começa com `25.`)

---

## Firewall (Windows)

Se os jogadores não conseguem conectar, verifique o firewall:

```powershell
# PowerShell (Admin) — Abrir porta 3001 para conexões entrantes
New-NetFirewallRule -DisplayName "VTP Coalizao Server" -Direction Inbound -Port 3001 -Protocol TCP -Action Allow
```

Para remover a regra depois:
```powershell
Remove-NetFirewallRule -DisplayName "VTP Coalizao Server"
```

---

*Servidor Local v7.1.0 · Node.js 18+ · Porta padrão 3001*
