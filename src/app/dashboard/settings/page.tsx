
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, User, Trash2, KeyRound, LogOut, Pencil, X, Check, Globe, Moon, Sun, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useAuth, useUser, setDocumentNonBlocking, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/components/currency-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const currencies = [
  { code: 'USD', name: 'United States Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'GBP', name: 'British Pound Sterling' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'INR', name: 'Indian Rupee' },
];

export default function SettingsPage() {
  const { user, isUserLoading: isAuthUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  
  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const [isEditingName, setIsEditingName] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deleteConfirmationEmail, setDeleteConfirmationEmail] = useState('');


  useEffect(() => {
    if (userProfile) {
        setAvatarUrl(userProfile.photoURL || user?.photoURL || undefined);
        setFirstName(userProfile.firstName || '');
        setLastName(userProfile.lastName || '');
    }
  }, [userProfile, user]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An error occurred while logging out.',
      });
    }
  };
  
  const handleChangePassword = async () => {
    if (!user?.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'No email address found for your account.' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ title: 'Password Reset Email Sent', description: 'Check your inbox to reset your password.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    try {
      await deleteUser(user);
      toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
      router.push('/login');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    } finally {
      setIsDeleteAlertOpen(false);
      setDeleteConfirmationEmail('');
    }
  };


  const handleNameEditToggle = () => {
    if (isEditingName) {
      if(userProfile) {
        setFirstName(userProfile.firstName || '');
        setLastName(userProfile.lastName || '');
      }
    }
    setIsEditingName(!isEditingName);
  };
  
  const handleNameSave = () => {
    if (userDocRef) {
      const newName = `${firstName} ${lastName}`.trim();
      if(newName) {
        setDocumentNonBlocking(userDocRef, {
            firstName,
            lastName
        }, { merge: true });

        toast({
          title: 'Profile Updated',
          description: 'Your name has been successfully changed.',
        });
        setIsEditingName(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid Name',
          description: 'Name fields cannot be empty.',
        });
      }
    }
  };

  const handlePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: 'destructive',
          title: 'Image Too Large',
          description: 'Please upload an image smaller than 2MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatarUrl = reader.result as string;
        setAvatarUrl(newAvatarUrl);
        // Here you would typically upload to Firebase Storage and then update the user profile URL
        // For now, it's just a local preview
      };
      reader.readAsDataURL(file);
    }
  };

  const removePicture = () => {
    setAvatarUrl(undefined);
  };
  
  const handleCurrencyChange = (newCurrency: string) => {
    if (userDocRef) {
      setCurrency(newCurrency);
      setDocumentNonBlocking(userDocRef, { currency: newCurrency }, { merge: true });
      toast({
        title: 'Currency Updated',
        description: `Your currency has been set to ${newCurrency}.`,
      });
    }
  };


  const getInitials = (fName: string, lName: string) => {
    return `${fName[0] || ''}${lName[0] || ''}`.toUpperCase();
  };
  
  const displayName = `${firstName} ${lastName}`.trim();
  const isLoading = isAuthUserLoading || isProfileLoading;

  return (
    <>
      <PageHeader
        title="My Profile"
        description="Manage your account settings and preferences."
      />
      <div className="grid gap-8 max-w-4xl mx-auto">
        {/* Profile Section */}
        <Card>
          <CardHeader>
             <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent>
             {isLoading ? (
                <div className="flex flex-col md:flex-row items-start gap-6">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Separator orientation="vertical" className="h-auto hidden md:block" />
                    <div className="flex-1 w-full space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-5 w-64" />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex flex-col items-center gap-4 w-full md:w-48">
                    <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="text-3xl">
                        {user ? getInitials(firstName, lastName) : <User />}
                    </AvatarFallback>
                    </Avatar>
                    {isEditingName && (
                    <div className="flex flex-col gap-2 w-full">
                        <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        >
                        <Upload className="mr-2 h-4 w-4" />
                        Change Image
                        </Button>
                        <Button
                        variant="ghost"
                        className="text-destructive hover:bg-transparent hover:text-destructive hover:border-destructive border border-transparent"
                        onClick={removePicture}
                        >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                        </Button>
                        <Input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePictureUpload}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif"
                        />
                    </div>
                    )}
                </div>

                <Separator orientation="vertical" className="h-auto hidden md:block" />
                <Separator className="md:hidden"/>

                <div className="flex-1 w-full">
                    {isEditingName ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name"/>
                        </div>
                        </div>
                        <p className="text-sm text-muted-foreground pt-2">
                        We support PNGs, JPEGs and GIFs under 2MB.
                        </p>
                        <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" size="sm" onClick={handleNameEditToggle}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleNameSave}>
                            <Check className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                        </div>
                    </div>
                    ) : (
                    <div className="flex items-start justify-between">
                        <div>
                        <Label>Name</Label>
                        <h3 className="text-2xl font-bold mt-1">{displayName}</h3>
                        <p className="text-muted-foreground">{user?.email}</p>
                        </div>
                        <Button variant="outline" size="icon" onClick={handleNameEditToggle}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit Name</span>
                        </Button>
                    </div>
                    )}
                </div>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Display Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle>Display</CardTitle>
            <CardDescription>Manage your display preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-shrink min-w-0">
                <Label htmlFor="currency-select" className='flex items-center gap-2'><Globe className='w-4 h-4' /> Currency</Label>
                <p className="text-muted-foreground text-sm pt-1">Select your preferred currency for display.</p>
              </div>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-[180px]" id="currency-select">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <Separator />
             <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-shrink min-w-0">
                    <Label className="flex items-center gap-2">
                        <Sun className="h-4 w-4 inline-block dark:hidden" />
                        <Moon className="h-4 w-4 hidden dark:inline-block" />
                        Theme
                    </Label>
                    <p className="text-muted-foreground text-sm pt-1">Select the app color scheme.</p>
                </div>
                 <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="light"><Sun className="inline-block mr-2 h-4 w-4"/>Light</SelectItem>
                        <SelectItem value="dark"><Moon className="inline-block mr-2 h-4 w-4"/>Dark</SelectItem>
                        <SelectItem value="system"><Laptop className="inline-block mr-2 h-4 w-4"/>System</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </CardContent>
        </Card>

        {/* Account Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-shrink min-w-0">
                <Label>Email</Label>
                <p className="text-muted-foreground text-sm pt-1">{user?.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4 flex-wrap">
               <div className="flex-shrink min-w-0">
                <Label>Password</Label>
                <p className="text-muted-foreground text-sm pt-1">••••••••••••</p>
              </div>
              <Button variant="outline" className="flex-shrink-0" onClick={handleChangePassword}>Change password</Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Log out & Delete Section */}
        <Card>
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-shrink min-w-0">
                <h4 className="font-medium">Log out of all devices</h4>
                <p className="text-sm text-muted-foreground">
                  Log out of all other active sessions on other devices besides this one.
                </p>
              </div>
              <Button variant="outline" className="flex-shrink-0 hover:bg-destructive hover:text-destructive-foreground" onClick={handleLogout}>Log out</Button>
            </div>
            <Separator />
             <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-shrink min-w-0">
                <h4 className="font-medium text-destructive">Delete my account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete the account and remove access from all workspaces.
                </p>
              </div>
              <Button variant="destructive" className="flex-shrink-0" onClick={() => setIsDeleteAlertOpen(true)}>Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and all associated data. We recommend you back up your data first.
              <br/><br/>
              Please type <strong className="text-foreground">{user?.email}</strong> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
           <Input 
                type="email" 
                placeholder="Enter your email to confirm" 
                value={deleteConfirmationEmail}
                onChange={(e) => setDeleteConfirmationEmail(e.target.value)}
            />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmationEmail('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleDeleteAccount} 
                disabled={deleteConfirmationEmail !== user?.email}
                className="bg-destructive hover:bg-destructive/90">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
