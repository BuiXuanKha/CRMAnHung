'use client';

import { FileText } from 'lucide-react';
import { PublicPostStatus, type PublicWebPostRow } from '@crmanhung/shared';
import { CrmConfirmDialog } from '@/shared/ui/dialog';

type Props = {
  post: PublicWebPostRow | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function PostStatusConfirm({ post, busy, onCancel, onConfirm }: Props) {
  const publishing = Boolean(post && post.status !== PublicPostStatus.PUBLISHED);

  return (
    <CrmConfirmDialog
      open={Boolean(post)}
      title={publishing ? 'Xuất bản bài viết' : 'Gỡ bài về nháp'}
      icon={FileText}
      message={
        post
          ? publishing
            ? `Xuất bản «${post.title}»? Khách sẽ đọc được bài này.`
            : `Gỡ «${post.title}» về nháp? Khách sẽ không còn thấy bài.`
          : ''
      }
      confirmLabel={publishing ? 'Xuất bản' : 'Về nháp'}
      danger={!publishing}
      busy={busy}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
