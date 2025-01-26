'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { RotateCcw, RotateCw, Send } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { type z } from 'zod';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { sendEmail } from '@/actions/send-email';
import { ContactFormSchema } from '@/lib/schemas';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Inputs = z.infer<typeof ContactFormSchema>;

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Inputs>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });
  const processForm: SubmitHandler<Inputs> = async (data) => {
    try {
      const result = await sendEmail(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Message envoyé avec succès !');
      reset();
    } catch (err) {
      console.error(err);
      toast.error('Échec de l\'envoi du message. Veuillez réessayer.');
    }
    reset();
  };

  return (
    <form onSubmit={handleSubmit(processForm)}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="h-16">
          <Input
            id="name"
            type="text"
            placeholder="Nom"
            autoComplete="name"
            {...register('name')}
          />
          {errors.name?.message && (
            <p className="input-error">{errors.name.message}</p>
          )}
        </div>
        <div className="h-16">
          <Input
            id="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            {...register('email')}
          />

          {errors.email?.message && (
            <p className="input-error">{errors.email.message}</p>
          )}
        </div>
        <div className="h-32 sm:col-span-2">
          <Textarea
            rows={4}
            placeholder="Comment pouvons-nous vous aider ?"
            autoComplete="Message"
            className="resize-none  "
            {...register('message')}
          />

          {errors.message?.message && (
            <p className="input-error">{errors.message.message}</p>
          )}
        </div>
      </div>
      <div className="mt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full  bg-primary hover:bg-primary/80 text-black disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <span>Envoi...</span>
              <RotateCw className="ml-2 animate-spin" />
            </div>
          ) : (
            <div className="flex items-center">
              <span>Envoyer le message</span>
              <Send className="ml-2" />
            </div>
          )}
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          En soumettant ce formulaire, j&apos;accepte la{' '}
          <Popover>
            <PopoverTrigger> politique&nbsp;de confidentialité.</PopoverTrigger>
            <PopoverContent>
              Lorsque vous nous contactez par email ou via notre formulaire de contact, vous décidez quelles informations partager. Nous les utiliserons uniquement pour répondre et engager une conversation—pas de gimmicks, juste une communication sincère.
            </PopoverContent>
          </Popover>
        </p>
      </div>
    </form>
  );
}
