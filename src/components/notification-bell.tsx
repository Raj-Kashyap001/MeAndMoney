
'use client';

import { Bell, Info, Lightbulb, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  const icons = {
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    alert: <AlertTriangle className="h-5 w-5 text-destructive" />,
    ai: <Lightbulb className="h-5 w-5 text-purple-500" />,
  };
  return icons[type];
};

export function NotificationBell() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const notificationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/notifications`), orderBy('createdAt', 'desc'), limit(20));
  }, [firestore, user]);

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);
  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const handleMarkAsRead = (notificationId: string) => {
    if (!user) return;
    const notifRef = doc(firestore, `users/${user.uid}/notifications`, notificationId);
    setDocumentNonBlocking(notifRef, { isRead: true }, { merge: true });
  };
  
  const handleMarkAllAsRead = () => {
    if (!user || !notifications) return;
    notifications.forEach(notif => {
      if (!notif.isRead) {
        const notifRef = doc(firestore, `users/${user.uid}/notifications`, notif.id);
        setDocumentNonBlocking(notifRef, { isRead: true }, { merge: true });
      }
    });
  };

  const handleClearAll = () => {
    if (!user || !notifications) return;
    notifications.forEach(notif => {
      const notifRef = doc(firestore, `users/${user.uid}/notifications`, notif.id);
      deleteDocumentNonBlocking(notifRef);
    });
    toast({
      title: "All notifications cleared",
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center rounded-full p-0">
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-semibold">Notifications</h3>
          <div className='flex items-center gap-2'>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
              Mark all as read
            </Button>
            <Button variant="link" size="sm" className="h-auto p-0 text-destructive" onClick={handleClearAll} disabled={!notifications || notifications.length === 0}>
              Clear All
            </Button>
          </div>
        </div>
        <ScrollArea className="h-80">
          <div className="p-2">
            {isLoading && (
              <div className="space-y-2 p-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}
            {!isLoading && notifications && notifications.length > 0 ? (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={cn(
                    "flex items-start gap-3 rounded-md p-3 hover:bg-muted",
                    !notif.isRead && "bg-blue-500/10"
                  )}
                  onClick={() => handleMarkAsRead(notif.id)}
                  role="button"
                >
                  <NotificationIcon type={notif.type} />
                  <div className="flex-1">
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                  )}
                </div>
              ))
            ) : (
              !isLoading && (
                <div className="text-center text-muted-foreground p-8">
                  You have no notifications.
                </div>
              )
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
