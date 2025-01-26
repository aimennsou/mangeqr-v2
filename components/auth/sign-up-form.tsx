'use client';

import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { SignUpSchema } from '@/schemas';
import { signUp } from '@/actions/sign-up';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { CardWrapper } from '@/components/auth/card-wrapper';

export function SignUpForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');

  const form = useForm<z.infer<typeof SignUpSchema>>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirm: '',
      name: ''
    }
  });

  const onSubmit = (values: z.infer<typeof SignUpSchema>) => {
    setError('');
    setSuccess('');

    startTransition(() => {
      signUp(values).then((data) => {
        setError(data.error);
        setSuccess(data.success);
      });
    });
  };

  return (
    <CardWrapper
      headerLabel='Créer un compte'
      footerLabel='Se connecter'
      footerHref='/auth/sign-in'
      footerDesc='Vous avez déjà un compte ?'
     
    >
      <FormSuccess message={success} />
      {!success && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='sm:w-[400px] w-[300px] flex flex-col gap-5 mx-auto'>

              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder='Aimen'
                        type='text'
                        autoComplete='name'
                      >
                        <Input.Group>
                          <Input.Label>Nom</Input.Label>
                        </Input.Group>
                      </Input>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='confirm'
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
                          <Input.Label>Confirmer le mot de passe</Input.Label>
                          <Input.PasswordToggle />
                        </Input.Group>
                      </Input>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
            <FormError message={error} />
            <Button disabled={isPending} type='submit' size={"lg"} className='w-full text-black'>
              {isPending && (
                <>
                  <Loader2 className='animate-spin mr-2' size={18} />
                </>
              )}
              {!isPending && <>Créer un compte</>}
            </Button>
          </form>
        </Form>
      )}
    </CardWrapper>
  );
}