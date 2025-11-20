import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { OrdenPageClient } from './components/OrdenPageClient';

export default async function OrdenPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Asegurar que session.user tenga los campos necesarios
  const safeSession = {
    ...session,
    user: {
      ...session.user,
      name: session.user.name || session.user.email || 'Usuario',
      email: session.user.email || '',
      role: session.user.role || 'user',
      department: session.user.department,
    },
  };

  return <OrdenPageClient session={safeSession} />;
}
