import Image from "next/image";
import PhoneFrame from "../ui/PhoneFrame";
import LiveMenu from "../ui/LiveMenu";

export default function PreviewLanding() {
  return (
    <div className="m-auto">
      <section className="my-32 hidden flex-col items-center justify-center gap-12 pt-8 sm:flex lg:flex-row lg:gap-16">
        <div className="max-w-sm flex-1 text-center lg:text-left">
          <h3 className="text-center text-xl font-bold">
            Testez ce menu en réel
          </h3>
          <p className="text-center text-zinc-500">
            Découvrez un menu numérique intuitif et facile à utiliser, simple à
            modifier et entièrement personnalisé pour votre restaurant.
          </p>
          <Image
            src="/images/arrow.png"
            alt="Feature Image"
            width={300}
            height={300}
            className="ml-auto hidden object-cover dark:invert lg:block"
          />
        </div>

        {/* Same live, explorable menu as the hero — no external iframe. */}
        <PhoneFrame>
          <LiveMenu />
        </PhoneFrame>
      </section>
    </div>
  );
}
