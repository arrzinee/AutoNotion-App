import { useState } from 'react'
import {
  DatabaseIcon,
  NotionIcon,
  PageIcon,
  RefreshIcon,
  SpinnerIcon,
} from './Icons.jsx'

function PageRow({ item, active, onClick }) {
  const isEmoji = item.icon && !String(item.icon).startsWith('http')

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={`flex w-full items-center gap-3 border-l-2 px-3 py-2 text-left transition ${
        active
          ? 'sidebar-active border-l-[var(--accent)]'
          : 'border-l-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-tertiary)] text-sm">
        {isEmoji ? (
          item.icon
        ) : item.object === 'database' ? (
          <DatabaseIcon size={16} />
        ) : (
          <PageIcon size={16} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.title || 'Untitled'}</span>
        <span className="block text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {item.object}
        </span>
      </span>
    </button>
  )
}

function Sidebar({
  pages = [],
  selectedPage,
  onSelectPage,
  onOpenSettings,
  onRefresh,
  loadingPages,
}) {
  const [search, setSearch] = useState('')

  const filteredPages = pages.filter((page) => {
    const haystack = `${page.title} ${page.object}`.toLowerCase()
    return haystack.includes(search.trim().toLowerCase())
  })

  const groupedPages = filteredPages.filter((page) => page.object !== 'database')
  const groupedDatabases = filteredPages.filter((page) => page.object === 'database')

  return (
    <aside className="flex h-screen w-[82vw] max-w-[280px] min-w-[220px] flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="border-b border-[var(--border)] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(99,102,241,0.12)] text-[var(--accent)]">
            <NotionIcon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
              AutoNotion
            </p>
            <p className="truncate text-sm text-[var(--text-secondary)]">
              Browse your synced workspace
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search pages"
            className="input-base min-w-0 text-sm"
          />
          <button
            type="button"
            onClick={onRefresh}
            disabled={loadingPages}
            className="btn-ghost shrink-0 px-3 py-2"
          >
            {loadingPages ? <SpinnerIcon size={16} /> : <RefreshIcon size={16} />}
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="btn-ghost mt-3 w-full justify-center text-sm"
        >
          Settings
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4">
        <div className="mb-5">
          <p className="px-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Pages
          </p>
          <div className="mt-2 space-y-1">
            {groupedPages.length > 0 ? (
              groupedPages.map((page) => (
                <PageRow
                  key={page.id}
                  item={page}
                  active={selectedPage?.id === page.id}
                  onClick={onSelectPage}
                />
              ))
            ) : (
              <p className="px-2 py-3 text-sm text-[var(--text-muted)]">No pages found.</p>
            )}
          </div>
        </div>

        <div>
          <p className="px-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Databases
          </p>
          <div className="mt-2 space-y-1">
            {groupedDatabases.length > 0 ? (
              groupedDatabases.map((page) => (
                <PageRow
                  key={page.id}
                  item={page}
                  active={selectedPage?.id === page.id}
                  onClick={onSelectPage}
                />
              ))
            ) : (
              <p className="px-2 py-3 text-sm text-[var(--text-muted)]">
                No databases found.
              </p>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--text-secondary)]">
        {pages.length} item{pages.length === 1 ? '' : 's'} synced
      </footer>
    </aside>
  )
}

export default Sidebar
