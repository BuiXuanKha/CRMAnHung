'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TaskTargetType,
  TitleServiceMoneyKind,
  TitleServiceStatus,
} from '@crmanhung/shared';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import { CrmBadge } from '@/shared/ui/badge';
import { useCreateTaskModal } from '@/features/tasks/use-create-task-modal';
import {
  addTitleServiceAttachment,
  addTitleServiceMoney,
  addTitleServiceProgress,
  getTitleService,
  getTitleServiceAttachmentUrl,
  pinTitleService,
  updateTitleService,
} from './api';
import { ActionDialogs, type DialogKind } from './components/action-dialogs';
import { TitleServiceDetailBody } from './components/detail-body';
import { TitleServiceDetailFab } from './components/title-service-detail-fab';
import { statusLabel, statusTone } from './display';
import './title-service-detail.css';
import './title-services-panel.css';
import '@/shared/ui/money.css';

export function TitleServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const qc = useQueryClient();
  const id = params.id;
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(null);

  const q = useQuery({
    queryKey: ['title-service', id],
    queryFn: () => getTitleService(id),
    enabled: Boolean(id),
  });
  const d = q.data ?? null;

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ['title-services'] });
    await qc.invalidateQueries({ queryKey: ['title-service', id] });
  }

  const { openTaskModal, dialog: createTaskDialog } = useCreateTaskModal(() => {
    void refresh();
  });

  const pinMut = useMutation({
    mutationFn: () => {
      if (!d) throw new Error('Thiếu hồ sơ.');
      return pinTitleService(d.id, { pinned: !d.isPinned });
    },
    onSuccess: async (updated) => {
      await refresh();
      flash(updated.isPinned ? `Đã ghim ${updated.code}.` : `Đã bỏ ghim ${updated.code}.`);
    },
    onError: (err) => {
      setAlertBox({
        title: 'Không ghim được hồ sơ',
        message: (err as Error).message,
      });
    },
  });

  async function runDialog(work: () => Promise<void>) {
    setDialogBusy(true);
    setDialogError(null);
    try {
      await work();
    } catch (err) {
      setDialogError((err as Error).message);
    } finally {
      setDialogBusy(false);
    }
  }

  async function openAttachment(attachmentId: string) {
    if (!id) return;
    try {
      const { url } = await getTitleServiceAttachmentUrl(id, attachmentId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setAlertBox({
        title: 'Không mở được tài liệu',
        message: (err as Error).message,
      });
    }
  }

  async function restoreCase() {
    if (!d) return;
    try {
      await updateTitleService(d.id, { status: TitleServiceStatus.DANG_LAM });
      await refresh();
      flash(`Đã khôi phục ${d.code} về Đang làm.`);
    } catch (err) {
      setAlertBox({
        title: 'Không khôi phục được hồ sơ',
        message: (err as Error).message,
      });
    }
  }

  return (
    <div className={d ? 'sd-detail-page has-fab' : 'sd-detail-page'}>
      <div className="sd-detail-inner">
        <Link href="/dich-vu-so-do" scroll={false} className="sd-detail-back">
          ← Dịch vụ sổ đỏ
        </Link>

        {q.isLoading ? <p className="sd-detail-state">Đang tải…</p> : null}
        {q.error ? <p className="sd-detail-state error">{(q.error as Error).message}</p> : null}

        {d ? (
          <>
            <header className="sd-detail-hero">
              <h1>{d.customerName}</h1>
              <CrmBadge tone={statusTone(d.status)}>{statusLabel(d.status)}</CrmBadge>
              <p className="sd-detail-hero-sub">
                {d.code}
                {d.primaryPhone ? ` · ${d.primaryPhone}` : ''}
              </p>
            </header>
            <div className="sd-detail-case">
              <TitleServiceDetailBody
                detail={d}
                onAddProgress={() => {
                  setDialogError(null);
                  setDialog('progress');
                }}
                onAddAttach={() => {
                  setDialogError(null);
                  setDialog('attach');
                }}
                onAddThu={() => {
                  setDialogError(null);
                  setDialog('thu');
                }}
                onAddChi={() => {
                  setDialogError(null);
                  setDialog('chi');
                }}
                onOpenAttachment={(attachmentId) => {
                  void openAttachment(attachmentId);
                }}
              />
            </div>
          </>
        ) : null}
      </div>

      {d ? (
        <TitleServiceDetailFab
          detail={d}
          onAddTask={() => {
            openTaskModal({
              type: TaskTargetType.TITLE_SERVICE,
              id: d.id,
              label: d.customerName,
            });
          }}
          onPin={() => {
            void pinMut.mutateAsync();
          }}
          onEdit={() => {
            setDialogError(null);
            setDialog('edit');
          }}
          onRestore={() => {
            void restoreCase();
          }}
        />
      ) : null}

      <ActionDialogs
        kind={dialog}
        item={d}
        busy={dialogBusy}
        error={dialogError}
        onClose={() => {
          setDialog(null);
          setDialogError(null);
        }}
        onSubmitProgress={async (stepType, note, happenedAt) => {
          if (!d) return;
          await runDialog(async () => {
            await addTitleServiceProgress(d.id, { stepType, note, happenedAt });
            setDialog(null);
            await refresh();
            flash('Đã thêm tiến độ.');
          });
        }}
        onSubmitMoney={async (kind, title, amountVnd, happenedAt) => {
          if (!d) return;
          await runDialog(async () => {
            await addTitleServiceMoney(d.id, { kind, title, amountVnd, happenedAt });
            setDialog(null);
            await refresh();
            flash(kind === TitleServiceMoneyKind.THU ? 'Đã nhập thu.' : 'Đã nhập chi phí.');
          });
        }}
        onSubmitAttach={async (kind, file) => {
          if (!d) return;
          await runDialog(async () => {
            await addTitleServiceAttachment(d.id, { kind, file });
            setDialog(null);
            await refresh();
            flash('Đã thêm tài liệu.');
          });
        }}
        onSubmitEdit={async (nextStatus, agreedFeeVnd, needSummary, note) => {
          if (!d) return;
          await runDialog(async () => {
            await updateTitleService(d.id, {
              status: nextStatus,
              agreedFeeVnd,
              needSummary,
              note,
            });
            setDialog(null);
            await refresh();
            flash('Đã cập nhật hồ sơ.');
          });
        }}
      />

      {createTaskDialog}
      <CrmToast message={toast} />
      <CrmAlertDialog
        open={Boolean(alertBox)}
        title={alertBox?.title ?? ''}
        message={alertBox?.message ?? ''}
        onClose={() => setAlertBox(null)}
      />
    </div>
  );
}
