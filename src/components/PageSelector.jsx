import { useEffect, useRef, useState } from 'react'
import { DatabaseIcon, PageIcon } from './Icons.jsx'

function PageSelector({ pages = [], onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const inputRef = useRef(null)

  const filteredPages = pages.filter((page) => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return true
    }

    return `${page.title} ${page.object}`.toLowerCase().includes(query)
  })

  useEffect(() => {
    inputRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="glass w-full max-w-md rounded-[1.75rem] border border-[var(--border-light)] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.42)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Page selector
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            Choose a page
          </h2>
        </div>

        <input
          ref={inputRef}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search pages or databases"
          className="input-base"
        />

        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
          {filteredPages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelect(page)}
              className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-3 text-left transition hover:border-[var(--accent)] hover:bg-[var(--bg-hover)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(99,102,241,0.12)] text-[var(--accent)]">
                {page.object === 'database' ? (
                  <DatabaseIcon size={16} />
                ) : (
                  <PageIcon size={16} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                  {page.title || 'Untitled'}
                </span>
                <span className="block text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {page.object}
                </span>
              </span>
            </button>
          ))}

          {filteredPages.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">
              No matching pages.
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end border-t border-[var(--border)] pt-4">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default PageSelector
