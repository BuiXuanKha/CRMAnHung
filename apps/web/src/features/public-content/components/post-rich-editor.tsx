'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
} from 'lucide-react';
import { Icon } from '@/shared/ui/icon';
import { uploadPublicPostImage } from '../upload-image';
import './post-rich-editor.css';

type Props = {
  value: string;
  disabled?: boolean;
  onChange: (html: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  toolbarAriaLabel?: string;
  /** Used for CDN `{slug}-anh-n.webp` and img alt. */
  postTitle?: string;
  nextImageIndexRef?: { current: number };
};

export function PostRichEditor({
  value,
  disabled = false,
  onChange,
  placeholder = 'Viết nội dung bài viết… Có thể chèn ảnh giữa các đoạn.',
  ariaLabel = 'Nội dung bài viết',
  toolbarAriaLabel = 'Định dạng bài viết',
  postTitle = '',
  nextImageIndexRef,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploading = useRef(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: { class: 'pw-editor-img' },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content: value || '',
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'pw-editor-prose',
        'aria-label': ariaLabel,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useLayoutEffect(() => {
    if (!editor) return;
    // Đang gõ (đặc biệt mobile): đừng setContent từ props — dễ mất selection/bàn phím.
    if (editor.isFocused) return;
    const current = editor.getHTML();
    const next = value || '';
    // TipTap empty doc is "<p></p>" — treat as empty when syncing external HTML in.
    const currentEmpty = !current || current === '<p></p>';
    const nextEmpty = !next || next === '<p></p>';
    if (nextEmpty && currentEmpty) return;
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  const insertImage = useCallback(async (file: File) => {
    if (!editor || uploading.current) return;
    uploading.current = true;
    setImageError(null);
    try {
      const index = nextImageIndexRef?.current ?? 2;
      if (nextImageIndexRef) nextImageIndexRef.current = index + 1;
      const alt = postTitle.trim();
      const url = await uploadPublicPostImage(file, {
        title: alt,
        index,
      });
      editor.chain().focus().setImage({ src: url, alt }).run();
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Không chèn được ảnh.');
    } finally {
      uploading.current = false;
    }
  }, [editor, nextImageIndexRef, postTitle]);

  if (!editor) return <p className="crm-form-hint">Đang tải trình soạn thảo…</p>;

  return (
    <div className={disabled ? 'pw-editor is-disabled' : 'pw-editor'}>
      <div className="pw-editor-toolbar" role="toolbar" aria-label={toolbarAriaLabel}>
        <button
          type="button"
          className={editor.isActive('bold') ? 'is-active' : undefined}
          disabled={disabled}
          title="Đậm"
          aria-label="Đậm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Icon icon={Bold} size="sm" />
        </button>
        <button
          type="button"
          className={editor.isActive('italic') ? 'is-active' : undefined}
          disabled={disabled}
          title="Nghiêng"
          aria-label="Nghiêng"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Icon icon={Italic} size="sm" />
        </button>
        <button
          type="button"
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : undefined}
          disabled={disabled}
          title="Tiêu đề lớn"
          aria-label="Tiêu đề lớn"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Icon icon={Heading2} size="sm" />
        </button>
        <button
          type="button"
          className={editor.isActive('heading', { level: 3 }) ? 'is-active' : undefined}
          disabled={disabled}
          title="Tiêu đề nhỏ"
          aria-label="Tiêu đề nhỏ"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Icon icon={Heading3} size="sm" />
        </button>
        <button
          type="button"
          className={editor.isActive('bulletList') ? 'is-active' : undefined}
          disabled={disabled}
          title="Danh sách"
          aria-label="Danh sách"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <Icon icon={List} size="sm" />
        </button>
        <button
          type="button"
          className={editor.isActive('orderedList') ? 'is-active' : undefined}
          disabled={disabled}
          title="Danh sách số"
          aria-label="Danh sách số"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <Icon icon={ListOrdered} size="sm" />
        </button>
        <button
          type="button"
          disabled={disabled}
          title="Chèn ảnh"
          aria-label="Chèn ảnh"
          onClick={() => fileRef.current?.click()}
        >
          <Icon icon={ImagePlus} size="sm" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void insertImage(file);
          }}
        />
      </div>
      <EditorContent editor={editor} />
      {imageError ? <p className="crm-form-error">{imageError}</p> : null}
    </div>
  );
}
