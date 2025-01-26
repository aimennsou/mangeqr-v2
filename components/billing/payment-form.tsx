'use client'
import React from 'react'
import { CardDescription } from '../ui/card'

import { PaymentElement } from '@stripe/react-stripe-js'
import { Button } from '../ui/button'
import { useCompletePayment } from '@/hooks/billing/use-billing'



type PaymentFormProps = {
 // plan: 'Premium' | 'Premiumy'
}

export const PaymentForm = (
  //  { plan }: PaymentFormProps
) => {
 // const { processing, onMakePayment } = useCompletePayment(plan)
  return (
    <form
 //   onSubmit={onMakePayment}
    className="flex flex-col gap-5"
  >
    <div>
      <h2 className="font-semibold text-xl text-black">Méthode de paiement</h2>
      <CardDescription>Entrez les détails de votre carte</CardDescription>
    </div>
    <PaymentElement />
    <Button type="submit">
    Payer
    </Button>
  </form>
  
  )
}