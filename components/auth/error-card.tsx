import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

import { CardWrapper } from '@/components/auth/card-wrapper';

export default function ErrorCard() {
  return (
    <CardWrapper
      headerLabel='Oops!!'
      footerLabel='Précedent.'
      footerHref='/auth/sign-in'
      footerDesc='Revenir a la page de connexion'
    >
      <div className='w-full flex justify-center items-center'>
        <ExclamationTriangleIcon className='text-destructive w-16 h-auto' />
      </div>
    </CardWrapper>
  );
}
