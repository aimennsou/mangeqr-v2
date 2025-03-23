'use client';

import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { UserRole } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { UpdateProfileSchema } from '@/schemas';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { updateProfile } from '@/actions/update-profile';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cancelNewEmail } from '@/actions/cancel-new-email';
import { toast } from 'sonner';

export default function UpdateProfileForm() {
  const user = useCurrentUser();
  const { update } = useSession();

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof UpdateProfileSchema>>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.tempEmail ? user.tempEmail : user?.email || '',
      role: user?.role || 'USER',
      isTwoFactorEnabled: user?.isTwoFactorEnabled || false
    }
  });

  const onSubmit = (values: z.infer<typeof UpdateProfileSchema>) => {
    startTransition(() => {
      updateProfile(values)
        .then((data) => {
          if (data.error) {
            toast.error(data.error);
          }

          if (data.success) {
            update();
            toast.success(data.success);
          }
        })
        .catch(() => toast.error('Oups ! Quelque chose s\'est mal passé.'));
    });
  };

  const onCancelEmailUpdate = () => {
    startTransition(() => {
      cancelNewEmail()
        .then((data) => {
          if (data.error) {
            toast.error(data.error);
          }

          if (data.success) {
            update();
            toast.success(data.success);
            form.reset();
          }
        })
        .catch(() => toast.error('Oups ! Quelque chose s\'est mal passé.'));
    });
  };

  return (
    <Form {...form}>
      <form className='space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
        <div className='space-y-4'>
          <div className='flex flex-row items-center justify-between rounded-md border px-3 py-1.5'>
            <p className='text-sm font-medium'>ID</p>
            <p className='truncate text-xs max-w-[200px] font-mono px-2 bg-zinc-100 dark:bg-zinc-700 rounded-sm'>
              {user?.id}
            </p>
          </div>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='John Doe'
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {user?.isOAuth === false && (
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <div className='gap-2'>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder='nom@domaine.com'
                        disabled={isPending || !!user.tempEmail}
                      />
                    </FormControl>
                    {!!user.tempEmail && (
                      <Button
                      className='bg-gradient_indigo-purple'
                        type='button'
                        onClick={onCancelEmailUpdate}
                        disabled={isPending}
                      >
                        Annuler
                      </Button>
                    )}
                  </div>
                  {!!user.tempEmail && (
                    <FormDescription>
                      Veuillez vérifier votre nouvelle adresse e-mail ou annuler pour utiliser l'ancienne adresse e-mail.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name='role'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rôle</FormLabel>
                <Select
                  disabled={isPending}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Sélectionner un rôle' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                    <SelectItem value={UserRole.USER}>Utilisateur</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {user?.isOAuth === false && (
            <FormField
              control={form.control}
              name='isTwoFactorEnabled'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                  <div className='space-y-0.5'>
                    <FormLabel>Authentification à deux facteurs</FormLabel>
                    <FormDescription>
                      Activez l'authentification à deux facteurs pour votre compte
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      disabled={isPending}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>
        <Button disabled={isPending} type='submit' className='text-black'>
          {isPending && (
            <>
              <Loader2 className='animate-spin mr-2' size={18} />
              Enregistrement...
            </>
          )}
          {!isPending && <>Enregistrer</>}
        </Button>
      </form>
    </Form>
  );
}