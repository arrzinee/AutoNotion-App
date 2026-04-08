import { useEffect, useRef, useState } from 'react'
import { CheckIcon, NotionIcon, SendIcon } from './Icons.jsx'
import Message, { TypingIndicator } from './Message.jsx'

const suggestionPrompts = [
  'Create a daily standup page for today',
  'Summarize this week into action items',
  'Search for sprint planning notes',
]

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const initialMessages = [
  {
    id: 'assistant-greeting',
    role: 'assistant',
    content:
      'Hi, I can create pages, update a selected page, append structured blocks, or search your Notion workspace. Tell me what you want to do.',
  },
]

function Chat({
  apiKey,
  pages,
  selectedPage,
  onSelectPage,
  onPageCreated,
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = '0px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`
  }, [input])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  function appendMessage(message) {
    setMessages((current) => [...current, message])
  }

  async function executeAction(action) {
    const notion = window.electronAPI?.notion

    if (!notion) {
      throw new Error('Electron Notion bridge is unavailable.')
    }

    switch (action.type) {
      case 'create_page': {
        const { buildBlocks } = await import('../utils/blockBuilder.js')
        const content = Array.isArray(action.blocks) ? buildBlocks(action.blocks) : []
        const parentId =
          action.parentId ||
          (selectedPage ? selectedPage.id : undefined)
        const parentType =
          action.parentType ||
          (selectedPage
            ? selectedPage.object === 'database'
              ? 'database_id'
              : 'page_id'
            : undefined)

        const newPage = await notion.createPage({
          title: action.title,
          icon: action.icon,
          parentId,
          parentType,
          content,
          properties: action.properties || {},
        })

        onPageCreated(newPage)

        return {
          type: 'create_page',
          title: newPage.title || action.title || 'New page',
        }
      }

      case 'append_blocks': {
        const targetPageId = action.pageId || selectedPage?.id

        if (!targetPageId) {
          throw new Error('Select a page before adding blocks.')
        }

        const { buildBlocks } = await import('../utils/blockBuilder.js')
        const blocks = buildBlocks(action.blocks || [])

        await notion.appendBlocks({
          pageId: targetPageId,
          blocks,
        })

        return {
          type: 'append_blocks',
          title: `${blocks.length} block${blocks.length === 1 ? '' : 's'}`,
        }
      }

      case 'update_page': {
        const targetPageId = action.pageId || selectedPage?.id

        if (!targetPageId) {
          throw new Error('Select a page before updating it.')
        }

        const updatedPage = await notion.updatePage({
          pageId: targetPageId,
          title: action.title,
          icon: action.icon,
          archived: action.archived,
          properties: action.properties,
        })

        if (selectedPage?.id === updatedPage.id) {
          onSelectPage(updatedPage)
        }

        return {
          type: 'update_page',
          title: updatedPage.title || action.title || 'Updated page',
        }
      }

      case 'search': {
        const results = await notion.search({
          query: action.query || '',
        })

        if (results.length === 1) {
          onSelectPage(results[0])
        }

        return {
          type: 'search',
          title: `${results.length} result${results.length === 1 ? '' : 's'}`,
        }
      }

      default:
        return {
          type: action.type || 'action',
          title: action.title || 'Completed',
        }
    }
  }

  async function handleSend(forcedInput) {
    const text = String(forcedInput ?? input).trim()

    if (!text || loading) {
      return
    }

    appendMessage({
      id: makeId('user'),
      role: 'user',
      content: text,
    })
    setInput('')
    setLoading(true)

    try {
      const response = await window.electronAPI?.gemini?.run(text, {
        pages,
        selectedPage,
        today: new Date().toISOString().slice(0, 10),
      })

      if (!response) {
        throw new Error('Gemini did not return a response.')
      }

      if (response.needsClarification) {
        appendMessage({
          id: makeId('assistant'),
          role: 'assistant',
          content:
            response.clarificationQuestion ||
            'I need a little more detail before I can continue.',
        })
        return
      }

      const successfulActions = []
      const actionErrors = []

      for (const action of response.actions || []) {
        try {
          const outcome = await executeAction(action)
          successfulActions.push(outcome)
        } catch (error) {
          actionErrors.push(error.message || 'Action failed.')
        }
      }

      appendMessage({
        id: makeId('assistant'),
        role: 'assistant',
        content:
          response.humanResponse ||
          'I finished processing your request.',
        actions: successfulActions,
      })

      if (actionErrors.length > 0) {
        appendMessage({
          id: makeId('system'),
          role: 'system',
          content: actionErrors.join(' '),
          success: false,
        })
      }
    } catch (error) {
      appendMessage({
        id: makeId('system'),
        role: 'system',
        content: error.message || 'Something went wrong while processing your request.',
        success: false,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="glass flex min-h-[calc(100vh-8.5rem)] flex-col rounded-[2rem] border border-[var(--border)] shadow-[0_24px_90px_rgba(0,0,0,0.24)]">
      <header className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
            Assistant
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            Chat with your workspace
          </h2>
        </div>

        <span className="badge-success">
          <CheckIcon size={14} />
          {apiKey ? 'Connected' : 'No key'}
        </span>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((message) => (
          <Message key={message.id} msg={message} />
        ))}
        {loading ? <TypingIndicator /> : null}
        <div ref={bottomRef} />
      </div>

      <footer className="border-t border-[var(--border)] px-5 py-4">
        {messages.length <= 1 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestionPrompts.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSend(suggestion)}
                className="badge cursor-pointer border border-[var(--border-light)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        {selectedPage ? (
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelectPage(null)}
              className="badge-warning"
            >
              <NotionIcon size={12} />
              {selectedPage.title || 'Selected page'}
              <span className="text-[10px]">x</span>
            </button>
          </div>
        ) : null}

        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask AutoNotion to create, search, or update something..."
            className="input-base min-h-[56px] flex-1 resize-none overflow-hidden"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="btn-primary self-end px-5 py-4"
          >
            <SendIcon size={18} />
          </button>
        </div>
      </footer>
    </section>
  )
}

export default Chat
