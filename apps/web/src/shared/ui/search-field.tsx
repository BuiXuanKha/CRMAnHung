'use client';

import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ForwardedRef,
  type KeyboardEventHandler,
} from 'react';
import { CrmBadge } from './badge';
import './search-field.css';

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  'aria-label'?: string;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
};

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

/** List-search input with a Clear hangtag sitting just after the caret. */
export const CrmSearchField = forwardRef<HTMLInputElement, Props>(function CrmSearchField(
  { value, onValueChange, className, placeholder, onKeyDown, 'aria-label': ariaLabel },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const tagRef = useRef<HTMLButtonElement>(null);
  const [caret, setCaret] = useState(0);
  const [tagLeft, setTagLeft] = useState(8);
  const filled = value.length > 0;

  const setInputNode = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const readCaret = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    setCaret(el.selectionStart ?? el.value.length);
  }, []);

  const measure = useCallback(() => {
    const input = inputRef.current;
    const mirror = mirrorRef.current;
    if (!input || !mirror) return;

    const style = getComputedStyle(input);
    mirror.style.font = style.font;
    mirror.style.letterSpacing = style.letterSpacing;
    mirror.style.textTransform = style.textTransform;
    mirror.style.wordSpacing = style.wordSpacing;
    const pos = input.selectionStart ?? value.length;
    mirror.textContent = value.slice(0, pos);

    const prefixW = mirror.getBoundingClientRect().width;
    const padL = parseFloat(style.paddingLeft) || 0;
    const borderL = parseFloat(style.borderLeftWidth) || 0;
    const tagW = tagRef.current?.offsetWidth ?? 52;
    const gap = 4;
    const raw = padL + borderL + prefixW - input.scrollLeft + gap;
    const minX = borderL + 2;
    const maxX = Math.max(minX, input.clientWidth - tagW - 4);
    setTagLeft(Math.min(Math.max(raw, minX), maxX));

    input.style.paddingRight = filled ? `${tagW + 12}px` : '';
  }, [filled, value]);

  useLayoutEffect(() => {
    measure();
  }, [measure, caret, value]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const onScroll = () => measure();
    input.addEventListener('scroll', onScroll);

    const onSelection = () => {
      if (document.activeElement === input) readCaret();
    };
    document.addEventListener('selectionchange', onSelection);

    const ro = new ResizeObserver(() => measure());
    ro.observe(input);

    return () => {
      input.removeEventListener('scroll', onScroll);
      document.removeEventListener('selectionchange', onSelection);
      ro.disconnect();
    };
  }, [measure, readCaret]);

  function clearKeyword() {
    onValueChange('');
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  return (
    <div className={['crm-search-field', filled ? 'is-filled' : ''].filter(Boolean).join(' ')}>
      <input
        ref={setInputNode}
        className={['crm-search-field__input', className].filter(Boolean).join(' ')}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(e) => {
          onValueChange(e.target.value);
          setCaret(e.target.selectionStart ?? e.target.value.length);
        }}
        onKeyDown={onKeyDown}
        onKeyUp={readCaret}
        onClick={readCaret}
        onSelect={readCaret}
        onFocus={readCaret}
      />
      <span ref={mirrorRef} className="crm-search-field__mirror" aria-hidden />
      {filled ? (
        <button
          ref={tagRef}
          type="button"
          className="crm-search-field__clear"
          style={{ left: tagLeft }}
          aria-label="Xoá từ khoá"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={clearKeyword}
        >
          <CrmBadge tone="gray">Clear</CrmBadge>
        </button>
      ) : null}
    </div>
  );
});
