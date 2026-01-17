import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

// Use service role key for webhook operations (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 400 })
  }

  // Handle successful payment
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.userId
    const customerId = session.customer as string
    const paymentIntentId = session.payment_intent as string

    if (!userId) {
      console.error("No userId in session metadata")
      return NextResponse.json({ error: "No user ID" }, { status: 400 })
    }

    // Upgrade user to Pro plan (999999 = unlimited keywords)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        plan: "pro",
        keyword_limit: 999999,
        stripe_customer_id: customerId,
        stripe_payment_intent_id: paymentIntentId,
        upgraded_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Failed to upgrade user:", updateError)
      return NextResponse.json({ error: "Failed to upgrade user" }, { status: 500 })
    }

    console.log(`User ${userId} successfully upgraded to Pro plan`)
  }

  return NextResponse.json({ received: true })
}
