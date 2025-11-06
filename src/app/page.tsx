
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'login-bg');

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/login?mode=signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-6">
                  Take Control of Your Personal Finances
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                  MeAndMoney helps you track your spending, create budgets, and achieve your financial goals with powerful tools and AI-driven insights.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button asChild size="lg">
                    <Link href="/login?mode=signup">
                      Get Started Free
                      <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/dashboard">View Demo</Link>
                  </Button>
                </div>
              </div>
              <div className="relative h-64 sm:h-80 lg:h-full rounded-2xl overflow-hidden shadow-2xl">
                 {heroImage && (
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    data-ai-hint={heroImage.imageHint}
                    fill
                    className="object-cover"
                    priority
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-32 bg-card">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">All-in-One Finance Hub</h2>
              <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
                Everything you need to manage your money effectively, in one place.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 border rounded-lg bg-background">
                <CheckCircle className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Track Everything</h3>
                <p className="text-muted-foreground">
                  Connect your accounts to see all your transactions, balances, and budgets in one clear view.
                </p>
              </div>
              <div className="p-6 border rounded-lg bg-background">
                <CheckCircle className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Set & Achieve Goals</h3>
                <p className="text-muted-foreground">
                  Define your financial goals, from saving for a vacation to a down payment, and track your progress.
                </p>
              </div>
              <div className="p-6 border rounded-lg bg-background">
                <CheckCircle className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Get AI Insights</h3>
                <p className="text-muted-foreground">
                  Receive personalized tips from our AI to help you save money and improve your financial habits.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 bg-card border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MeAndMoney. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
