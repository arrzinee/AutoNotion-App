const statusStyles = {
  success: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  danger: 'bg-rose-100 text-rose-900 border-rose-200',
}

function StatusPill({ status = 'pending', label }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
        statusStyles[status] || statusStyles.pending
      }`}
    >
      {label}
    </span>
  )
}

export default StatusPill
