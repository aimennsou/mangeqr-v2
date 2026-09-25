import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text
} from '@react-email/components';

const baseUrl = process.env.AUTH_URL;

interface PasswordResetProps {
  name: string | null;
  resetLink: string;
}

/**
 * Password-reset email.
 *
 * This template previously still carried the "VidQA" branding, English copy and
 * a link to the `next-auth-starter` GitHub repo it was scaffolded from — so
 * every MangeQR customer who reset their password received an email for a
 * different product. Rewritten to match `email-verification.tsx`.
 */
export function PasswordReset({ name, resetLink }: PasswordResetProps) {
  return (
    <Html>
      <Head>
        <title>Réinitialisation du mot de passe</title>
      </Head>
      <Preview>Réinitialisez le mot de passe de votre compte MangeQR</Preview>
      <Tailwind>
        <Body className='bg-white text-gray-900 font-sans'>
          <Container className='max-w-[480px] my-0 mx-auto pt-5 pb-12 px-0'>
            <Link href={baseUrl} className='flex items-center text-gray-800'>
              <Img
                src={`https://mangeqr.com/logo.png`}
                width='32'
                height='32'
                alt='MangeQR'
                className='mr-1 -ml-1'
              />
              <Heading as='h1' className='text-3xl font-bold m-0'>
                MangeQR
              </Heading>
            </Link>

            <Text className='text-xl'>
              Bonjour{' '}
              <strong>
                {typeof name === 'string' ? name : 'Utilisateur'}
              </strong>
              , une réinitialisation de mot de passe a été demandée pour votre
              compte.
            </Text>

            <Section className='p-6 border-solid border border-gray-300 rounded-md text-center'>
              <Text className='m-0 mb-3 text-left'>
                Bonjour de la part de <strong>MangeQR</strong> !
              </Text>
              <Text className='m-0 mb-3 text-left'>
                Quelqu&apos;un a récemment demandé la réinitialisation du mot de
                passe de votre compte MangeQR. Si c&apos;était bien vous,
                cliquez sur le bouton ci-dessous pour définir un nouveau mot de
                passe.
              </Text>

              <Button
                href={resetLink}
                className='text-sm font-semibold bg-gray-900 rounded-md text-white py-2 px-6'
              >
                Réinitialiser mon mot de passe
              </Button>

              <Text className='m-0 my-3 text-left'>
                Si vous ne souhaitez pas modifier votre mot de passe ou si vous
                n&apos;êtes pas à l&apos;origine de cette demande, ignorez et
                supprimez simplement ce message.
              </Text>
            </Section>

            <Text className='text-gray-500 text-xs text-center mt-5'>
              <Link href='' className='text-gray-500 font-semibold'>
                Tous droits réservés
              </Link>
              ・{' '}
              <Link
                href='https://www.mangeqr.com'
                className='underline text-gray-500 underline-offset-2'
              >
                MangeQR
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
