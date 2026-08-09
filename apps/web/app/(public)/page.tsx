import Link from 'next/link';
import './public.css';

/**
 * Landing public — stub P0.
 * Nội dung marketing / SEO thật làm sau; giữ route `/` cho web public.
 */
export default function PublicHomePage() {
  return (
    <main className="public-home">
      <p className="public-brand">An Hưng Land</p>
      <h1>Bất động sản & CRM nội bộ</h1>
      <p className="public-lead">
        Trang công khai đang được xây dựng. Nhân viên đăng nhập để dùng CRM.
      </p>
      <div className="public-actions">
        <Link className="public-cta" href="/login">
          Đăng nhập CRM
        </Link>
      </div>
    </main>
  );
}
