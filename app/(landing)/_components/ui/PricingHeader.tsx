import { Tab } from "@/components/ui/Tab";
import FadeUp from "../Fadeup";


export const PricingHeader = ({
  title,
  subtitle,
  frequencies,
  selectedFrequency,
  onFrequencyChange,
}: {
  title: string;
  subtitle: string;
  frequencies: string[];
  selectedFrequency: string;
  onFrequencyChange: (frequency: string) => void;
}) => (
  <div className="space-y-7 text-center">
<div className="relative mx-auto max-w-2xl text-center lg:max-w-4xl">
              <FadeUp delay={0.2} duration={0.8}>
               <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Digitalisez votre restaurant avec
              <br></br>
              <span className="relative z-10 bg-gradient-to-t from-yellow-400 to-yellow-400/[0.8] bg-clip-text text-transparent dark:text-white">
                MangeQR
              </span>
            </h1>
              </FadeUp>
              <FadeUp delay={0.4} duration={0.8}>
              <p className="mx-2 my-6 max-w-2xl text-base font-light tracking-tight dark:text-zinc-300 sm:text-xl">
              Simplifiez la gestion de vos menus avec des QR codes innovants. Offrez à vos clients une expérience unique et moderne, tout en réduisant les coûts d'impression et en améliorant leur satisfaction.
            </p>
              </FadeUp>
            </div>
    <div className="mx-auto flex w-fit rounded-full bg-[#F3F4F6] p-1 dark:bg-[#222]">
      {frequencies.map((freq) => (
        <Tab
          key={freq}
          text={freq}
          selected={selectedFrequency === freq}
          setSelected={onFrequencyChange}
          discount={freq === "yearly"}
        />
      ))}
    </div>
  </div>
);