import { progressService } from './progressService.ts'
import { generateLocalMissions } from './missionEngine.ts'

export const missionService = {
  getMissions() {
    return generateLocalMissions(progressService.getProgress())
  },

  claimReward(missionId: string): { claimed: boolean; xp: number } {
    const mission = this.getMissions().find((item) => item.id === missionId)
    if (!mission || mission.status !== 'completed') return { claimed: false, xp: 0 }

    const result = progressService.claimMissionReward(mission.id, mission.rewardXp)
    return { claimed: result.claimed, xp: result.claimed ? mission.rewardXp : 0 }
  },
}