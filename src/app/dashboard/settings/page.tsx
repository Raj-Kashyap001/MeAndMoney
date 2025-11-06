'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, User, Trash2, KeyRound, Mail, LogOut, ShieldAlert } from 'lucide-react';
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

export default function SettingsPage() {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatarUrl?: string;
  } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('user_session');
      if (session) {
        const parsedSession = JSON.parse(session);
        setUser(parsedSession);
        setAvatarUrl(parsedSession.avatarUrl);
      }
    }
  }, []);

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
        updateLocalStorageAvatar(newAvatarUrl);
        toast({
          title: 'Profile Picture Updated',
          description: 'Your new picture has been saved.',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePicture = () => {
    setAvatarUrl(undefined);
    updateLocalStorageAvatar(undefined);
    toast({
      title: 'Profile Picture Removed',
    });
  };

  const updateLocalStorageAvatar = (url: string | undefined) => {
    if (user) {
      const updatedUser = { ...user, avatarUrl: url };
      setUser(updatedUser);
      localStorage.setItem('user_session', JSON.stringify(updatedUser));
      // Dispatch a storage event to notify other components like the UserNav
      window.dispatchEvent(new Event('storage'));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  const getFirstName = () => user?.name.split(' ')[0] || '';
  const getLastName = () => user?.name.split(' ').slice(1).join(' ') || '';

  return (
    <>
      <PageHeader
        title="My Profile"
        description="Manage your account settings and preferences."
      />
      <div className="grid gap-8 max-w-4xl mx-auto">
        {/* Profile Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} alt={user?.name} />
                <AvatarFallback className="text-3xl">
                  {user ? getInitials(user.name) : <User />}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2" />
                    Change Image
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={removePicture}
                  >
                    Remove Image
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  We support PNGs, JPEGs and GIFs under 2MB.
                </p>
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePictureUpload}
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif"
                />
              </div>
            </div>
            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue={getFirstName()} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue={getLastName()} />
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
            <div className="flex items-center justify-between gap-4">
              <div className="flex-shrink min-w-0">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email || ''} disabled className="mt-1 max-w-sm" />
              </div>
              <Button variant="outline" className="flex-shrink-0">Change email</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
               <div className="flex-shrink min-w-0">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" defaultValue="•••••••••••" disabled className="mt-1 max-w-sm" />
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
            <div className="flex items-center justify-between gap-4">
              <div className="flex-shrink min-w-0">
                <h4 className="font-medium">Log out of all devices</h4>
                <p className="text-sm text-muted-foreground">
                  Log out of all other active sessions on other devices besides this one.
                </p>
              </div>
              <Button variant="outline" className="flex-shrink-0">Log out</Button>
            </div>
            <Separator />
             <div className="flex items-center justify-between gap-4">
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
