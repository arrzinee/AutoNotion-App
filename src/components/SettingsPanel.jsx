function SettingsPanel({ eyebrow, title, description, children, footer }) {
  return (
    <section className="rounded-[1.75rem] border border-stone-950/8 bg-white/72 p-5 shadow-[0_18px_60px_rgba(82,59,26,0.08)]">
      <div className="mb-5 space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-stone-500">
          {eyebrow}
        </p>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-stone-950">
            {title}
          </h2>
          <p className="max-w-xl text-sm leading-7 text-stone-600">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-4">{children}</div>

      {footer ? (
        <div className="mt-5 border-t border-stone-950/8 pt-4">{footer}</div>
      ) : null}
    </section>
  )
}

export default SettingsPanel
