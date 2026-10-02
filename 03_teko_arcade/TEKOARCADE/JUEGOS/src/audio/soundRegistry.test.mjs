import assert from 'node:assert/strict'
import test from 'node:test'
import { getSoundTones, soundRegistry } from './soundRegistry.ts'

test('sound registry defines every semantic effect with bounded tones', () => {
  const expectedIds = [
    'ui.click', 'ui.secondary', 'ui.back', 'ui.open', 'ui.close', 'navigation.change',
    'game.correct', 'game.incorrect', 'game.hint', 'game.start', 'game.complete',
    'reward.xp', 'reward.star', 'reward.chest', 'mission.complete', 'mission.claim',
    'progress.levelUp', 'assistant.open', 'assistant.close', 'map.node.available',
    'map.node.selected', 'map.node.completed', 'map.checkpoint', 'map.finalChallenge',
  ].sort()
  assert.deepEqual(Object.keys(soundRegistry).sort(), expectedIds)

  for (const tones of Object.values(soundRegistry)) {
    assert.ok(tones.length > 0)
    for (const tone of tones) {
      assert.ok(tone.frequency >= 180 && tone.frequency <= 900)
      assert.ok((tone.endFrequency ?? tone.frequency) <= 1000)
      assert.ok(tone.durationMs <= 220)
      assert.ok(tone.gain > 0 && tone.gain <= 0.22)
    }
  }
})

test('navigation and basic UI effects remain short', () => {
  for (const soundId of ['ui.click', 'ui.secondary', 'ui.back', 'ui.open', 'ui.close', 'navigation.change']) {
    const endMs = Math.max(...getSoundTones(soundId).map((tone) => (tone.delayMs ?? 0) + tone.durationMs))
    assert.ok(endMs <= 180, `${soundId} lasted ${endMs}ms`)
  }
})

test('earned stars rise slightly in pitch without leaving the comfortable range', () => {
  const pitches = [1, 2, 3].map((variation) => getSoundTones('reward.star', variation)[0].frequency)
  assert.ok(pitches[0] < pitches[1] && pitches[1] < pitches[2])
  assert.ok(pitches[2] < 850)
})