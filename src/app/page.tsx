
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, PlayCircle, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ThemeToggle } from '@/components/theme-toggle';
import { useUser, useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-bg');
  const howItWorks1 = PlaceHolderImages.find((img) => img.id === 'how-it-works-1');
  const howItWorks2 = PlaceHolderImages.find((img) => img.id === 'how-it-works-2');
  const howItWorks3 = PlaceHolderImages.find((img) => img.id === 'how-it-works-3');
  const demoPreview = PlaceHolderImages.find((img) => img.id === 'demo-preview');
  
  const mainRef = useRef(null);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch(error) {
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An error occurred while logging out.',
      });
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate sections
      const sections = gsap.utils.toArray('section');
      sections.forEach((section: any) => {
        gsap.fromTo(section, 
          { autoAlpha: 0, y: 50 }, 
          {
            autoAlpha: 1, 
            y: 0, 
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none none',
            }
          }
        );
      });
      
      // Hero section specific animations
       gsap.fromTo(
        '.hero-content > *',
        { autoAlpha: 0, y: 30 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.2,
          delay: 0.2,
        }
      );

       gsap.fromTo(
        '.hero-image',
        { autoAlpha: 0, scale: 1.05 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 1,
          ease: 'power3.inOut',
        }
      );


      // How it works steps
      gsap.utils.toArray('.how-it-works-step').forEach((step: any) => {
         const image = step.querySelector('.how-it-works-image');
         const content = step.querySelector('.how-it-works-content');
        
         gsap.fromTo(image, 
            {autoAlpha: 0, x: -50}, 
            {
                autoAlpha: 1, x: 0, duration: 1, ease: 'power3.out',
                scrollTrigger: { trigger: step, start: 'top 70%'}
            }
         );

         if (step.classList.contains('lg:order-last')) {
           gsap.fromTo(content, 
             {autoAlpha: 0, x: 50}, 
             {
                 autoAlpha: 1, x: 0, duration: 1, ease: 'power3.out',
                 scrollTrigger: { trigger: step, start: 'top 70%'}
             }
           );
         } else {
           gsap.fromTo(content, 
             {autoAlpha: 0, x: 50}, 
             {
                 autoAlpha: 1, x: 0, duration: 1, ease: 'power3.out',
                 scrollTrigger: { trigger: step, start: 'top 70%'}
             }
           );
         }
      });


    }, mainRef);

    return () => ctx.revert();
  }, []);

  const faqItems = [
    {
      question: "Is MeAndMoney secure?",
      answer: "Yes, we use bank-level encryption and follow industry best practices to ensure your data is always safe and secure. We never store your bank credentials."
    },
    {
      question: "Can I connect all my accounts?",
      answer: "We support thousands of financial institutions. You can connect checking, savings, credit cards, loans, and investment accounts from most major providers."
    },
    {
      question: "How does the AI provide insights?",
      answer: "Our AI analyzes your spending habits and financial data to identify patterns and opportunities. It then provides personalized, actionable tips to help you save money and reach your goals faster."
    },
    {
      question: "Is there a mobile app?",
      answer: "Currently, MeAndMoney is a web-based application, fully optimized for both desktop and mobile browsers. A native mobile app is on our roadmap!"
    }
  ];

  const NavButtons = ({ isMobile = false }: { isMobile?: boolean }) => {
    const commonButtonClass = isMobile ? 'w-full justify-start' : '';
    const closeMenu = () => setIsMobileMenuOpen(false);

    if (isUserLoading) {
      return (
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      );
    }
    
    if (user) {
      return (
         <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
            <Button asChild variant="outline" className={commonButtonClass} onClick={closeMenu}>
                <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button onClick={() => { handleLogout(); closeMenu(); }} className={commonButtonClass}>Logout</Button>
        </div>
      );
    }

    return (
      <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
        <Button asChild variant="ghost" className={commonButtonClass} onClick={closeMenu}>
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild className={commonButtonClass} onClick={closeMenu}>
          <Link href="/login?mode=signup">Sign Up</Link>
        </Button>
      </div>
    );
  };

  return (
    <div className="bg-background text-foreground min-h-screen overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              <NavButtons />
            </div>
            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle><Logo /></SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col h-full py-6">
                    <div className="flex flex-col gap-4">
                      <NavButtons isMobile />
                    </div>
                    <Separator className="my-6" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Switch Theme</span>
                      <ThemeToggle />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main ref={mainRef}>
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left hero-content">
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
                    <Link href="#demo">Watch Demo</Link>
                  </Button>
                </div>
              </div>
              <div className="relative h-64 sm:h-80 lg:h-full rounded-2xl overflow-hidden shadow-2xl hero-image">
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
        
        <section id="how-it-works" className="py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">How It Works in 3 Easy Steps</h2>
              <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
                Getting started with MeAndMoney is simple and straightforward.
              </p>
            </div>
            <div className="space-y-20">
              <div className="grid lg:grid-cols-2 gap-12 items-center how-it-works-step">
                {howItWorks1 && (
                  <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl how-it-works-image">
                    <Image src={howItWorks1.imageUrl} alt={howItWorks1.description} data-ai-hint={howItWorks1.imageHint} fill className="object-cover" />
                  </div>
                )}
                <div className="how-it-works-content">
                  <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold mb-4">Step 1</span>
                  <h3 className="text-3xl font-bold mb-4">Create an Account</h3>
                  <p className="text-muted-foreground text-lg">Start by signing up for a free MeAndMoney account. It's quick, easy, and the first step towards financial clarity.</p>
                </div>
              </div>
              <div className="grid lg:grid-cols-2 gap-12 items-center how-it-works-step">
                <div className="lg:order-last how-it-works-image">
                  {howItWorks2 && (
                    <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
                      <Image src={howItWorks2.imageUrl} alt={howItWorks2.description} data-ai-hint={howItWorks2.imageHint} fill className="object-cover" />
                    </div>
                  )}
                </div>
                <div className="how-it-works-content">
                  <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold mb-4">Step 2</span>
                  <h3 className="text-3xl font-bold mb-4">Track & Budget</h3>
                  <p className="text-muted-foreground text-lg">Your transactions are automatically categorized. Create custom budgets to track your spending and stay on top of your financial health.</p>
                </div>
              </div>
              <div className="grid lg:grid-cols-2 gap-12 items-center how-it-works-step">
                {howItWorks3 && (
                  <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl how-it-works-image">
                    <Image src={howItWorks3.imageUrl} alt={howItWorks3.description} data-ai-hint={howItWorks3.imageHint} fill className="object-cover" />
                  </div>
                )}
                <div className="how-it-works-content">
                  <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold mb-4">Step 3</span>
                  <h3 className="text-3xl font-bold mb-4">Get AI-Powered Insights</h3>
                  <p className="text-muted-foreground text-lg">Our smart AI analyzes your data to give you personalized tips on how to save money, reduce expenses, and achieve your goals faster.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="py-20 lg:py-32 bg-card">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">See MeAndMoney in Action</h2>
              <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
                Watch a short demo to see how our app can transform your financial life.
              </p>
            </div>
            {demoPreview && (
              <div className="relative aspect-video max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl group cursor-pointer">
                <Image src={demoPreview.imageUrl} alt={demoPreview.description} data-ai-hint={demoPreview.imageHint} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="h-20 w-20 text-white/80 group-hover:text-white group-hover:scale-110 transition-all" />
                </div>
              </div>
            )}
          </div>
        </section>
        
        <section id="faq" className="py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
              <p className="text-lg text-muted-foreground mt-4">
                Have questions? We've got answers.
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index + 1}`}>
                  <AccordionTrigger className="text-lg text-left">{item.question}</AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section id="contact" className="py-20 lg:py-32 bg-card">
           <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Get in Touch</h2>
              <p className="text-lg text-muted-foreground mt-4">
                We'd love to hear from you. Send us a message and we'll get back to you shortly.
              </p>
            </div>
            <form className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Input placeholder="Your Name" />
                <Input type="email" placeholder="Your Email" />
              </div>
              <Textarea placeholder="Your Message" rows={6} />
              <div className="flex justify-end">
                <Button size="lg">
                  Send Message
                  <ArrowRight className="ml-2" />
                </Button>
              </div>
            </form>
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
