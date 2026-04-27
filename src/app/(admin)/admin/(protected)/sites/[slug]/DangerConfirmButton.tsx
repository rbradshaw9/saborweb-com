'use client';

import { Loader2, Trash2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

export function DangerConfirmButton({
  confirmMessage,
  label,
}: {
  confirmMessage: string;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="admin-btn admin-btn--secondary"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {pending ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
      {pending ? 'Deleting...' : label}
    </button>
  );
}
