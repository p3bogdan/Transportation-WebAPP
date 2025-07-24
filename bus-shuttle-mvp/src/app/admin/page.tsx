import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminPanel from '../../components/AdminPanel';

export default function AdminPage() {
  const cookieStore = cookies();
  const isAuthed = cookieStore.get('admin_auth')?.value === '1';
  if (!isAuthed) {
    redirect('/admin/login');
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 16 }}>
      <AdminPanel />
    </main>
  );
}
