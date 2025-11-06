'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const formSchema = isLogin ? loginSchema : signupSchema;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: isLogin
      ? { email: '', password: '' }
      : { name: '', email: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In a real app, you'd call Firebase Auth here.
    // For this demo, we'll just show a toast and redirect.

    toast({
      title: isLogin ? 'Login Successful' : 'Signup Successful',
      description: `Welcome${!isLogin ? `, ${'name' in values ? values.name : ''}` : ''}! Redirecting to your dashboard...`,
    });

    // We'll use a simple mechanism to simulate a session for this demo
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_session', JSON.stringify({ email: values.email, name: 'name' in values ? values.name : 'User' }));
    }

    router.push('/dashboard');
  };

  const loginBg = PlaceHolderImages.find((img) => img.id === 'login-bg');

  return (
    <div className="w-full h-screen lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 h-full">
        <div className="mx-auto grid w-[380px] gap-8">
          <div className="grid gap-4 text-center">
            <Logo className="justify-center" />
            <h1 className="text-3xl font-bold">
              {isLogin ? 'Welcome Back' : 'Create an Account'}
            </h1>
            <p className="text-balance text-muted-foreground">
              {isLogin
                ? "Enter your credentials to access your financial dashboard."
                : "Join us to take control of your finances."}
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              {!isLogin && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel>Password</FormLabel>
                      {isLogin && (
                        <Button variant="link" type="button" className="ml-auto inline-block text-sm">
                          Forgot password?
                        </Button>
                      )}
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? 'Login' : 'Sign Up'}
              </Button>
              <Button variant="outline" className="w-full" type="button" disabled={isLoading}>
                {isLogin ? 'Login with Google' : 'Sign up with Google'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <Button
              variant="link"
              onClick={() => {
                setIsLogin(!isLogin);
                form.reset();
              }}
              className="underline"
            >
              {isLogin ? 'Sign up' : 'Login'}
            </Button>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        {loginBg && (
          <Image
            src={loginBg.imageUrl}
            alt={loginBg.description}
            data-ai-hint={loginBg.imageHint}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-primary/20" />
      </div>
    </div>
  );
}
