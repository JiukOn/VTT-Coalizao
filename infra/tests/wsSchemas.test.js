import { describe, it, expect } from 'vitest';
import {
  validateMasterMessage,
  validatePlayerMessage,
  HostHelloSchema,
  HostAuthSchema,
  GameStateUpdateSchema,
  EntityUpdateSchema,
  JoinSchema,
  DiceRollSchema,
  TokenMoveSchema,
  NotesSaveSchema
} from '../../shared/schemas/wsMessages.js';

describe('WebSocket Message Schemas', () => {
  describe('Master Messages', () => {
    it('validates host_hello', () => {
      const msg = { type: 'host_hello' };
      const result = HostHelloSchema.safeParse(msg);
      expect(result.success).toBe(true);
    });

    it('validates host_auth', () => {
      const msg = { type: 'host_auth', masterPassword: 'secretpassword' };
      const result = HostAuthSchema.safeParse(msg);
      expect(result.success).toBe(true);
    });

    it('rejects game_state_update without data', () => {
      const msg = { type: 'game_state_update' };
      const result = GameStateUpdateSchema.safeParse(msg);
      expect(result.success).toBe(false);
    });

    it('validates entity_update with valid payload', () => {
      const msg = {
        type: 'entity_update',
        data: {
          id: 'char-123',
          changes: { hp: 10 }
        }
      };
      const result = EntityUpdateSchema.safeParse(msg);
      expect(result.success).toBe(true);
    });

    it('rejects entity_update with missing id', () => {
      const msg = {
        type: 'entity_update',
        data: {
          changes: { hp: 10 }
        }
      };
      const result = EntityUpdateSchema.safeParse(msg);
      expect(result.success).toBe(false);
    });
  });
  
  describe('Player Messages', () => {
    it('validates join with valid code and name', () => {
      const msg = {
        type: 'join',
        campaignCode: 'AbC123',
        playerName: 'John Doe'
      };
      const result = JoinSchema.safeParse(msg);
      expect(result.success).toBe(true);
    });

    it('rejects join with empty playerName', () => {
      const msg = {
        type: 'join',
        campaignCode: 'AbC123',
        playerName: ''
      };
      const result = JoinSchema.safeParse(msg);
      expect(result.success).toBe(false);
    });

    it('rejects join with invalid campaignCode length', () => {
      const msg = {
        type: 'join',
        campaignCode: 'A1',
        playerName: 'John'
      };
      const result = JoinSchema.safeParse(msg);
      expect(result.success).toBe(false);
    });

    it('validates ping', () => {
      const msg = { type: 'ping' };
      const result = validatePlayerMessage(msg);
      expect(result.success).toBe(true);
    });

    it('validates dice_roll with all fields', () => {
      const msg = {
        type: 'dice_roll',
        data: {
          playerName: 'Player1',
          diceType: 'd20',
          result: 15,
          advantage: true,
          raw: [15, 4]
        }
      };
      const result = DiceRollSchema.safeParse(msg);
      expect(result.success).toBe(true);
    });

    it('rejects token_move with missing coordinates', () => {
      const msg = {
        type: 'token_move',
        data: {
          entityId: 'tok-123',
          x: 5
        }
      };
      const result = TokenMoveSchema.safeParse(msg);
      expect(result.success).toBe(false);
    });

    it('validates notes_save', () => {
      const msg = {
        type: 'notes_save',
        notes: 'These are my notes.'
      };
      const result = NotesSaveSchema.safeParse(msg);
      expect(result.success).toBe(true);
    });
  });
  
  describe('Discriminated Unions', () => {
    it('masterMessageSchema routes host_hello correctly', () => {
      const msg = { type: 'host_hello' };
      const result = validateMasterMessage(msg);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('host_hello');
      }
    });

    it('playerMessageSchema rejects unknown type', () => {
      const msg = { type: 'unknown_type' };
      const result = validatePlayerMessage(msg);
      expect(result.success).toBe(false);
    });

    it('masterMessageSchema rejects player message type', () => {
      const msg = { type: 'ping' };
      const result = validateMasterMessage(msg);
      expect(result.success).toBe(false);
    });
  });

  describe('Chat Messages', () => {
    it('validates public chat_message', () => {
      const msg = {
        type: 'chat_message',
        sender: 'Alice',
        text: 'Hello everyone!',
      };
      const result = validatePlayerMessage(msg);
      expect(result.success).toBe(true);
    });

    it('validates whisper chat_message', () => {
      const msg = {
        type: 'chat_message',
        sender: 'Bob',
        text: 'Secret plan',
        isWhisper: true,
        target: 'Alice',
      };
      const result = validatePlayerMessage(msg);
      expect(result.success).toBe(true);
    });

    it('validates join with characterId and characterPassword', () => {
      const msg = {
        type: 'join',
        campaignCode: 'AbC123',
        playerName: 'John Doe',
        characterId: 'char-99',
        characterPassword: 'secretpassword',
      };
      const result = JoinSchema.safeParse(msg);
      expect(result.success).toBe(true);
    });

    it('rejects chat_message without text', () => {
      const msg = {
        type: 'chat_message',
        sender: 'Charlie',
        text: '',
      };
      const result = validatePlayerMessage(msg);
      expect(result.success).toBe(false);
    });

    it('validates map_ping message for master and player', () => {
      const ping = {
        type: 'map_ping',
        data: { x: 150, y: 300, color: '#3B82F6', author: 'Jogador 1' }
      };
      expect(validateMasterMessage(ping).success).toBe(true);
      expect(validatePlayerMessage(ping).success).toBe(true);
    });

    it('validates handout_reveal message for master', () => {
      const handout = {
        type: 'handout_reveal',
        data: {
          id: 'doc-1',
          title: 'Carta Secreta',
          content: 'O plano será executado ao anoitecer...',
          type: 'letter',
          author: 'Lorde Varis',
        }
      };
      expect(validateMasterMessage(handout).success).toBe(true);
    });

    it('validates award_xp message for master', () => {
      const award = {
        type: 'award_xp',
        data: {
          amount: 250,
          reason: 'Derrotou o Golem de Pedra',
        }
      };
      expect(validateMasterMessage(award).success).toBe(true);
    });

    it('validates quest_update message for master', () => {
      const questMsg = {
        type: 'quest_update',
        quests: [
          {
            id: 'q-1',
            title: 'Resgatar o Mercador',
            status: 'active',
            rewardXp: 150,
            rewardGold: 100,
            objectives: [
              { id: 'o-1', text: 'Entrar na caverna', completed: true },
              { id: 'o-2', text: 'Derrotar o líder dos bandidos', completed: false },
            ],
          }
        ]
      };
      expect(validateMasterMessage(questMsg).success).toBe(true);
    });
  });

  describe('Roster Update Messages', () => {
    it('validates master roster_update with character list', () => {
      const msg = {
        type: 'roster_update',
        characters: [
          { id: 1, name: 'Aurelio', classId: 'guardian', level: 3, hasPassword: true, password: '123' },
          { id: 2, name: 'Polaris', classId: 'writer', level: 5, hasPassword: false },
        ]
      };
      const result = validateMasterMessage(msg);
      expect(result.success).toBe(true);
    });
  });

  describe('Scene Reveal Messages', () => {
    it('validates master scene_reveal payload', () => {
      const msg = {
        type: 'scene_reveal',
        data: {
          id: 'scene-1',
          title: 'Ruínas de Neo-Kyoto',
          subtitle: 'Setor 7 · Subterrâneo',
          description: 'A fumaça tóxica cobre os arranha-céus abandonados.',
          imageUrl: 'data:image/webp;base64,mock',
        }
      };
      const result = validateMasterMessage(msg);
      expect(result.success).toBe(true);
    });
  });
});
