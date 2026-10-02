export type MascotPose = 'doubt' | 'study' | 'success' | 'tip' | 'progress'

interface TekoMascotProps {
  pose: MascotPose
  compact?: boolean
  expanded?: boolean
  label: string
  onClick?: () => void
}

const mascotAssets: Record<MascotPose, string> = {
  doubt: './mascot/Tejucito/Duda.png',
  study: './mascot/Tejucito/Estudio.png',
  success: './mascot/Tejucito/Feliz.png',
  tip: './mascot/Tejucito/Idea.png',
  progress: './mascot/Tejucito/Progreso.png',
}

export function TekoMascot({ pose, compact = false, expanded = false, label, onClick }: TekoMascotProps) {
  return (
    <button
      className={`teko-assistant__launcher${compact ? ' teko-assistant__launcher--compact' : ''}`}
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      data-pose={pose}
      onClick={onClick}
    >
      <img
        key={pose}
        className="teko-assistant__image"
        src={mascotAssets[pose] ?? mascotAssets.tip}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    </button>
  )
}