/**
 * Maps emoji strings to Lucide icon names.
 * Falls back to a generic icon if no mapping exists.
 */
const EMOJI_TO_LUCIDE: Record<string, string> = {
  // Technology & AI
  '🤖': 'bot',
  '🧠': 'brain',
  '💡': 'lightbulb',
  '⚡': 'zap',
  '🔮': 'sparkles',
  '✨': 'sparkles',
  '🔧': 'wrench',
  '🛠️': 'settings',
  '⚙️': 'settings',
  '🔌': 'plug',
  '💻': 'monitor',
  '🖥️': 'monitor',
  '📱': 'smartphone',

  // Data & Analytics
  '📊': 'bar-chart-3',
  '📈': 'trending-up',
  '📉': 'trending-down',
  '🔍': 'search',
  '🔎': 'search',
  '📋': 'clipboard-list',
  '📑': 'file-text',
  '🗂️': 'folder-open',
  '💾': 'database',
  '🗄️': 'database',

  // Finance & Business
  '💰': 'coins',
  '💵': 'banknote',
  '💲': 'dollar-sign',
  '🏦': 'landmark',
  '📄': 'file-text',
  '📝': 'pen-line',
  '🏢': 'building-2',
  '🏭': 'factory',
  '🤝': 'handshake',
  '💼': 'briefcase',
  '🎯': 'target',
  '🏆': 'trophy',
  '⭐': 'star',
  '🌟': 'star',

  // Risk & Security
  '🛡️': 'shield-check',
  '🔒': 'lock',
  '🔓': 'unlock',
  '⚠️': 'alert-triangle',
  '🚨': 'siren',
  '🔐': 'key-round',
  '🕵️': 'scan-eye',

  // Communication
  '📧': 'mail',
  '📩': 'mail',
  '🌐': 'globe',
  '🔗': 'link',
  '📞': 'phone',
  '💬': 'message-square',

  // Process & Flow
  '🔄': 'refresh-cw',
  '➡️': 'arrow-right',
  '⬆️': 'arrow-up',
  '⬇️': 'arrow-down',
  '🔀': 'git-branch',
  '📐': 'ruler',
  '🧩': 'puzzle',

  // Time & Planning
  '📅': 'calendar',
  '⏱️': 'timer',
  '⏰': 'clock',
  '🕐': 'clock',
  '📆': 'calendar-days',

  // Compliance & Governance
  '⚖️': 'scale',
  '📜': 'scroll',
  '✅': 'circle-check',
  '❌': 'circle-x',
  '✓': 'check',
  '✗': 'x',

  // Nature & Categories
  '🌍': 'globe',
  '🌎': 'globe',
  '🌏': 'globe',
  '📦': 'package',
  '🔬': 'microscope',
  '🧪': 'flask-conical',
  '📚': 'book-open',
  '🎓': 'graduation-cap',

  // People & Teams
  '👥': 'users',
  '👤': 'user',
  '🧑‍💼': 'user-check',
  '👨‍💻': 'user-cog',

  // Misc
  '🚀': 'rocket',
  '🔥': 'flame',
  '💎': 'gem',
  '🏗️': 'construction',
  '📍': 'map-pin',
  '🗺️': 'map',
  '🔑': 'key',
  '🎉': 'party-popper',
  '👁️': 'eye',
  '🔔': 'bell',
};

/**
 * Renders an icon — converts emoji to Lucide icon HTML, or returns a generic icon.
 * Lucide icons are rendered as <i data-lucide="name"></i> tags and initialized by the runtime.
 */
export function renderIcon(iconStr: string, sizeClass: string = 'icon-md'): string {
  if (!iconStr) return `<i data-lucide="circle-dot" class="${sizeClass}"></i>`;

  const lucideName = EMOJI_TO_LUCIDE[iconStr.trim()];
  if (lucideName) {
    return `<i data-lucide="${lucideName}" class="${sizeClass}"></i>`;
  }

  // If it looks like a Lucide icon name already (lowercase with dashes)
  if (/^[a-z][a-z0-9-]*$/.test(iconStr.trim())) {
    return `<i data-lucide="${iconStr.trim()}" class="${sizeClass}"></i>`;
  }

  // Fallback: render as emoji text
  return `<span class="${sizeClass} icon-emoji">${iconStr}</span>`;
}
