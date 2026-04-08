import { BotIcon } from './Icons.jsx'

function actionLabel(type) {
  switch (type) {
    case 'create_page':
      return 'Created'
    case 'append_blocks':
      return 'Added'
    case 'update_page':
      return 'Updated'
    case 'search':
      return 'Searched'
    default:
      return 'Action'
  }
}

function actionBadgeClass(type) {
  switch (type) {
    case 'create_page':
    case 'append_blocks':
    case 'update_page':
      return 'badge-success'
    case 'search':
      return 'badge-warning'
    default:
      return 'badge'
  }
}

function Message({ msg }) {
  if (msg.role === 'system') {
    return (
      <div className="msg-in flex justify-center">
        <div
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            msg.success
              ? 'border border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.12)] text-[var(--success)]'
              : 'border border-[rgba(239,68,68,0.24)] bg-[rgba(239,68,68,0.12)] text-[var(--error)]'
          }`}
        >
          {msg.content}
        </div>
      </div>
    )
  }

  const isUser = msg.role === 'user'

  return (
    <div className={`msg-in flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser ? (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[rgba(99,102,241,0.14)] text-[var(--accent)]">
          <BotIcon size={18} />
        </div>
      ) : null}

      <article
        className={`max-w-3xl rounded-[1.6rem] px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ${
          isUser
            ? 'bg-[var(--accent)] text-white'
            : 'border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-7">{msg.content}</p>

        {Array.isArray(msg.actions) && msg.actions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {msg.actions.map((action, index) => (
              <span
                key={`${action.type}-${index}`}
                className={actionBadgeClass(action.type)}
              >
                {actionLabel(action.type)}
                {action.title ? `: ${action.title}` : ''}
              </span>
            ))}
          </div>
        ) : null}
      </article>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="msg-in flex justify-start gap-3">
      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[rgba(99,102,241,0.14)] text-[var(--accent)]">
        <BotIcon size={18} />
      </div>
      <div className="flex items-center gap-2 rounded-[1.6rem] border border-[var(--border)] bg-[var(--bg-tertiary)] px-4 py-4">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  )
}

export { TypingIndicator }
export default Message
