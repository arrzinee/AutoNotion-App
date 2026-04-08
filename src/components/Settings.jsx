import { useEffect, useState } from 'react'

function maskApiKey(value) {
  if (!value) {
    return 'No API key saved'
  }

  if (value.length <= 18) {
    return `${value.slice(0, 6)}...${value.slice(-4)}`
  }

  return `${value.slice(0, 12)}......${value.slice(-4)}`
}

function Settings({ apiKey, onSave, onDisconnect, onBack, pageCount }) {
  const [draftKey, setDraftKey] = useState(apiKey)
  const [showFullKey, setShowFullKey] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraftKey(apiKey)
  }, [apiKey])

  async function handleSave() {
    setSaving(true)

    try {
      await onSave(draftKey)
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect() {
    if (!window.confirm('Disconnect this Notion workspace from AutoNotion?')) {
      return
    }

    await onDisconnect()
  }

  return (
    <section className="mx-auto grid w-full max-w-4xl gap-4">
      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Settings
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              Connection details
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
              {pageCount} synced item{pageCount === 1 ? '' : 's'} available in your
              workspace right now.
            </p>
          </div>

          <button type="button" onClick={onBack} className="btn-ghost">
            Back
          </button>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Saved key
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <code className="rounded-2xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-4 py-3 text-sm text-[var(--text-primary)]">
            {showFullKey ? apiKey || 'No API key saved' : maskApiKey(apiKey)}
          </code>
          <button
            type="button"
            onClick={() => setShowFullKey((value) => !value)}
            className="btn-ghost"
          >
            {showFullKey ? 'Hide' : 'Reveal'}
          </button>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Update Notion API key
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="password"
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            placeholder="secret_xxxxx"
            className="input-base flex-1"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !draftKey.trim()}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Key'}
          </button>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Gemini CLI setup
        </p>
        <div className="mt-4 space-y-3">
          <code className="block rounded-2xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-4 py-3 text-sm text-[var(--text-primary)]">
            npm install -g @google/gemini-cli
          </code>
          <code className="block rounded-2xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-4 py-3 text-sm text-[var(--text-primary)]">
            gemini auth login
          </code>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-[rgba(239,68,68,0.22)] bg-[var(--bg-secondary)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-[var(--error)]">
          Danger zone
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
          Disconnecting removes the saved Notion API key from local storage and
          returns AutoNotion to setup mode.
        </p>
        <button
          type="button"
          onClick={handleDisconnect}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] px-5 py-3 text-sm font-semibold text-[var(--error)] transition hover:bg-[rgba(239,68,68,0.18)]"
        >
          Disconnect
        </button>
      </div>
    </section>
  )
}

export default Settings
