
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, User, Trash2, KeyRound, Mail, LogOut, ShieldAlert, Pencil, X, Check } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth, useUser, setDocumentNonBlocking, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
        // Here you would fetch the user profile from Firestore
        // For now, we'll parse from display name
        setAvatarUrl(user.photoURL || undefined);
        const name = user.displayName || 'User';
        const nameParts = name.split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
    }
  }, [user, isUserLoading]);

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

  const handleNameEditToggle = () => {
    if (isEditingName) {
      // Reset to original name if cancelling
      if(user) {
        const name = user.displayName || '';
        const nameParts = name.split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
      }
    }
    setIsEditingName(!isEditingName);
  };
  
  const handleNameSave = () => {
    if (user) {
      const newName = `${firstName} ${lastName}`.trim();
      if(newName) {
        const userDocRef = doc(firestore, 'users', user.uid);
        
        setDocumentNonBlocking(userDocRef, {
            firstName,
            lastName
        }, { merge: true });

        // This doesn't update auth.currentUser displayName immediately,
        // but we'll reflect it in the UI optimistically.
        // For a full solution, you'd re-fetch the user profile.
        
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully changed.',
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  const displayName = `${firstName} ${lastName}`.trim();

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
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex flex-col items-center gap-4 w-full md:w-48">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-3xl">
                    {user ? getInitials(displayName) : <User />}
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
              <Button variant="outline" className="flex-shrink-0">Change password</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div className="flex-shrink min-w-0">
                <h4 className="font-medium">2-Step Verification</h4>
                <p className="text-sm text-muted-foreground">
                  Add an additional layer of security to your account during login.
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Support Access Section */}
         <Card>
          <CardHeader>
            <CardTitle>Support Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-shrink min-w-0">
                <h4 className="font-medium">Support access</h4>
                <p className="text-sm text-muted-foreground">
                  You have granted us to access to your account for support purposes.
                </p>
              </div>
              <Switch defaultChecked />
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
              <Button variant="destructive" className="flex-shrink-0">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
