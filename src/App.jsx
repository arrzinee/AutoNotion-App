import { useEffect, useState } from 'react'
import SettingsPanel from './components/SettingsPanel.jsx'
import StatusPill from './components/StatusPill.jsx'
import {
  defaultSettings,
  getAppInfo,
  getSettings,
  runHealthCheck,
  saveSettings,
} from './lib/desktop.js'

const initialStatus = {
  notion: { ok: false, service: 'notion', message: 'Not tested yet.' },
  gemini: { ok: false, service: 'gemini', message: 'Not tested yet.' },
  checkedAt: null,
}

function App() {
  const [appInfo, setAppInfo] = useState({
    name: 'AutoNotion',
    mode: 'browser-preview',
    version: '0.0.0',
    isElectron: false,
  })
  const [settings, setSettings] = useState(defaultSettings)
  const [status, setStatus] = useState(initialStatus)
  const [isBooting, setIsBooting] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      try {
        const [nextAppInfo, savedSettings] = await Promise.all([
          getAppInfo(),
          getSettings(),
        ])

        if (!isMounted) {
          return
        }

        setAppInfo(nextAppInfo)
        setSettings(savedSettings)
      } finally {
        if (isMounted) {
          setIsBooting(false)
        }
      }
    }

    bootstrap()

    return () => {
      isMounted = false
    }
  }, [])

  function updateField(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSave() {
    setIsSaving(true)

    try {
      const nextSettings = await saveSettings(settings)
      setSettings(nextSettings)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCheck() {
    setIsChecking(true)

    try {
      const result = await runHealthCheck(settings)
      setStatus(result)
    } finally {
      setIsChecking(false)
    }
  }

  const lastCheckedLabel = status.checkedAt
    ? new Date(status.checkedAt).toLocaleString()
    : 'No connection test yet'

  return (
    <main className="min-h-screen px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col gap-6 rounded-[2rem] border border-white/55 bg-[rgba(250,245,236,0.88)] p-5 shadow-[0_30px_120px_rgba(78,58,30,0.18)] backdrop-blur md:p-8">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-900/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-950/70">
              Desktop command center
            </div>
            <div className="space-y-4">
              <p className="max-w-2xl text-sm font-medium uppercase tracking-[0.32em] text-stone-500">
                Electron + React + Vite baseline
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.04em] text-balance text-stone-950 sm:text-5xl lg:text-6xl">
                AutoNotion is ready for real app code instead of starter files.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
                The renderer now talks to Electron through a preload bridge,
                settings persist with electron-store, and both Notion and Gemini
                have dedicated service modules for connection checks.
              </p>
            </div>
          </div>

          <aside className="grid gap-4 rounded-[1.75rem] border border-stone-950/8 bg-[linear-gradient(180deg,rgba(99,72,42,0.95),rgba(39,28,18,0.98))] p-5 text-stone-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <div className="flex items-center justify-between">
              <p className="text-sm uppercase tracking-[0.28em] text-stone-300">
                Runtime
              </p>
              <StatusPill
                status={appInfo.isElectron ? 'success' : 'pending'}
                label={appInfo.isElectron ? 'Electron bridge live' : 'Browser preview'}
              />
            </div>

            <div className="grid gap-3 text-sm text-stone-200">
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
                  App
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {appInfo.name}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
                    Mode
                  </p>
                  <p className="mt-2 text-lg font-semibold capitalize text-white">
                    {appInfo.mode}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
                    Version
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {appInfo.version}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isBooting}
                className="inline-flex items-center justify-center rounded-full bg-[#f6d38b] px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-[#efc96f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                type="button"
                onClick={handleCheck}
                disabled={isChecking || isBooting}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isChecking ? 'Checking...' : 'Test Connections'}
              </button>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <SettingsPanel
            eyebrow="Notion"
            title="Workspace connection"
            description="Save the integration token and the database ID your automations should target."
            footer={
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-stone-500">{status.notion.message}</p>
                <StatusPill
                  status={status.notion.ok ? 'success' : 'pending'}
                  label={status.notion.ok ? 'Connected' : 'Needs attention'}
                />
              </div>
            }
          >
            <label className="grid gap-2">
              <span className="text-sm font-medium text-stone-700">
                Integration token
              </span>
              <input
                type="password"
                value={settings.notionToken}
                onChange={(event) => updateField('notionToken', event.target.value)}
                placeholder="secret_xxxxx"
                className="field-input"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-stone-700">
                Database ID
              </span>
              <input
                type="text"
                value={settings.notionDatabaseId}
                onChange={(event) =>
                  updateField('notionDatabaseId', event.target.value)
                }
                placeholder="32-character database id"
                className="field-input"
              />
            </label>
          </SettingsPanel>

          <SettingsPanel
            eyebrow="Gemini"
            title="Model configuration"
            description="Keep your AI settings separate from the UI so the renderer stays focused on product logic."
            footer={
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-stone-500">{status.gemini.message}</p>
                <StatusPill
                  status={status.gemini.ok ? 'success' : 'pending'}
                  label={status.gemini.ok ? 'Connected' : 'Needs attention'}
                />
              </div>
            }
          >
            <label className="grid gap-2">
              <span className="text-sm font-medium text-stone-700">
                API key
              </span>
              <input
                type="password"
                value={settings.geminiApiKey}
                onChange={(event) => updateField('geminiApiKey', event.target.value)}
                placeholder="AIza..."
                className="field-input"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-stone-700">
                Preferred model
              </span>
              <input
                type="text"
                value={settings.geminiModel}
                onChange={(event) => updateField('geminiModel', event.target.value)}
                placeholder="gemini-1.5-flash"
                className="field-input"
              />
            </label>
          </SettingsPanel>
        </section>

        <section className="grid gap-4 rounded-[1.75rem] border border-stone-950/8 bg-white/70 p-5 shadow-[0_18px_60px_rgba(82,59,26,0.08)] md:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.28em] text-stone-500">
              Structure notes
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-stone-950">
              Cleaner boundaries make the next features easier.
            </h2>
            <p className="text-sm leading-7 text-stone-600">
              Use the renderer for interface work, keep secrets and API calls in
              Electron modules, and let the preload script be the only bridge
              across that boundary.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="soft-card">
              <p className="soft-card-title">Electron</p>
              <p className="soft-card-copy">
                Main process, window boot, IPC handlers, persistent settings.
              </p>
            </div>
            <div className="soft-card">
              <p className="soft-card-title">Preload</p>
              <p className="soft-card-copy">
                Safe API surface exposed as <code>window.autonotion</code>.
              </p>
            </div>
            <div className="soft-card">
              <p className="soft-card-title">Renderer</p>
              <p className="soft-card-copy">
                React UI, component composition, local form state.
              </p>
            </div>
            <div className="soft-card">
              <p className="soft-card-title">Status</p>
              <p className="soft-card-copy">Last connection test: {lastCheckedLabel}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
