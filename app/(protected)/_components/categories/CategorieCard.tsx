import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Trash, CopyPlus, Pencil } from "lucide-react";
import { toast } from "sonner"; // Import Sonner's toast function

interface CategoryCardProps {
  logo: React.ReactNode; // For custom icon/logo rendering
  name: string;
  dishCount: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ logo, name, dishCount }) => {
  // Toast handlers
  const handleDelete = () => {
    toast.error("Category deleted!"); 
    // Toast for delete action
  };

  const handleDuplicate = () => {
    toast.success("Category duplicated!", { position: 'top-right' }); // Toast for duplicate action
  };

  const handleEdit = () => {
    toast("Category edited!"); // Toast for edit action
  };

  return (
    <div className="p-4 w-full hover:shadow-md border rounded-lg transition-shadow duration-300">
      <div className="flex flex-col md:flex-row justify-between gap-8 w-full">
        <div className="flex w-full justify-start items-center space-x-2">
          {/* Drag Handle */}
          <Button
            size="icon"
            className="bg-inherit border-none shadow-none hover:bg-inherit"
          >
            <GripVertical className="text-gray-300" />
          </Button>

          {/* Logo and Name */}
          <div className="flex mr-auto items-center space-x-3">
            {logo}
            <p className="text-md text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[300px] max-w-[150px]">
              {name}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center space-x-2">
          <Badge variant="secondary">
            {dishCount} plat{dishCount !== 1 ? "s" : ""}
          </Badge>
          <Switch />

          <div className="flex space-x-2">
            {/* Delete Button */}
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <Button
                    size="icon"
                    className="text-red-400 bg-inherit shadow-none rounded-full opacity-80 hover:text-red-500 hover:bg-red-200"
                    onClick={handleDelete} // Trigger delete toast
                  >
                    <Trash />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Supprimer la catégorie</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Duplicate Button */}
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <Button
                    size="icon"
                    className="text-gray-400 bg-inherit shadow-none rounded-full opacity-80 hover:text-gray-500 hover:bg-gray-200"
                    onClick={handleDuplicate} // Trigger duplicate toast
                  >
                    <CopyPlus />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dupliquer la catégorie</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Edit Button */}
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <Button
                    size="icon"
                    className="text-gray-400 bg-inherit shadow-none rounded-full opacity-80 hover:text-gray-500 hover:bg-gray-200"
                    onClick={handleEdit} // Trigger edit toast
                  >
                    <Pencil />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Modifier la catégorie</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;
