import { cn } from "@/lib/utils";

import { Badge } from "./badge";
import { motion } from "framer-motion";

interface TabProps {
  text: string;
  selected: boolean;
  setSelected: (text: string) => void;
  discount?: boolean;
}

export const Tab = ({
  text,
  selected,
  setSelected,
  discount = false,
}: TabProps) => {
  return (
    <button
      onClick={() => setSelected(text)}
      className={cn(
        "relative w-fit px-4 py-2 text-sm font-semibold capitalize text-foreground transition-colors",
        discount && "flex items-center justify-center gap-2.5",
      )}
    >
      <span className="relative z-10">{text}</span>
      {selected && (
        <motion.span
          layoutId="tab"
          transition={{ type: "spring", duration: 0.4 }}
          className="absolute inset-0 z-0 rounded-full bg-background shadow-sm"
        ></motion.span>
      )}
      {discount && (
        <Badge
          className={cn(
            "relative z-10 whitespace-nowrap bg-gradient_indigo-purple text-xs text-black shadow-none hover:bg-gray-100",
            selected
              ? "bg-gradient_indigo-purple hover:bg-[#F3F4F6]"
              : "bg-gradient_indigo-purple hover:bg-gray-300",
          )}
        >
          Save 2 Months
        </Badge>
      )}
    </button>
  );
};