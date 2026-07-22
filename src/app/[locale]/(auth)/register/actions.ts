'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { NeonDbError } from '@neondatabase/serverless';
import { db } from '@/db/client';
import { users, checklistRules, type User } from '@/db/schema';
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

  let newUser: User;
  try {
    const inserted = await db
      .insert(users)
      .values({ email, passwordHash, locale: locale === 'en' ? 'en' : 'fr' })
      .returning();
    newUser = inserted[0];
  } catch (error) {
    if (error instanceof NeonDbError && error.code === '23505') {
      redirect(`/${locale}/register?error=EmailInUse`);
    }
    throw error;
  }

  await db.insert(checklistRules).values(
    DEFAULT_CHECKLIST_RULES.map((label, index) => ({
      userId: newUser.id,
      label,
      displayOrder: index,
    }))
  );

  try {
    await signIn('credentials', { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/${locale}/register?error=CredentialsSignin`);
    }
    throw error;
  }

  redirect(`/${locale}/dashboard`);
}
