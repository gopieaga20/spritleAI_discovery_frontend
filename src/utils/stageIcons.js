export const STAGE_ICONS = {
  // Pro stage IDs
  business:   '🏢',
  pain:       '⚠️',
  rootcause:  '🔍',
  data:       '📊',
  technology: '⚙️',
  compliance: '🛡️',
  readiness:  '🎯',
  output:     '📋',
  // Lite stage IDs
  bu: '🏢',
  pp: '⚠️',
  rc: '🔍',
  ar: '🤖',
  op: '👤',
  bp: '💰',
}

// Label-based keyword matching — handles any ID format the backend uses
const LABEL_ICON_MAP = [
  { keywords: ['business', 'domain', 'org'],                icon: '🏢' },
  { keywords: ['pain', 'challenge', 'friction'],            icon: '⚠️' },
  { keywords: ['root', 'cause'],                            icon: '🔍' },
  { keywords: ['ai readiness', 'readiness - data', 'data'], icon: '📊' },
  { keywords: ['tech', 'tool', 'api', 'technology'],        icon: '⚙️' },
  { keywords: ['compliance', 'governance', 'regulatory'],   icon: '🛡️' },
  { keywords: ['owner', 'mandate', 'perspective'],          icon: '👤' },
  { keywords: ['budget', 'priority', 'investment'],         icon: '💰' },
  { keywords: ['readiness'],                                icon: '🎯' },
]

export function stageIcon(id, fallback = '📋') {
  if (!id) return fallback
  return STAGE_ICONS[id] || STAGE_ICONS[id.toLowerCase()] || fallback
}

export function stageIconByLabel(label, fallback = '📋') {
  if (!label) return fallback
  const lower = label.toLowerCase()
  for (const { keywords, icon } of LABEL_ICON_MAP) {
    if (keywords.some((k) => lower.includes(k))) return icon
  }
  return fallback
}

export function resolveStageIcon(id, label) {
  return STAGE_ICONS[id] || STAGE_ICONS[id?.toLowerCase()] || stageIconByLabel(label) || '📋'
}
