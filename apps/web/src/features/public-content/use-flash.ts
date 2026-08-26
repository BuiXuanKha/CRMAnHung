'use client';

import { useRef, useState } from 'react';

export function useFlash(ms = 2800) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  function flash(message: string) {
    setToast(message);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), ms);
  }

  return { toast, flash };
}
