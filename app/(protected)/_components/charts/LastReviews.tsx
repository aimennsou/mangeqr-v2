import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FC } from "react";

  
  interface LastReviewsCardProps {
    avatarSrc: string;
    avatarFallback: string;
    name: string;
    email: string;
    amount: string;
  }
  
  const LastReviewsCard: FC<LastReviewsCardProps> = ({ avatarSrc, avatarFallback, name, email, amount }) => {
    return (
      <div className="flex py-2 items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src={avatarSrc} alt="Avatar" />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">{name}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <div className="ml-auto font-medium">{amount}</div>
      </div>
    );
  };
  
  export default LastReviewsCard;

  export function RecentSales() {
    return (
     <div className="h-[400px]"> {/* Fixed height for the container */}
        <ScrollArea className="h-full gap-4 px-4 relative z-0 overflow-y-auto"> {/* Apply scrolling */}
          
   
        <LastReviewsCard
          avatarSrc="/avatars/01.png"
          avatarFallback="OM"
          name="Olivia Martin"
          email="olivia.martin@email.com"
          amount="+$1,999.00"
        />
        <LastReviewsCard
          avatarSrc="/avatars/02.png"
          avatarFallback="JL"
          name="Jackson Lee"
          email="jackson.lee@email.com"
          amount="+$39.00"
        />
        <LastReviewsCard
          avatarSrc="/avatars/03.png"
          avatarFallback="IN"
          name="Isabella Nguyen"
          email="isabella.nguyen@email.com"
          amount="+$299.00"
        />
        <LastReviewsCard
          avatarSrc="/avatars/04.png"
          avatarFallback="WK"
          name="William Kim"
          email="will@email.com"
          amount="+$99.00"
        />
        <LastReviewsCard
          avatarSrc="/avatars/05.png"
          avatarFallback="SD"
          name="Sofia Davis"
          email="sofia.davis@email.com"
          amount="+$39.00"
        />

      
<LastReviewsCard
          avatarSrc="/avatars/01.png"
          avatarFallback="OM"
          name="Olivia Martin"
          email="olivia.martin@email.com"
          amount="+$1,999.00"
        />
        <LastReviewsCard
          avatarSrc="/avatars/02.png"
          avatarFallback="JL"
          name="Jackson Lee"
          email="jackson.lee@email.com"
          amount="+$39.00"
        />
        <LastReviewsCard
          avatarSrc="/avatars/03.png"
          avatarFallback="IN"
          name="Isabella Nguyen"
          email="isabella.nguyen@email.com"
          amount="+$299.00"
        />
        <LastReviewsCard
          avatarSrc="/avatars/04.png"
          avatarFallback="WK"
          name="William Kim"
          email="will@email.com"
          amount="+$99.00"
        />
        <LastReviewsCard
          avatarSrc="/avatars/05.png"
          avatarFallback="SD"
          name="Sofia Davis"
          email="sofia.davis@email.com"
          amount="+$39.00"
        />

        <LastReviewsCard
          avatarSrc="/avatars/01.png"
          avatarFallback="OM"
          name="Olivia Martin"
          email="olivia.martin@email.com"
          amount="+$1,999.00"
        />
        <LastReviewsCard
          avatarSrc="/avatars/02.png"
          avatarFallback="JL"
          name="Jackson Lee"
          email="jackson.lee@email.com"
          amount="+$39.00"
        />
        <LastReviewsCard
          avatarSrc="/avatars/03.png"
          avatarFallback="IN"
          name="Isabella Nguyen"
          email="isabella.nguyen@email.com"
          amount="+$299.00"
        />
        <LastReviewsCard
          avatarSrc="/avatars/04.png"
          avatarFallback="WK"
          name="William Kim"
          email="will@email.com"
          amount="+$99.00"
        />
        <LastReviewsCard
          avatarSrc="/avatars/05.png"
          avatarFallback="SD"
          name="Sofia Davis"
          email="sofia.davis@email.com"
          amount="+$39.00"
        />
          </ScrollArea>
      </div>
    );
  }
  