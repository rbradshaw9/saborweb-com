'use client';

import { Check, Clipboard, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';

export function BuildPacketCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      className="admin-btn admin-btn--secondary"
      disabled={!text}
      onClick={copy}
      type="button"
    >
      {copied ? <Check size={15} /> : <Clipboard size={15} />}
      {copied ? 'Copied' : 'Copy brief'}
    </button>
  );
}

export function BuildPacketGenerateButton({ isReady }: { isReady: boolean }) {
  const { pending } = useFormStatus();
  const Icon = pending ? Loader2 : isReady ? RefreshCw : Sparkles;

  return (
    <button
      aria-live="polite"
      className="admin-btn admin-btn--primary"
      disabled={pending}
      type="submit"
    >
      <Icon className={pending ? 'animate-spin' : undefined} size={15} />
      {pending ? 'Refreshing build brief...' : isReady ? 'Regenerate brief' : 'Generate build brief'}
    </button>
  );
}
