'use client'

import { Button } from '@/components/ui/button'
import { useSubscriptions } from '@/hooks/billing/use-billing'
import React from 'react'
import SubscriptionCard from './subscription-card'
import { StripeElements } from './stripe-elements'

type Props = {
  plan: 'Premium' | 'STANDARD' | 'Premiumy'
  
}

const SubscriptionForm = ({ plan }: Props) => {
 // const { loading, onSetPayment, payment, onUpdatetToFreTier } =
    useSubscriptions(plan)

  return (

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
 
        <SubscriptionCard
            title="STANDARD"
            description='Gratuit. pour exploré connektinn'
            price="0"
        //    payment={payment}
       //     onPayment={onSetPayment}
            id="STANDARD"
          />
          <SubscriptionCard
            title="Premium"
            description='Parfait pour 1 seul site'
            price="49"
      //      payment={payment}
       //     onPayment={onSetPayment}
            id="Premium"
          />
             <SubscriptionCard
            title="Premium annuel"
            description='économisé 98 euro.'
            price="490"
       //     payment={payment}
         //   onPayment={onSetPayment}
            id="Premiumy"
          />

        </div>
        <StripeElements
        // payment={payment} 
         />
          <Button 
         // onClick={onUpdatetToFreTier}
          >
     Confirmer
          </Button>
      </div>

  )
}

export default SubscriptionForm