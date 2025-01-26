import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ContactForm from './contact-form';



export default function ContactDialog() {
  return (
<Dialog>
  <DialogTrigger asChild>
    <Button className='w-full bg-primary hover:bg-primary/80 text-black'>
      Contactez-nous
    </Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Envoyez-nous un message</DialogTitle>
      <DialogDescription>Nous vous répondrons bientôt</DialogDescription>
    </DialogHeader>
    <ContactForm />
  </DialogContent>
</Dialog>

  );
}
