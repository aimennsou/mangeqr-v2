'use client'

import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import React from 'react'

import { useStripeElements } from '@/hooks/billing/use-billing'
import { PaymentForm } from './payment-form'


type StripeElementsProps = {
//  payment: 'STANDARD'|'Premium'| 'Premiumy'
}

export const StripeElements = (
    //{ payment }:
 //    StripeElementsProps/
    ) => {
  const StripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY!)
//  const { stripeSecret, loadForm } = useStripeElements(payment)
  return (
  //  stripeSecret &&
    StripePromise &&
   // (payment == 'Premium'|| payment == 'Premiumy' ) && (

        <Elements
          stripe={StripePromise}
        //  options={{
       //     clientSecret: stripeSecret,
    //      }}
        >
          <PaymentForm 
        //  plan={payment} 
          />
        </Elements>
    
    )
 // )
}