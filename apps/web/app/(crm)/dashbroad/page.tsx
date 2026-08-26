import { redirect } from 'next/navigation';

/** Alias gõ sai — chuyển sang `/dashboard`. */
export default function DashbroadAliasPage() {
  redirect('/dashboard');
}
