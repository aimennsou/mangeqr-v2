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

interface EmailVerificationProps {
  name: string | null;
  verifyLink: string;
}

export function EmailVerification({
  name,
  verifyLink
}: EmailVerificationProps) {
  return (
    <Html>
      <Head>
        <title>Vérification de l'adresse e-mail</title>
      </Head>
      <Preview>Vérifiez votre adresse e-mail pour activer votre compte MangeQR</Preview>
      <Tailwind>
        <Body className='bg-white text-gray-900 font-sans'>
          <Container className='max-w-[480px] my-0 mx-auto pt-5 pb-12 px-0'>
            <Link href={baseUrl} className='flex items-center text-gray-800'>
              <Img
                src={`https://mangeqr.com/logo.png`} // Remplacez par le chemin de votre logo
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
              Bonjour <strong>{typeof name === 'string' ? name : 'Utilisateur'}</strong>,  
              un compte a été créé avec votre adresse e-mail.
            </Text>

            <Section className='p-6 border-solid border border-gray-300 rounded-md text-center'>
              <Text className='m-0 mb-3 text-left'>
                Bienvenue chez <strong>MangeQR</strong> !
              </Text>
              <Text className='m-0 mb-3 text-left'>
                Un compte MangeQR a été créé avec votre adresse e-mail.  
                Nous souhaitons nous assurer qu'il s'agit bien de vous. Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse e-mail.
              </Text>

              <Button
                href={verifyLink}
                className='text-sm font-semibold bg-green-500 rounded-md text-white py-2 px-6'
              >
                Vérifier
              </Button>
            </Section>

            <Text className='text-gray-500 text-xs text-center mt-5'>
              <Link
                href=''
                className='text-gray-500 font-semibold'
              >
                Tous droits réservés
              </Link>
              ・ {' '}
              <Link
                href='https://www.mangeqr.com' // Remplacez par l'URL de votre site
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