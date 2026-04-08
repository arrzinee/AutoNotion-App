export const defaultSettings = {
  notionToken: '',
  notionDatabaseId: '',
  geminiApiKey: '',
  geminiModel: 'gemini-1.5-flash',
}

const STORAGE_KEY = 'autonotion.settings'

function normalizeSettings(settings = {}) {
  return {
    notionToken: settings.notionToken?.trim?.() || '',
    notionDatabaseId: settings.notionDatabaseId?.trim?.() || '',
    geminiApiKey: settings.geminiApiKey?.trim?.() || '',
    geminiModel: settings.geminiModel?.trim?.() || defaultSettings.geminiModel,
  }
}

function readBrowserSettings() {
  const storedSettings = window.localStorage.getItem(STORAGE_KEY)

  if (!storedSettings) {
    return defaultSettings
  }

  try {
    return normalizeSettings(JSON.parse(storedSettings))
  } catch {
    return defaultSettings
  }
}

function writeBrowserSettings(settings) {
  const nextSettings = normalizeSettings(settings)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings))

  return nextSettings
}

function getBridge() {
  return window.autonotion
}

export async function getAppInfo() {
  const bridge = getBridge()

  if (bridge?.getAppInfo) {
    return bridge.getAppInfo()
  }

  return {
    name: 'AutoNotion',
    version: 'dev',
    mode: 'browser-preview',
    isElectron: false,
  }
}

export async function getSettings() {
  const bridge = getBridge()

  if (bridge?.getSettings) {
    return bridge.getSettings()
  }

  return readBrowserSettings()
}

export async function saveSettings(settings) {
  const bridge = getBridge()

  if (bridge?.saveSettings) {
    return bridge.saveSettings(settings)
  }

  return writeBrowserSettings(settings)
}

export async function runHealthCheck(settings) {
  const bridge = getBridge()

  if (bridge?.runHealthCheck) {
    return bridge.runHealthCheck(settings)
  }

  const nextSettings = normalizeSettings(settings)

  return {
    notion: {
      ok: Boolean(nextSettings.notionToken && nextSettings.notionDatabaseId),
      service: 'notion',
      message:
        'Browser preview mode cannot reach Electron. Save and test inside the desktop app.',
    },
    gemini: {
      ok: Boolean(nextSettings.geminiApiKey),
      service: 'gemini',
      message:
        'Browser preview mode cannot reach Electron. Save and test inside the desktop app.',
    },
    checkedAt: new Date().toISOString(),
  }
}
