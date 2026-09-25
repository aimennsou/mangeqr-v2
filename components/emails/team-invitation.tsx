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

interface TeamInvitationProps {
  /** Invitee's name when the owner prefilled it. */
  name: string | null;
  /** The inviting workspace owner's name, when known. */
  ownerName: string | null;
  /** The 8-character invite code, shown so it can also be typed manually. */
  code: string;
  /** Link to the public invite landing (/team/invite?code=…). */
  inviteLink: string;
}

/**
 * Workspace invitation email.
 *
 * `Invitation.inviteeEmail` was already being collected when the owner created
 * an invite, but nothing ever sent anything — the owner had to copy the link out
 * of the UI and share it themselves. This is the missing half of that flow.
 */
export function TeamInvitation({
  name,
  ownerName,
  code,
  inviteLink
}: TeamInvitationProps) {
  const inviter = ownerName?.trim() ? ownerName : 'Un restaurateur';

  return (
    <Html>
      <Head>
        <title>Invitation à rejoindre une équipe MangeQR</title>
      </Head>
      <Preview>
        {inviter} vous invite à rejoindre son équipe sur MangeQR
      </Preview>
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
                {typeof name === 'string' && name ? name : 'et bienvenue'}
              </strong>
              , <strong>{inviter}</strong> vous invite à rejoindre son équipe
              sur MangeQR.
            </Text>

            <Section className='p-6 border-solid border border-gray-300 rounded-md text-center'>
              <Text className='m-0 mb-3 text-left'>
                En rejoignant cette équipe, vous pourrez gérer les menus, suivre
                les commandes et consulter les performances du restaurant, selon
                les droits qui vous ont été accordés.
              </Text>

              <Button
                href={inviteLink}
                className='text-sm font-semibold bg-yellow-400 rounded-md text-black py-2 px-6'
              >
                Rejoindre l&apos;équipe
              </Button>

              <Text className='m-0 mt-4 mb-1 text-left text-xs text-gray-500'>
                Ou saisissez ce code dans l&apos;application :
              </Text>
              <Text className='m-0 inline-flex py-2 px-5 bg-zinc-100 rounded text-center font-bold text-xl tracking-widest'>
                {code}
              </Text>

              <Text className='m-0 mt-4 text-left text-xs text-gray-500'>
                Cette invitation est à usage unique et expire au bout de 7 jours.
                Si vous n&apos;attendiez pas cette invitation, ignorez
                simplement ce message.
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
