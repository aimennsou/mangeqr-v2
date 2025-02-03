import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Trash, CopyPlus, Pencil } from "lucide-react";

interface DishCardProps {
  imageUrl: string;
  name: string;
  description: string;
  price: string;
  allergenes: string;
}

const DishCard: React.FC<DishCardProps> = ({ imageUrl, name, description, price, allergenes }) => {
  return (
    <div className="p-4 flex flex-row hover:shadow-md border rounded-lg transition-shadow duration-300">
      {/* Dish Image */}
   

      {/* Dish Content (Name, Description, Price) */}
      <div className="flex flex-col justify-between flex-1">
        {/* Action Buttons */}
        <div className="flex justify-between">
          <div>
            <Button size="icon" className="bg-inherit border-none shadow-none hover:bg-inherit">
              <GripVertical className="flex my-auto text-gray-300" />
            </Button>
          </div>

          <div className="flex justify-end items-center space-x-2">
            <Switch />

            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <Button
                    size="icon"
                    className="text-red-400 bg-inherit shadow-none rounded-full opacity-80 hover:text-red-500 hover:bg-red-200"
                  >
                    <Trash />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Supprimer le plat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <Button
                    size="icon"
                    className="text-gray-400 bg-inherit shadow-none rounded-full opacity-80 hover:text-gray-500 hover:bg-gray-200"
                  >
                    <CopyPlus />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dupliquer le plat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <Button
                    size="icon"
                    className="text-gray-400 bg-inherit shadow-none rounded-full opacity-80 hover:text-gray-500 hover:bg-gray-200"
                  >
                    <Pencil />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Modifier le plat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex-shrink-0">

        <div className="w-24 h-24 justify-center">
        <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-lg" />
      </div> </div>
        {/* Dish Info */}
        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between items-center">
            <p className="text-xl font-semibold text-gray-800">{name}</p>
            <p className="text-lg font-semibold text-green-400">{price}</p>
          </div>
          <p className="text-sm text-gray-600">{description}</p>
          <p className="text-sm text-gray-600">{allergenes}</p>
        </div>
      </div>
    </div>
  );
};

export default DishCard;
