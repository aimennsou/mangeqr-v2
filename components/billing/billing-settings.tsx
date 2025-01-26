
import React from 'react'

import { Card, CardContent, CardDescription } from '../ui/card'
import { Check, CheckCircle2, Plus } from 'lucide-react'



import Image from 'next/image'
import SubscriptionForm from './subscription-form'
import { onGetSubscriptionPlan } from '@/actions/stripe'
import Modal from './modal'
import { pricingCards } from './pricing'

type Props = {}

const BillingSettings = async (props: Props) => {
  const plan = 'STANDARD'
  const planFeatures = pricingCards.find(
    
    (card: { title: string }) => 
     card.title.toUpperCase() === plan?.toUpperCase()
  )?.features
  if (!planFeatures) return

  console.log(planFeatures)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
    <div className="lg:col-span-1">
    <div >
      <p className="text-sm font-medium">Votre abonnement</p>
      <p className="text-sm font-light">Ajoutez des informations de paiement, mettez à niveau et modifiez votre plan.</p>
    </div>
    
    </div>
    <div className="lg:col-span-2 flex justify-start lg:justify-center ">
      <Modal
        title="Choisissez un plan"
        description="Parlez-nous de vous ! Que faites-vous ? Personnalisons votre expérience pour qu'elle vous convienne au mieux."
        trigger={
          plan && plan === 'STANDARD' ? (
            <Card className="border-dashed bg-gray-50 border-teal-400 hover:bg-teal-50 w-full cursor-pointer h-[270px] flex justify-center items-center">
              <CardContent className="flex gap-2 items-center">
                <div className="rounded-full border-2 p-1">
                  <Plus className="text-gray-400" />
                </div>
                <CardDescription className="font-semibold">
                  Mettre à niveau le plan
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <Image
              src="/images/creditcard.png"
              width={600}
              height={200}
              alt="image"
            />
          )
        }
      >
        <SubscriptionForm plan={plan!} /> 
      </Modal>
    </div>
    <div className="lg:col-span-2">
      <h3 className="text-xl font-semibold mb-2">Plan actuel</h3>

      <div className="flex gap-2 flex-col mt-2">
        {planFeatures.map((feature : string ) => (
          <div
            key={feature}
            className="flex gap-2"
          >
            <CheckCircle2 className="text-muted-foreground" />
            <p className="text-muted-foreground">{feature}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
  
  )
}

export default BillingSettings