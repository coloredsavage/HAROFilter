# Stripe Integration Setup Guide

This guide walks you through setting up Stripe for the $5 Pro plan upgrade feature.

## Overview

HAROFilter uses Stripe for one-time payments when users upgrade from Free (5 keywords) to Pro (50 keywords) plan for $5.

## Prerequisites

- A Stripe account (free to create at https://stripe.com)
- Your harofilter.xyz domain deployed and accessible

## Step-by-Step Setup

### 1. Create Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Sign up for a Stripe account
3. Complete account verification (can take a few days, but test mode works immediately)

---

### 2. Get API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Click "Reveal test key" for **Secret key** (starts with `sk_test_`)
4. Add both to your `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

**Note:** Start with test keys. Once you're ready for production, switch to live keys (no `_test_` prefix).

---

### 3. Create Product & Price (Already Done for You!)

You've already created the product and price with ID: `price_1SqSDOPRTJysFgaUhzdcPo7y`

To verify or create a new one:

1. Go to https://dashboard.stripe.com/test/products
2. Click **+ Add Product**
3. Fill in:
   - **Name:** HAROFilter Pro
   - **Description:** Upgrade to 50 keywords - Lifetime access
   - **Pricing:** One-time payment, $5.00 USD
4. Click **Save product**
5. Copy the **Price ID** (starts with `price_`)
6. Update in `app/api/stripe/create-checkout/route.ts` if different from `price_1SqSDOPRTJysFgaUhzdcPo7y`

---

### 4. Set Up Webhook Endpoint

Webhooks notify your app when a payment succeeds.

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **+ Add endpoint**
3. **Endpoint URL:**
   - Local testing: Use https://dashboard.stripe.com/test/webhooks/create?endpoint_location=local
   - Production: `https://harofilter.xyz/api/stripe/webhook`
4. **Events to listen to:**
   - Select `checkout.session.completed`
5. Click **Add endpoint**
6. Click **Reveal** next to **Signing secret** (starts with `whsec_`)
7. Add to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

### 5. Get Supabase Service Role Key

The webhook needs to bypass Row Level Security to update user plans.

1. Go to https://supabase.com/dashboard/project/_/settings/api
2. Scroll to **Service Role Key** (anon key won't work!)
3. Click **Reveal** and copy the key
4. Add to `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ WARNING:** Never expose this key in client-side code! Only use in API routes.

---

### 6. Test Locally with Stripe CLI (Optional)

To test webhooks locally before deploying:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook signing secret and add to `.env.local`
5. In another terminal, start your dev server:
   ```bash
   npm run dev
   ```
6. Test a payment with test card: `4242 4242 4242 4242` (any future expiry, any CVC)

---

### 7. Test the Upgrade Flow

1. Start dev server: `npm run dev`
2. Sign up / log in at http://localhost:3000
3. Go to Settings → Keywords
4. Click **Upgrade for $5** button
5. Use Stripe test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
6. Complete payment
7. You should be redirected to settings with `?upgraded=true`
8. Check database - your `plan` should be `pro` and `keyword_limit` should be `50`

---

### 8. Deploy to Production

**Environment Variables (Vercel):**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these for **Production**:
   ```
   STRIPE_SECRET_KEY=sk_live_xxxxx (use LIVE key, not test!)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx (from production webhook)
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

**Update Stripe Webhook for Production:**

1. Go to https://dashboard.stripe.com/webhooks (switch to Live mode)
2. Add endpoint: `https://harofilter.xyz/api/stripe/webhook`
3. Select event: `checkout.session.completed`
4. Copy the signing secret and update in Vercel

**Switch to Live Keys:**

1. Go to https://dashboard.stripe.com/apikeys (switch to Live mode)
2. Use live keys (no `_test_` prefix)
3. Update in Vercel environment variables

**Redeploy:**
- Trigger a redeploy in Vercel after adding environment variables

---

## Testing Checklist

- [ ] Stripe API keys added to environment variables
- [ ] Webhook endpoint created and secret added
- [ ] Supabase service role key added
- [ ] Database migration `004-add-pricing-plans.sql` executed
- [ ] Test payment with test card works
- [ ] User plan updates to "pro" after payment
- [ ] Keyword limit increases to 50 after upgrade
- [ ] Upgrade banner disappears after upgrading

---

## Troubleshooting

### Webhook not triggering

**Problem:** Payment completes but user not upgraded.

**Solution:**
1. Check Vercel logs for `/api/stripe/webhook` errors
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
3. Check webhook event in Stripe Dashboard shows successful delivery
4. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)

### "Already on Pro plan" error

**Problem:** User tries to upgrade but already on pro plan.

**Solution:**
- This is expected behavior - prevents double charging
- Check database: `SELECT plan FROM profiles WHERE id = 'user-id'`

### Payment succeeds but no redirect

**Problem:** Stuck on Stripe checkout page after payment.

**Solution:**
1. Check `success_url` in `create-checkout/route.ts` is correct
2. Verify `NEXT_PUBLIC_APP_URL` environment variable is set
3. Test with: `console.log(process.env.NEXT_PUBLIC_APP_URL)`

### Database not updating

**Problem:** Webhook received but plan stays "free".

**Solution:**
1. Check `userId` is in session metadata
2. Verify Supabase service role key has permission
3. Check database logs in Supabase Dashboard
4. Ensure migration `004-add-pricing-plans.sql` was executed

---

## Security Best Practices

1. **Never commit secrets to Git**
   - `.env.local` is gitignored ✓
   - Only commit `.env.example` with placeholders

2. **Use webhook signature verification**
   - Already implemented in `webhook/route.ts` ✓
   - Prevents fake payment events

3. **Validate on server-side**
   - Keyword limits enforced in database ✓
   - Client-side checks are just UX improvements

4. **Rotate keys if exposed**
   - Roll keys in Stripe Dashboard
   - Update environment variables
   - Redeploy

---

## Production Checklist

Before going live with real payments:

- [ ] Switch from test keys to live keys
- [ ] Update webhook endpoint to production URL
- [ ] Complete Stripe account verification
- [ ] Test with real $5 payment (refund yourself after)
- [ ] Set up email notifications for failed webhooks
- [ ] Monitor Stripe Dashboard for payments
- [ ] Set up alerts for webhook failures

---

## Cost Analysis

**Stripe Fees:**
- $5 payment = $0.30 + 2.9% = $0.30 + $0.15 = **$0.45 in fees**
- **You get: $4.55 per upgrade**

**Your Costs:**
- Supabase: $0 (free tier)
- Vercel: $0 (free tier)
- Gmail: $0 (free limits)
- **Total profit per user: ~$4.55**

---

## Support

- **Stripe Docs:** https://stripe.com/docs
- **Stripe Discord:** https://discord.gg/stripe
- **Stripe Support:** https://support.stripe.com

---

**You're all set! 🎉** Users can now upgrade to Pro for $5 and unlock 50 keywords.
