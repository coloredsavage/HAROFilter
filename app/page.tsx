import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, MessageSquare, ArrowRight, CheckCircle2, Github, ExternalLink, TrendingUp, Shield, Clock, Twitter } from "lucide-react"
import { SignUpForm } from "@/components/signup-form"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Filter className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">HAROFilter</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="https://github.com/coloredsavage/HAROFilter" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon">
                <Github className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Link href="https://github.com/coloredsavage/HAROFilter" target="_blank" rel="noopener noreferrer">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Github className="h-4 w-4" />
                    <span>Star on GitHub</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </Link>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
                HARO Queries, Filtered for You
              </h1>
              <p className="text-xl text-muted-foreground text-pretty">
                Set your keywords. Check your dashboard. Respond to relevant queries.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Signup Form Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Create your account</CardTitle>
                <CardDescription>Start filtering HARO queries in minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <SignUpForm redirectTo="/onboarding" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stop wasting time scrolling through irrelevant queries. Let us filter them for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative">
              <div className="absolute -top-4 left-6 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <CardHeader className="pt-8">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Set Your Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tell us your areas of expertise. Add keywords like "marketing", "SaaS", "healthcare", or any topic you
                  can speak to.
                </p>
              </CardContent>
            </Card>

            <Card className="relative">
              <div className="absolute -top-4 left-6 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <CardHeader className="pt-8">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Filter className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>We Filter Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our system automatically matches incoming HARO queries to your keywords and surfaces only the relevant
                  ones.
                </p>
              </CardContent>
            </Card>

            <Card className="relative">
              <div className="absolute -top-4 left-6 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <CardHeader className="pt-8">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Respond to Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Check your dashboard, see matching queries with deadlines, and respond directly to journalists.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why HARO Matters */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why HARO Matters for Your Business</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              HARO connects you with journalists from major publications. Build authority, earn high-quality backlinks, and boost your SEO rankings.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>High-Quality Backlinks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get featured in Forbes, TechCrunch, and other authoritative sites. Earn powerful backlinks that boost your SEO rankings.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Build Authority</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Establish yourself as an industry expert. Build your personal brand and credibility through media coverage.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Save Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Precision matching means you only see opportunities that fit your expertise. No more sifting through irrelevant requests.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted/50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-center mb-6">The SEO Benefits Are Real</h3>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Get high-authority backlinks from major publications</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Boost your domain authority and search rankings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Increase organic traffic to your website</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Build relationships with journalists and editors</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Establish thought leadership in your industry</span>
                  </li>
                </ul>
              </div>
              <div className="text-center">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold text-primary">1000+</div>
                    <div className="text-sm text-muted-foreground">Monthly HARO requests</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">95%</div>
                    <div className="text-sm text-muted-foreground">Of which you could miss without filtering</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Everything you need to land media coverage</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Smart Keyword Matching</p>
                    <p className="text-muted-foreground text-sm">Queries are matched to your expertise automatically</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Deadline Tracking</p>
                    <p className="text-muted-foreground text-sm">Never miss a deadline with clear visual indicators</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Response Tracking</p>
                    <p className="text-muted-foreground text-sm">Keep track of which queries you've responded to</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Save for Later</p>
                    <p className="text-muted-foreground text-sm">
                      Bookmark interesting queries to respond when you're ready
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Preview Card */}
            <Card className="shadow-lg overflow-hidden">
              <div className="bg-muted/50 p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">Marketing</span>
                    <span className="text-xs text-muted-foreground">Deadline: 2 days</span>
                  </div>
                  <h3 className="font-semibold">Expert Quotes on AI Marketing Trends</h3>
                  <p className="text-sm text-muted-foreground">
                    Looking for marketing professionals to share insights on how AI is changing digital marketing
                    strategies...
                  </p>
                </div>
                <div className="h-px bg-border" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">SaaS</span>
                    <span className="text-xs text-muted-foreground">Deadline: 5 days</span>
                  </div>
                  <h3 className="font-semibold">SaaS Founders Share Growth Strategies</h3>
                  <p className="text-sm text-muted-foreground">
                    We're writing about bootstrapped SaaS companies that have achieved significant growth...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to get more media coverage?</h2>
          <p className="text-primary-foreground/80 text-lg">
            Join thousands of experts who use HAROFilter to find and respond to relevant journalist queries.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Start Free Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <Filter className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-medium">HAROFilter</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="https://github.com/coloredsavage/HAROFilter" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Github className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="https://x.com/colored_savage" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Twitter className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} HAROFilter. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
