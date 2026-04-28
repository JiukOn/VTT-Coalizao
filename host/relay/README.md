# VTP Coalizão — Relay Server

Servidor de retransmissão WebSocket stateless para sessões online (Fase 7B).

**Características:**
- Totalmente stateless — nenhum dado de campanha é persistido
- Multi-sala: cada sessão tem uma sala independente (identificada pelo código)
- Máximo 8 jogadores por sala
- Heartbeat/ping-pong a cada 30s para detectar conexões mortas
- TLS/WSS gerenciado pela plataforma de deploy
- Compatível com Railway, Render e Fly.io (tiers gratuitos)

---

## Como funciona

```
Mestre (HOST)          Relay Server           Jogador (PLAYER)
      |                     |                       |
      |-- host_hello ------>|                       |
      |<- host_welcome -----|                       |
      |                     |<--- join -------------|
      |<- player_joined ----|----> welcome -------->|
      |                     |                       |
      |-- entity_update --->|---> entity_update --->|
      |                     |                       |
      |<- dice_roll --------|<--- dice_roll ---------|
```

O relay **nunca armazena** dados da campanha. Apenas retransmite mensagens entre host e jogadores.

---

## Deploy rápido

### Railway (recomendado)

1. Crie uma conta em [railway.app](https://railway.app)
2. Crie um novo projeto → "Deploy from GitHub repo"
3. Selecione o repositório
4. Configure o **Root Directory** como `relay/`
5. Railway detecta automaticamente o `package.json` e usa `node index.js`
6. Variável `PORT` é definida automaticamente pelo Railway
7. Após o deploy, copie a URL gerada (ex: `https://vtp-relay.railway.app`)

A URL WSS para os usuários será: `wss://vtp-relay.railway.app`

### Render

1. Crie uma conta em [render.com](https://render.com)
2. Novo Web Service → conecte o repositório
3. Root Directory: `relay/`
4. Build Command: *(deixe vazio)*
5. Start Command: `node index.js`
6. O arquivo `relay/render.yaml` já contém a configuração correta

### Fly.io

```bash
cd relay
fly launch --name vtp-relay --region gru
fly deploy
```

### Local (desenvolvimento)

```bash
# Do diretório raiz do projeto:
npm run relay:dev

# Ou do diretório relay/:
cd relay
npm install
npm run dev
```

Por padrão usa a porta `4001`. Mude com a variável de ambiente `PORT`.

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `4001` | Porta HTTP/WS do servidor |
| `ALLOWED_ORIGIN` | `*` | Origem CORS permitida (ex: `https://meusite.github.io`) |

Para produção, recomenda-se definir `ALLOWED_ORIGIN` com o domínio exato do frontend para segurança adicional.

---

## Endpoints REST

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check — retorna status, nº de salas e jogadores |
| GET | `/api/room/:code` | Info de uma sala específica |

Exemplo de resposta do `/health`:
```json
{
  "status": "ok",
  "rooms": 2,
  "players": 5
}
```

---

## Protocolo WebSocket

O relay aceita os mesmos eventos do servidor local (Fase 7A), mais os específicos do relay:

### Eventos do Host → Relay

| Evento | Campos obrigatórios | Descrição |
|--------|--------------------|-----------| 
| `host_hello` | `sessionCode?` | Host se identifica; `sessionCode` opcional para reusar sala |
| `game_state_update` | `data` | Atualiza estado completo (repassado a novos jogadores) |
| `entity_update` | `data` | Atualiza entidade específica |
| `turn_change` | `data` | Mudança de turno |
| `map_update` | `data` | Atualização do mapa |
| `combat_event` | `data` | Resultado de combate |
| `ping` | — | Keepalive (relay responde com `pong`) |

### Eventos do Jogador → Relay

| Evento | Campos obrigatórios | Descrição |
|--------|--------------------|-----------| 
| `join` | `campaignCode`, `playerName` | Solicita entrada na sala |
| `dice_roll` | `data` | Rolagem (repassada ao host) |
| `token_move` | `data` | Movimento de token (repassado ao host) |
| `notes_save` | `notes` | Notas pessoais (repassadas ao host; relay não salva em disco) |
| `ping` | — | Keepalive |

### Resposta do Relay → Host

| Evento | Campos | Descrição |
|--------|--------|-----------|
| `host_welcome` | `sessionCode` | Confirma conexão, retorna código da sala |
| `player_joined` | `playerName`, `playerId` | Notifica novo jogador |
| `player_left` | `playerName`, `playerId` | Notifica saída |

### Resposta do Relay → Jogador

| Evento | Campos | Descrição |
|--------|--------|-----------|
| `welcome` | `playerId`, `playerName`, `gameState` | Confirma entrada na sala |
| `error` | `message` | Erro (código inválido, sala cheia, etc.) |
| `pong` | — | Resposta ao keepalive |

---

## Limites e considerações

- **8 jogadores máximo** por sala (configurável na variável `MAX_PLAYERS` no código)
- Salas são removidas automaticamente quando ficam vazias
- Dados de campanha **nunca saem do Host** — o relay só retransmite mensagens
- Tier gratuito do Railway/Render pode ter cold start de ~30s na primeira conexão
- O keepalive de 25s no cliente evita que proxies cloud fechem conexões ociosas
- Para reconexão, o Host envia `sessionCode` no `host_hello` para reusar o código anterior

---

## Segurança

- O relay não autentica usuários — segurança é pelo código de sessão de 6 caracteres
- Defina `ALLOWED_ORIGIN` em produção para limitar origens CORS
- Dados sensíveis da campanha nunca passam pelo relay em texto claro que seja armazenado
- Para uso em produção com dados sensíveis, considere adicionar autenticação adicional

---

*Relay Server v1.0.0 · Node.js 20+ · Deploy em Railway/Render/Fly.io*
