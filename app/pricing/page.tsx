import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Simple, Honest Pricing</h1>
          <p className="text-xl text-gray-600">
            No monthly fees. No hidden costs. Pay once, use forever.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free */}
          <div className="border border-gray-200 rounded-xl p-8 bg-white hover:shadow-lg transition">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Free</h2>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-gray-600 ml-2">forever</span>
              </div>
              <p className="text-gray-600">Perfect for trying it out</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>5 keywords</strong>
                </span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>Email notifications</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>Full dashboard access</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>All HARO queries</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>Daily digest emails</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>No credit card required</span>
              </li>
            </ul>

            <Button variant="outline" className="w-full" asChild>
              <Link href="/signup">Sign Up Free</Link>
            </Button>
          </div>

          {/* Pro */}
          <div className="border-2 border-blue-500 rounded-xl p-8 bg-blue-50 hover:shadow-xl transition relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-6 py-1 rounded-full text-sm font-semibold">
              BEST VALUE
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Pro</h2>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold">$5</span>
                <span className="text-gray-600 ml-2">one-time</span>
              </div>
              <p className="text-gray-600">Lifetime access, no monthly fees</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Unlimited keywords</strong>
                </span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Email notifications</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Full dashboard access</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>All HARO queries</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Daily digest emails</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Lifetime access</strong>
                </span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Priority support</span>
              </li>
            </ul>

            <Button className="w-full bg-blue-500 hover:bg-blue-600" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">What's the difference between plans?</h3>
              <p className="text-gray-600">
                The Free plan gives you 5 keywords to test HAROFilter. The Pro plan unlocks unlimited keywords for
                serious users who need to track multiple topics.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">Is the $5 payment really one-time?</h3>
              <p className="text-gray-600">
                Yes! Pay once, use forever. No monthly fees, no hidden costs, no subscriptions. You get
                lifetime access to the Pro plan with unlimited keywords.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">Can I self-host and avoid paying?</h3>
              <p className="text-gray-600">
                Absolutely! HAROFilter is open source (MIT License). You can deploy it yourself on your own
                infrastructure with unlimited keywords for free. The $5 is just for the convenience of managed hosting.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">What does "unlimited keywords" mean?</h3>
              <p className="text-gray-600">
                With Pro, you can add as many keywords as you want. Track 10, 50, 100+ topics - there's no limit.
                Perfect for agencies or power users managing multiple clients or niches.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee. If you're not satisfied, email us and we'll refund your
                $5, no questions asked.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-24 pb-16">
          <h2 className="text-3xl font-bold mb-4">Ready to stop missing HARO opportunities?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of PR professionals and journalists using HAROFilter.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="https://github.com/coloredsavage/HAROFilter">View on GitHub</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
