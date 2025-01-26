import {
  Body,
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

interface TwoFactorAuthenticationProps {
  name: string | null;
  token: string;
}

export function TwoFactorAuthentication({
  name,
  token
}: TwoFactorAuthenticationProps) {
  return (
    <Html>
      <Head>
        <title>Authentification à deux facteurs</title>
      </Head>
      <Preview>
        Entrez le code suivant pour finaliser la connexion à votre compte MangeQR
      </Preview>
      <Tailwind>
        <Body className='bg-white text-gray-900 font-sans'>
          <Container className='max-w-[480px] my-0 mx-auto pt-5 pb-12 px-0'>
            <Link href={baseUrl} className='flex items-center text-gray-800'>
              <Img
                src={`${baseUrl}/images/logo.png`} // Remplacez par le chemin de votre logo
                width='32'
                height='32'
                className='mr-1 -ml-1'
                alt='MangeQR'
              />
              <Heading as='h1' className='text-3xl font-bold m-0'>
                MangeQR
              </Heading>
            </Link>

            <Text className='text-xl'>
              Bonjour <strong>{typeof name === 'string' ? name : 'Utilisateur'}</strong>,  
              continuez la connexion à votre compte en entrant le code suivant.
            </Text>

            <Section className='p-6 border-solid border border-gray-300 rounded-md text-center'>
              <Text className='m-0 mb-3 text-left'>
                Bienvenue chez <strong>MangeQR</strong> !
              </Text>
              <Text className='m-0 mb-3 text-left'>
                Quelqu'un a récemment tenté de se connecter à votre compte MangeQR.  
                Si c'était vous, veuillez utiliser le code ci-dessous pour finaliser la connexion.
              </Text>

              <Text className='inline-flex py-2 px-5 bg-zinc-100 rounded text-center font-bold text-xl'>
                {token}
              </Text>
            </Section>

            <Text className='text-gray-500 text-xs text-center mt-5'>
              <Link
                href='https://github.com/salimi-my/next-auth-starter' // Remplacez par un lien pertinent
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