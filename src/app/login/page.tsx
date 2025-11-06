
'use client';

import { Suspense, useState, useEffect } from 'react';
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
import { Loader2, Info } from 'lucide-react';
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
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, getFirestore } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LoadingLogo } from '@/components/loading-logo';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      ></path>
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      ></path>
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      ></path>
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      ></path>
      <path d="M1 1h22v22H1z" fill="none"></path>
    </svg>
  );

function AuthForm() {
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [isResetAlertOpen, setIsResetAlertOpen] = useState(false);
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
    setVerificationMessage(null);
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
    setVerificationMessage(null);
    try {
      if (isLogin) {
        // Login
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        if (!userCredential.user.emailVerified) {
          setVerificationMessage('Please check your inbox (and spam folder) to verify your email address.');
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
    setIsGoogleLoading(true);
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
        photoURL: user.photoURL
      }, { merge: true });

      toast({
        title: 'Login Successful',
        description: `Welcome, ${user.displayName}!`,
      });
      router.push('/dashboard');
    } catch (error: any) {
       if (error.code === 'auth/account-exists-with-different-credential' && error.customData?.email) {
            const email = error.customData.email;
            const methods = await fetchSignInMethodsForEmail(auth, email);

            if (methods.includes('password')) {
                toast({
                    title: 'Account Linking',
                    description: 'An account already exists with this email. Sign in with your password to link your Google account.',
                });
                
                form.setValue('email', email);
                if (!isLogin) toggleForm(); // Switch to login form
                
                const password = await new Promise<string>((resolve) => {
                    // This is a simplified prompt. A real app would use a secure modal.
                    const pass = window.prompt("Please enter your password to link your Google account.");
                    resolve(pass || '');
                });

                if (password) {
                    try {
                        const userCredential = await signInWithEmailAndPassword(auth, email, password);
                        const googleCredential = GoogleAuthProvider.credentialFromError(error);
                        if (userCredential.user && googleCredential) {
                            await linkWithCredential(userCredential.user, googleCredential);
                            toast({ title: 'Accounts Linked!', description: 'Your Google account has been successfully linked.' });
                            router.push('/dashboard');
                        }
                    } catch (linkError: any) {
                         toast({ variant: 'destructive', title: 'Linking Failed', description: linkError.message });
                    }
                }
            }
       } else {
         toast({
            variant: 'destructive',
            title: 'Google Sign-In Failed',
            description: error.message,
          });
       }
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  const handleForgotPassword = async () => {
    if (!resetPasswordEmail) {
      toast({ variant: 'destructive', title: 'Email required', description: 'Please enter your email address.' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetPasswordEmail);
      toast({ title: 'Password Reset Email Sent', description: 'Check your inbox for a link to reset your password.' });
      setIsResetAlertOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const toggleForm = () => {
    const newIsLogin = !isLogin;
    setIsLogin(newIsLogin);
    setVerificationMessage(null);
    const newPath = `/login?mode=${newIsLogin ? 'login' : 'signup'}`;
    router.replace(newPath, { scroll: false });
    form.reset();
  };

  if (isUserLoading || user) {
    return <LoadingLogo />;
  }

  return (
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
                  <Input placeholder="your@email.com" {...field} onChange={(e) => {
                    field.onChange(e);
                    setVerificationMessage(null);
                  }} />
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
                    <AlertDialog open={isResetAlertOpen} onOpenChange={setIsResetAlertOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="link" type="button" className="ml-auto inline-block text-sm" onClick={() => setResetPasswordEmail(form.getValues('email'))}>
                          Forgot password?
                        </Button>
                      </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reset Password</AlertDialogTitle>
                            <AlertDialogDescription>
                              Enter your email address and we'll send you a link to reset your password.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <Input 
                            type="email" 
                            placeholder="your@email.com" 
                            value={resetPasswordEmail}
                            onChange={(e) => setResetPasswordEmail(e.target.value)}
                          />
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleForgotPassword}>Send Reset Link</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} onChange={(e) => {
                    field.onChange(e);
                    setVerificationMessage(null);
                  }} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {verificationMessage && (
            <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800">
              <Info className="h-4 w-4 !text-blue-800" />
              <AlertDescription>
                {verificationMessage}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? 'Login' : 'Sign Up'}
          </Button>
          <Button variant="outline" className="w-full" type="button" disabled={isLoading || isGoogleLoading} onClick={handleGoogleSignIn}>
              {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
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
          disabled={isLoading || isGoogleLoading}
        >
          {isLogin ? 'Sign up' : 'Login'}
        </Button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const loginBg = PlaceHolderImages.find((img) => img.id === 'login-bg');
  const { user, isUserLoading } = useUser();

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingLogo />
      </div>
    );
  }
  
  return (
    <div className="w-full h-screen lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 h-full">
        <Suspense fallback={<LoadingLogo />}>
          <AuthForm />
        </Suspense>
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
