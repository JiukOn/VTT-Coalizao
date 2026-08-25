import { z } from 'zod';

// Master message schemas
export const HostHelloSchema = z.object({
  type: z.literal('host_hello'),
});

export const HostAuthSchema = z.object({
  type: z.literal('host_auth'),
  sessionCode: z.string().optional(),
  masterPassword: z.string().optional(),
});

export const GameStateUpdateSchema = z.object({
  type: z.literal('game_state_update'),
  data: z.record(z.any()),
});

export const MapUpdateSchema = z.object({
  type: z.literal('map_update'),
  data: z.record(z.any()),
});

export const EntityUpdateSchema = z.object({
  type: z.literal('entity_update'),
  data: z.object({
    id: z.string(),
    changes: z.record(z.any()),
  }),
});

export const TurnChangeSchema = z.object({
  type: z.literal('turn_change'),
  data: z.object({
    order: z.array(z.any()).optional(),
    round: z.number().nonnegative().optional(),
    currentIndex: z.number().nonnegative().optional(),
    currentEntityName: z.string().optional(),
  }),
});

export const CombatEventSchema = z.object({
  type: z.literal('combat_event'),
  data: z.object({
    summary: z.string(),
    attacker: z.string().optional(),
    defender: z.string().optional(),
  }),
});

export const SessionSnapshotSchema = z.object({
  type: z.literal('session_snapshot'),
  data: z.record(z.any()),
});

export const RosterUpdateSchema = z.object({
  type: z.literal('roster_update'),
  characters: z.array(z.object({
    id: z.string().or(z.number()),
    name: z.string(),
    classId: z.string().optional(),
    level: z.number().optional(),
    avatar: z.string().optional(),
    hasPassword: z.boolean().optional(),
    password: z.string().optional(),
  })),
});

// Player message schemas
export const JoinSchema = z.object({
  type: z.literal('join'),
  campaignCode: z.string().length(6).regex(/^[a-zA-Z0-9]+$/),
  playerName: z.string().min(1).max(50),
  characterId: z.string().or(z.number()).optional(),
  characterPassword: z.string().optional(),
});

export const GetCharactersSchema = z.object({
  type: z.literal('get_characters'),
  campaignCode: z.string(),
});

export const DiceRollSchema = z.object({
  type: z.literal('dice_roll'),
  data: z.object({
    playerName: z.string(),
    diceType: z.string(),
    result: z.number(),
    advantage: z.boolean().optional(),
    raw: z.array(z.number()).optional(),
  }),
});

export const TokenMoveSchema = z.object({
  type: z.literal('token_move'),
  data: z.object({
    entityId: z.string().or(z.number()).optional(),
    id: z.string().or(z.number()).optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    changes: z.record(z.any()).optional(),
  }).refine(
    (d) => (d.entityId != null && d.x != null && d.y != null) || (d.id != null && d.changes != null),
    { message: 'token_move must contain either (entityId, x, y) or (id, changes)' }
  ),
});

export const NotesSaveSchema = z.object({
  type: z.literal('notes_save'),
  notes: z.string(),
});

export const PingSchema = z.object({
  type: z.literal('ping'),
});

export const ResyncRequestSchema = z.object({
  type: z.literal('resync_request'),
  lastVersion: z.number().optional(),
});

export const ChatMessageSchema = z.object({
  type: z.literal('chat_message'),
  sender: z.string(),
  text: z.string().min(1).max(1000),
  target: z.string().optional(),
  isWhisper: z.boolean().optional(),
  timestamp: z.string().optional(),
});

export const MapPingSchema = z.object({
  type: z.literal('map_ping'),
  data: z.object({
    x: z.number(),
    y: z.number(),
    color: z.string().optional(),
    author: z.string().optional(),
  }),
});

export const AmbientChangeSchema = z.object({
  type: z.literal('ambient_change'),
  data: z.object({
    theme: z.string(),
    volume: z.number().optional(),
  }),
});

export const HandoutRevealSchema = z.object({
  type: z.literal('handout_reveal'),
  data: z.object({
    id: z.string().or(z.number()).optional(),
    title: z.string(),
    content: z.string(),
    type: z.string().optional(),
    image: z.string().optional(),
    author: z.string().optional(),
  }),
});

export const AwardXpSchema = z.object({
  type: z.literal('award_xp'),
  data: z.object({
    amount: z.number().nonnegative(),
    reason: z.string().optional(),
  }),
});

export const QuestUpdateSchema = z.object({
  type: z.literal('quest_update'),
  quests: z.array(z.object({
    id: z.string().or(z.number()),
    title: z.string(),
    description: z.string().optional(),
    objectives: z.array(z.object({
      id: z.string().or(z.number()),
      text: z.string(),
      completed: z.boolean(),
    })).optional(),
    rewardXp: z.number().optional(),
    rewardGold: z.number().optional(),
    status: z.enum(['active', 'completed', 'failed']).optional(),
  })),
});

export const SceneRevealSchema = z.object({
  type: z.literal('scene_reveal'),
  data: z.object({
    id: z.string().or(z.number()).optional(),
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string(),
  }),
});

export const VoiceSignalSchema = z.object({
  type: z.literal('voice_signal'),
  data: z.object({
    sender: z.string(),
    target: z.string().optional(),
    signal: z.any().optional(),
    isSpeaking: z.boolean().optional(),
  }),
});

export const WeatherChangeSchema = z.object({
  type: z.literal('weather_change'),
  data: z.object({
    weather: z.enum(['none', 'rain', 'acid_rain', 'snow', 'embers', 'fog']),
    intensity: z.number().min(0).max(1).optional(),
  }),
});

export const AwardInspirationSchema = z.object({
  type: z.literal('award_inspiration'),
  data: z.object({
    targetPlayer: z.string(),
    points: z.number().default(1),
    reason: z.string().optional(),
  }),
});

// Discriminated unions
export const masterMessageSchema = z.discriminatedUnion('type', [
  HostHelloSchema,
  HostAuthSchema,
  GameStateUpdateSchema,
  MapUpdateSchema,
  EntityUpdateSchema,
  TurnChangeSchema,
  CombatEventSchema,
  SessionSnapshotSchema,
  RosterUpdateSchema,
  ChatMessageSchema,
  MapPingSchema,
  AmbientChangeSchema,
  HandoutRevealSchema,
  AwardXpSchema,
  QuestUpdateSchema,
  SceneRevealSchema,
  VoiceSignalSchema,
  WeatherChangeSchema,
  AwardInspirationSchema,
]);

export const playerMessageSchema = z.discriminatedUnion('type', [
  JoinSchema,
  GetCharactersSchema,
  DiceRollSchema,
  TokenMoveSchema,
  NotesSaveSchema,
  PingSchema,
  ResyncRequestSchema,
  ChatMessageSchema,
  MapPingSchema,
  VoiceSignalSchema,
]);

// Validation helpers
export function validateMasterMessage(msg) {
  return masterMessageSchema.safeParse(msg);
}

export function validatePlayerMessage(msg) {
  return playerMessageSchema.safeParse(msg);
}
