'use server';

import * as z from 'zod';
import bcrypt from 'bcryptjs';

import { db } from '@/lib/db';
import { SignUpSchema } from '@/schemas';
import { getUserByEmail } from '@/data/user';
import { sendVerificationEmail } from '@/lib/mail';
import { generateVerificationToken } from '@/lib/tokens';
import { FREE_TRIAL_DAYS } from '@/lib/plan';

export async function signUp(values: z.infer<typeof SignUpSchema>) {
  const validatedFields = SignUpSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid fields.' };
  }

  const { email, password, name } = validatedFields.data;

  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: 'Email already exist.' };
  }

  // New accounts start on the FREE trial (schema default) with a 30-day expiry
  // (FREE_TRIAL_DAYS). After that the owner must move to a paid plan.
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + FREE_TRIAL_DAYS);

  const newUser = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      plan: 'FREE',
      planRenewsAt: trialEndsAt
    }
  });

  if (!newUser || !newUser.email) {
    return { error: 'Oops! Something went wrong.' };
  }

  const verificationToken = await generateVerificationToken(newUser.id);

  await sendVerificationEmail(
    newUser.name,
    newUser.email,
    verificationToken.token
  );

  return {
    success: 'Sign up successful. Check your email to verify.'
  };
}
