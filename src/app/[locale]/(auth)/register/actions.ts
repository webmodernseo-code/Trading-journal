'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { db } from '@/db/client';
import { users, checklistRules } from '@/db/schema';
import { DEFAULT_CHECKLIST_RULES } from '@/lib/checklist-seed';
import { signIn } from '@/auth';

export async function registerAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const locale = String(formData.get('locale') ?? 'fr');

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [newUser] = await db
    .insert(users)
    .values({ email, passwordHash, locale: locale === 'en' ? 'en' : 'fr' })
    .returning();

  await db.insert(checklistRules).values(
    DEFAULT_CHECKLIST_RULES.map((label, index) => ({
      userId: newUser.id,
      label,
      displayOrder: index,
    }))
  );

  await signIn('credentials', { email, password, redirect: false });
  redirect(`/${locale}/dashboard`);
}
