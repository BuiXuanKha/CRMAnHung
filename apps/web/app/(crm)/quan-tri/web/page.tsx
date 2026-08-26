import { redirect } from 'next/navigation';

/** Đường cũ — chuyển sang `/dashboard`. */
export default function QuanTriWebRedirectPage() {
  redirect('/dashboard');
}
