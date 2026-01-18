import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

// Initialize Stripe with lazy loading to avoid build-time errors
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

// Use service role key for server-side operations
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase configuration is missing')
  }

  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      )
    }

    // Get user email from Supabase
    const supabase = getSupabase()
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, plan")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if already on pro plan
    if (profile.plan === "pro") {
      return NextResponse.json(
        { error: "Already on Pro plan" },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "STRIPE_PRICE_ID not configured" },
        { status: 500 }
      );
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: "payment", // one-time payment
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
      customer_email: profile.email,
      metadata: {
        userId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
