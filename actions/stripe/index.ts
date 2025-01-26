'use server'
import { currentUser } from '@/lib/authentication'
import { db } from '@/lib/db';
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET!, {
  typescript: true,
  apiVersion: '2024-12-18.acacia',
})

export const onCreateCustomerPaymentIntentSecret = async (
  amount: number,
  stripeId: string
) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        currency: 'EUR',
        amount: amount * 100,
        automatic_payment_methods: {
          enabled: true,
        },
      },
      { stripeAccount: stripeId }
    )

    if (paymentIntent) {
      return { secret: paymentIntent.client_secret }
    }
  } catch (error) {
    console.log(error)
  }
}

export const onUpdateSubscription = async (
  plan: 'Free' |'Individual' |'Teams'
) => {
  try {
    const user = await currentUser()
    if (!user) return
    const update = await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        subscription: {
          update: {
            data: {
              plan,
            },
          },
        },
      },
      select: {
        subscription: {
          select: {
            plan: true,
          },
        },
      },
    })
    if (update) {
      return {
        status: 200,
        message: 'subscription updated',
        plan: update.subscription?.plan,
      }
    }
  } catch (error) {
    console.log(error)
  }
}

const setPlanAmount = (item:  'Free' |'Individual' |'Teams') => {

  if (item == 'Individual') {
    return 1000
  }
  if (item == 'Teams') {
    return 1500
  }



  return 0
}

export const onGetStripeClientSecret = async (
  item: 'Free' |'Individual' |'Teams'

) => {
  try {
    const amount = setPlanAmount(item)
    const paymentIntent = await stripe.paymentIntents.create({
      currency: 'EUR',
      amount: amount,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    if (paymentIntent) {
      return { secret: paymentIntent.client_secret }
    }
  } catch (error) {
    console.log(error)
  }
}


export const onGetSubscriptionPlan = async () => {
    try {
      const user = await currentUser()
      if (!user) return
      const plan = await db.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          subscription: {
            select: {
              plan: true,
            },
          },
        },
      })
      if (plan) {
        return plan.subscription?.plan
      }
    } catch (error) {
      console.log(error)
    }
  }
  