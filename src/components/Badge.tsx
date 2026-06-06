interface BadgeProps {
  status: string;
  children?: React.ReactNode;
}

const statusStyles: Record<string, string> = {
  active: 'bg-[rgba(22,163,74,0.1)] text-[#16a34a] border-[rgba(22,163,74,0.3)]',
  inactive: 'bg-[rgba(202,138,4,0.1)] text-[#ca8a04] border-[rgba(202,138,4,0.3)]',
  exited: 'bg-[rgba(220,38,38,0.1)] text-[#dc2626] border-[rgba(220,38,38,0.3)]',
  pending: 'bg-[rgba(217,119,6,0.1)] text-[#d97706] border-[rgba(217,119,6,0.3)]',
  validated: 'bg-[rgba(8,145,178,0.1)] text-[#0891b2] border-[rgba(8,145,178,0.3)]',
  certified: 'bg-[rgba(8,145,178,0.1)] text-[#0891b2] border-[rgba(8,145,178,0.3)]',
  completed: 'bg-[rgba(22,163,74,0.1)] text-[#16a34a] border-[rgba(22,163,74,0.3)]',
  failed: 'bg-[rgba(220,38,38,0.1)] text-[#dc2626] border-[rgba(220,38,38,0.3)]',
  submitted: 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6] border-[rgba(59,130,246,0.3)]',
  under_review: 'bg-[rgba(139,92,246,0.1)] text-[#8b5cf6] border-[rgba(139,92,246,0.3)]',
  rejected: 'bg-[rgba(220,38,38,0.1)] text-[#dc2626] border-[rgba(220,38,38,0.3)]',
  draft: 'bg-[rgba(107,114,128,0.1)] text-[#6b7280] border-[rgba(107,114,128,0.3)]',
  processing: 'bg-[rgba(8,145,178,0.1)] text-[#0891b2] border-[rgba(8,145,178,0.3)]',
  open: 'bg-[rgba(22,163,74,0.1)] text-[#16a34a] border-[rgba(22,163,74,0.3)]',
  locked: 'bg-[rgba(202,138,4,0.1)] text-[#ca8a04] border-[rgba(202,138,4,0.3)]',
  closed: 'bg-[rgba(107,114,128,0.1)] text-[#6b7280] border-[rgba(107,114,128,0.3)]',
  approved: 'bg-[rgba(22,163,74,0.1)] text-[#16a34a] border-[rgba(22,163,74,0.3)]',
  add: 'bg-[rgba(22,163,74,0.1)] text-[#16a34a] border-[rgba(22,163,74,0.3)]',
  edit: 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6] border-[rgba(59,130,246,0.3)]',
  delete: 'bg-[rgba(220,38,38,0.1)] text-[#dc2626] border-[rgba(220,38,38,0.3)]',
  override: 'bg-[rgba(217,119,6,0.1)] text-[#d97706] border-[rgba(217,119,6,0.3)]',
  view: 'bg-[rgba(107,114,128,0.1)] text-[#6b7280] border-[rgba(107,114,128,0.3)]',
  submit: 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6] border-[rgba(59,130,246,0.3)]',
  validate: 'bg-[rgba(8,145,178,0.1)] text-[#0891b2] border-[rgba(8,145,178,0.3)]',
  execute: 'bg-[rgba(22,163,74,0.1)] text-[#16a34a] border-[rgba(22,163,74,0.3)]',
  create: 'bg-[rgba(22,163,74,0.1)] text-[#16a34a] border-[rgba(22,163,74,0.3)]',
  unlock_certified: 'bg-[rgba(217,119,6,0.1)] text-[#d97706] border-[rgba(217,119,6,0.3)]',
  override_duplicate: 'bg-[rgba(139,92,246,0.1)] text-[#8b5cf6] border-[rgba(139,92,246,0.3)]',
  emergency_batch: 'bg-[rgba(220,38,38,0.1)] text-[#dc2626] border-[rgba(220,38,38,0.3)]',
};

export default function Badge({ status, children }: BadgeProps) {
  const style = statusStyles[status.toLowerCase()] || statusStyles['draft'];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${style}`}>
      {children || status}
    </span>
  );
}
