import { describe, it, expect, beforeEach } from 'vitest'
import { dynamicMusic, MUSIC_MOODS } from '@shared/utils/ambientMusicSynth.js'

describe('ambientMusicSynth', () => {
  beforeEach(() => {
    dynamicMusic.setMood('off')
  })

  it('contains valid music mood definitions', () => {
    expect(MUSIC_MOODS.off).toBeDefined()
    expect(MUSIC_MOODS.exploration).toBeDefined()
    expect(MUSIC_MOODS.combat).toBeDefined()
    expect(MUSIC_MOODS.tavern).toBeDefined()
    expect(MUSIC_MOODS.boss).toBeDefined()
  })

  it('starts in off state and updates active mood', () => {
    expect(dynamicMusic.getMood()).toBe('off')
    dynamicMusic.setMood('exploration')
    expect(dynamicMusic.getMood()).toBe('exploration')
    dynamicMusic.setMood('combat')
    expect(dynamicMusic.getMood()).toBe('combat')
  })

  it('adjusts volume within bounds [0, 1]', () => {
    dynamicMusic.setVolume(0.8)
    expect(dynamicMusic.getVolume()).toBe(0.8)

    dynamicMusic.setVolume(1.5)
    expect(dynamicMusic.getVolume()).toBe(1)

    dynamicMusic.setVolume(-0.2)
    expect(dynamicMusic.getVolume()).toBe(0)
  })
})
