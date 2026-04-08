import { useEffect, useState } from 'react'
import Chat from './components/Chat.jsx'
import { CheckIcon, NotionIcon, RefreshIcon } from './components/Icons.jsx'
import Settings from './components/Settings.jsx'
import Sidebar from './components/Sidebar.jsx'

function getElectronAPI() {
  return window.electronAPI
}

function getFallbackStore() {
  return {
    async get(key, fallback = '') {
      return window.localStorage.getItem(key) || fallback
    },
    async set(key, value) {
      window.localStorage.setItem(key, value)
      return true
    },
    async delete(key) {
      window.localStorage.removeItem(key)
      return true
    },
  }
}

function SetupScreen({
  apiKey,
  onApiKeyChange,
  onSave,
  loadingPages,
  pageError,
}) {
  const [showKey, setShowKey] = useState(false)

  async function openIntegrations(event) {
    event.preventDefault()

    if (getElectronAPI()?.shell?.openExternal) {
      await getElectronAPI().shell.openExternal('https://www.notion.so/my-integrations')
      return
    }

    window.open('https://www.notion.so/my-integrations', '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.28),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_22%)]" />

      <div className="glass glow-accent relative z-10 w-full max-w-lg rounded-[2rem] border border-[var(--border-light)] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.42)] sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(99,102,241,0.14)] text-[var(--accent)]">
            <NotionIcon size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-secondary)]">
              AutoNotion
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-[var(--text-primary)]">
              Connect your workspace
            </h1>
          </div>
        </div>

        <p className="mb-6 text-sm leading-7 text-[var(--text-secondary)]">
          Paste your Notion integration key to load pages and let AutoNotion plan
          changes for your workspace.
        </p>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSave()
          }}
        >
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Notion API key
            </span>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(event) => onApiKeyChange(event.target.value)}
                placeholder="secret_xxxxx"
                className="input-base pr-24"
              />
              <button
                type="button"
                onClick={() => setShowKey((value) => !value)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border-light)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {pageError ? (
            <p className="rounded-2xl border border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[var(--error)]">
              {pageError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loadingPages || !apiKey.trim()}
            className="btn-primary w-full"
          >
            {loadingPages ? 'Connecting...' : 'Connect'}
          </button>
        </form>

        <div className="mt-6 text-sm text-[var(--text-secondary)]">
          Need a Notion integration key?{' '}
          <a
            href="https://www.notion.so/my-integrations"
            onClick={openIntegrations}
            className="font-semibold text-[var(--accent-hover)] underline decoration-[rgba(129,140,248,0.4)] underline-offset-4"
          >
            Open notion.so/my-integrations
          </a>
        </div>
      </div>
    </section>
  )
}

function App() {
  const [apiKey, setApiKey] = useState('')
  const [pages, setPages] = useState([])
  const [selectedPage, setSelectedPage] = useState(null)
  const [view, setView] = useState('setup')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loadingPages, setLoadingPages] = useState(false)
  const [pageError, setPageError] = useState('')

  const store = getElectronAPI()?.store || getFallbackStore()
  const notion = getElectronAPI()?.notion

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      const savedKey = await store.get('notionToken', '')

      if (!isMounted || !savedKey) {
        return
      }

      setApiKey(savedKey)
      await loadPages()
    }

    bootstrap()

    return () => {
      isMounted = false
    }
  }, [])

  async function loadPages() {
    if (!notion?.fetchPages) {
      setPageError('Electron bridge is not available. Open the desktop app to load pages.')
      return
    }

    setLoadingPages(true)
    setPageError('')

    try {
      const nextPages = await notion.fetchPages()

      setPages(nextPages)
      setSelectedPage((current) => {
        if (current) {
          const matchingPage = nextPages.find((page) => page.id === current.id)

          if (matchingPage) {
            return matchingPage
          }
        }

        return nextPages.find((page) => page.object === 'page') || nextPages[0] || null
      })
      setView('chat')
    } catch (error) {
      setPageError(error.message || 'Unable to load Notion pages.')
      setView('setup')
    } finally {
      setLoadingPages(false)
    }
  }

  async function handleSaveApiKey(nextKey = apiKey) {
    const trimmedKey = nextKey.trim()

    if (!trimmedKey) {
      setPageError('Enter a Notion API key before connecting.')
      return
    }

    setApiKey(trimmedKey)
    await store.set('notionToken', trimmedKey)
    await loadPages()
  }

  async function handleDisconnect() {
    await store.delete('notionToken')
    setApiKey('')
    setPages([])
    setSelectedPage(null)
    setPageError('')
    setView('setup')
  }

  function handleSelectPage(page) {
    setSelectedPage(page)
    setSidebarOpen(false)
  }

  function handlePageCreated(newPage) {
    setPages((current) => {
      const existing = current.filter((page) => page.id !== newPage.id)
      return [newPage, ...existing]
    })
    setSelectedPage(newPage)
  }

  if (view === 'setup') {
    return (
      <SetupScreen
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        onSave={handleSaveApiKey}
        loadingPages={loadingPages}
        pageError={pageError}
      />
    )
  }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="flex min-h-screen">
        <div
          className={`fixed inset-y-0 left-0 z-30 transition-transform duration-200 lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar
            pages={pages}
            selectedPage={selectedPage}
            onSelectPage={handleSelectPage}
            onOpenSettings={() => setView('settings')}
            onRefresh={loadPages}
            loadingPages={loadingPages}
          />
        </div>

        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[rgba(10,10,15,0.9)] px-4 py-4 backdrop-blur lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen((value) => !value)}
                className="btn-ghost px-3 py-2 lg:hidden"
              >
                Menu
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--text-muted)]">
                  {view === 'settings' ? 'Settings' : 'Workspace'}
                </p>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <span className="truncate text-lg font-semibold">
                    {selectedPage?.title || 'No page selected'}
                  </span>
                  {selectedPage ? (
                    <span className="badge hidden sm:inline-flex">
                      {selectedPage.object}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {pageError ? (
                <span className="badge-error hidden sm:inline-flex">{pageError}</span>
              ) : (
                <span className="badge-success hidden sm:inline-flex">
                  <CheckIcon size={14} />
                  {pages.length} items
                </span>
              )}

              <button
                type="button"
                onClick={loadPages}
                disabled={loadingPages}
                className="btn-ghost px-3 py-2"
              >
                <RefreshIcon size={16} />
                <span className="hidden sm:inline">{loadingPages ? 'Loading' : 'Refresh'}</span>
              </button>

              {view === 'settings' ? (
                <button
                  type="button"
                  onClick={() => setView('chat')}
                  className="btn-primary px-4 py-2"
                >
                  Back to Chat
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setView('settings')}
                  className="btn-primary px-4 py-2"
                >
                  Settings
                </button>
              )}
            </div>
          </header>

          <div className="flex-1 px-4 py-4 lg:px-6 lg:py-6">
            {view === 'chat' ? (
              <Chat
                apiKey={apiKey}
                pages={pages}
                selectedPage={selectedPage}
                onSelectPage={setSelectedPage}
                onPageCreated={handlePageCreated}
              />
            ) : (
              <Settings
                apiKey={apiKey}
                pageCount={pages.length}
                onSave={handleSaveApiKey}
                onDisconnect={handleDisconnect}
                onBack={() => setView('chat')}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
