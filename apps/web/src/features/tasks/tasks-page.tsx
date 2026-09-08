'use client';

import { ListTodo } from 'lucide-react';
import { Icon } from '@/shared/ui/icon';
import './tasks-page.css';

export function TasksPage() {
  return (
    <section className="cv-page" aria-labelledby="cv-title">
      <header className="cv-head">
        <h1 id="cv-title">Công việc</h1>
        <p className="cv-lead">Trang nhắc việc và ghi chú nhỏ cho việc cần làm.</p>
      </header>
      <div className="cv-empty">
        <Icon icon={ListTodo} size="md" />
        <p>Chưa có công việc.</p>
        <p>Cách tạo việc và lời nhắc sẽ bàn sau.</p>
      </div>
    </section>
  );
}
