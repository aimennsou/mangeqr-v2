'use client';

import * as z from 'zod';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { SignInSchema } from '@/schemas';
import { signIn } from '@/actions/sign-in';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { CardWrapper } from '@/components/auth/card-wrapper';

export function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const urlError =
    searchParams.get('error') === 'OAuthAccountNotLinked'
      ? 'Cet email est déjà utilisé avec un autre fournisseur.'
      : '';

  const [isPending, startTransition] = useTransition();
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');

  const form = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = (values: z.infer<typeof SignInSchema>) => {
    setError('');
    setSuccess('');

    startTransition(() => {
      signIn(values, callbackUrl)
        .then((data) => {
          if (data?.error) {
            form.reset();
            setError(data.error);
          }

          if (data?.success) {
            form.reset();
            setSuccess(data.success);
          }

          if (data?.twoFactor) {
            setShowTwoFactor(true);
          }
        })
        .catch(() => setError('Oups ! Quelque chose s\'est mal passé.'));
    });
  };

  return (
    <CardWrapper
      headerLabel='Connexion'
      footerLabel='Inscription'
      footerHref='/auth/sign-up'
      footerDesc="Vous n'avez pas de compte ?"
  
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <div className='sm:w-[400px] w-[300px] flex flex-col gap-5 mx-auto'>            {/* Affichage du formulaire pour la 2FA */}
            {showTwoFactor && (
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code d'authentification à deux facteurs</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder='623456'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Affichage du formulaire sans 2FA */}
            {!showTwoFactor && (
              <>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder='nom@domaine.com'
                          type='email'
                          autoComplete='email'
                          >
                          <Input.Group>
                            <Input.Label>E-mail</Input.Label>
                          </Input.Group>
                        </Input>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder='••••••••'
                          type='password'
                          >
                          <Input.Group>
                            <Input.Label>Mot de passe</Input.Label>
                            <Input.PasswordToggle />
                          </Input.Group>
                        </Input>
                      </FormControl>
                      <FormMessage />
                      <Button
                        disabled={isPending}
                        size='sm'
                        variant='link'
                        asChild
                        className='px-0 font-normal'
                      >
                        <Link href='/auth/forgot-password'>
                          Mot de passe oublié ?
                        </Link>
                      </Button>
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
          <FormError message={error || urlError} />
          <FormSuccess message={success} />
          <Button disabled={isPending} size={"lg"} type='submit' className='w-full text-black'>
            {isPending && (
              <>
                <Loader2 className='animate-spin mr-2' size={18} />
              </>
            )}
            {!isPending && <>{showTwoFactor ? 'Confirmer' : 'Se connecter'}</>}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
}