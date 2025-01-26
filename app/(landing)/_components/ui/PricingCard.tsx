import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TIERS } from "@/config";
import { cn } from "@/lib/utils";


import {  Check, CheckCircle2 } from "lucide-react";
import ContactDialog from "./contact-dialog";

export const PricingCard = ({
  tier,
  paymentFrequency,
}: {
  tier: (typeof TIERS)[0];
  paymentFrequency: string;
}) => {
  const price = tier.price[paymentFrequency];
  const isHighlighted = tier.highlighted;
  const isPopular = tier.popular;

  return (
    <div
    className={cn(
      "flex flex-col flex-grow z-10 w-full rounded-3xl p-6 ",
      isPopular ? "bg-gradient-to-b from-gray-800 to-gray-900 text-white" : "bg-background"
    )}
    >
      {/* Background Decoration */}


      {/* Card Header */}
     
      <div className="mb-6">
          <p className="text-xl font-medium">{tier.title}</p>
          <p className="text-sm text-gray-400">{tier.description}</p>
        </div>
      {/* Price Section */}
      <div className="relative h-12">
        {typeof price === "number" ? (
          <>
       
       <h1 className="text-4xl font-medium">{price}€</h1>
        
           
          </>
        ) : (
            <>
            <span className="text-4xl font-bold">{price}</span>
            <span className="ml-2 text-lg text-gray-400">{ paymentFrequency}</span>

            </>
        )}
      </div>
      <div className="mb-6">
          <ContactDialog />
        </div>
      {/* Features */}
      <div className="flex-1 space-y-2">
        <ul className="space-y-2">
          {tier.features.map((feature, index) => (
            <li
              key={index}
              className=
                "flex items-center gap-2 text-sm font-medium"
            
            >
              <Check className="text-green-600" strokeWidth={1} size={15} />
              {feature}
            </li>
          ))}
        </ul>
      </div>


    </div>
  );
};

// Highlighted Background Component
const HighlightedBackground = () => (
  <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:45px_45px] opacity-100 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] dark:opacity-30" />
);

// Popular Background Component
const PopularBackground = () => (
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
);