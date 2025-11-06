
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import Link from 'next/link';

import {
  useAuth,
  useUser,
  setDocumentNonBlocking,
} from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getFirestore } from 'firebase/firestore';

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
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = getFirestore();

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    setIsLogin(searchParams.get('mode') !== 'signup');
  }, [searchParams]);

  const formSchema = isLogin ? loginSchema : signupSchema;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: isLogin
      ? { email: '', password: '' }
      : { name: '', email: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      if (isLogin) {
        // Login
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        if (!userCredential.user.emailVerified) {
          toast({
            variant: 'destructive',
            title: 'Email Not Verified',
            description: 'Please check your inbox to verify your email address.',
          });
          await auth.signOut();
          setIsLoading(false);
          return;
        }
        toast({
          title: 'Login Successful',
          description: `Welcome back! Redirecting to your dashboard...`,
        });
        router.push('/dashboard');
      } else {
        // Signup
        const { name, email, password } = values as z.infer<typeof signupSchema>;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        // Create user document in Firestore
        const userDocRef = doc(firestore, 'users', newUser.uid);
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ');
        
        setDocumentNonBlocking(userDocRef, {
          id: newUser.uid,
          email: newUser.email,
          firstName: firstName,
          lastName: lastName,
        }, {});
        
        await sendEmailVerification(newUser);

        toast({
          title: 'Signup Successful!',
          description: "We've sent a verification link to your email. Please check your inbox.",
        });

        await auth.signOut();
        toggleForm(); // Switch to login form
      }
    } catch (error: any) {
      const errorCode = error.code || 'An unknown error occurred';
      toast({
        variant: 'destructive',
        title: isLogin ? 'Login Failed' : 'Signup Failed',
        description: errorCode.replace('auth/', '').replace(/-/g, ' '),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      const [firstName, ...lastNameParts] = (user.displayName || '').split(' ');
      const lastName = lastNameParts.join(' ');

      // Set document non-blockingly, will merge if exists
      setDocumentNonBlocking(userDocRef, {
        id: user.uid,
        email: user.email,
        firstName: firstName,
        lastName: lastName,
      }, { merge: true });

      toast({
        title: 'Login Successful',
        description: `Welcome, ${user.displayName}!`,
      });
      router.push('/dashboard');
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleForm = () => {
    const newIsLogin = !isLogin;
    setIsLogin(newIsLogin);
    const newPath = `/login?mode=${newIsLogin ? 'login' : 'signup'}`;
    router.replace(newPath, { scroll: false });
    form.reset();
  };

  const loginBg = PlaceHolderImages.find((img) => img.id === 'login-bg');

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 h-full">
        <div className="mx-auto grid w-[380px] gap-8">
          <div className="grid gap-4 text-center">
             <Link href="/" className="flex justify-center items-center gap-2 font-semibold">
                <Logo />
             </Link>
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
              <Button variant="outline" className="w-full" type="button" disabled={isLoading} onClick={handleGoogleSignIn}>
                {isLogin ? 'Login with Google' : 'Sign up with Google'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <Button
              variant="link"
              onClick={toggleForm}
              className="underline"
              disabled={isLoading}
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
