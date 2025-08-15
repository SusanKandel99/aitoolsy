import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Settings as SettingsIcon, Trash2, LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  // App Preferences
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState('1000');
  const [confirmDelete, setConfirmDelete] = useState(true);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem('app-preferences');
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        setAutoSaveEnabled(prefs.autoSaveEnabled ?? true);
        setAutoSaveInterval(prefs.autoSaveInterval ?? '1000');
        setConfirmDelete(prefs.confirmDelete ?? true);
        setShowPreview(prefs.showPreview ?? true);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }
  }, []);

  const savePreferences = () => {
    const preferences = {
      autoSaveEnabled,
      autoSaveInterval,
      confirmDelete,
      showPreview,
    };
    
    localStorage.setItem('app-preferences', JSON.stringify(preferences));
    toast({
      title: "Preferences saved",
      description: "Your settings have been updated successfully.",
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <SettingsIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and app preferences</p>
          </div>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and current subscription status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                  <Badge variant="secondary" className="text-xs">
                    {user.email_confirmed_at ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>User ID</Label>
                <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Account Created</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>App Preferences</CardTitle>
            <CardDescription>
              Customize how the app behaves and looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-save notes</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save changes while you type
                </p>
              </div>
              <Switch
                checked={autoSaveEnabled}
                onCheckedChange={setAutoSaveEnabled}
              />
            </div>

            {autoSaveEnabled && (
              <div className="space-y-2">
                <Label htmlFor="autosave-interval">Auto-save interval (milliseconds)</Label>
                <Input
                  id="autosave-interval"
                  type="number"
                  min="500"
                  max="10000"
                  step="500"
                  value={autoSaveInterval}
                  onChange={(e) => setAutoSaveInterval(e.target.value)}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 1000ms (1 second)
                </p>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Confirm before deleting</Label>
                <p className="text-sm text-muted-foreground">
                  Show confirmation dialog when deleting notes
                </p>
              </div>
              <Switch
                checked={confirmDelete}
                onCheckedChange={setConfirmDelete}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Show rich text preview</Label>
                <p className="text-sm text-muted-foreground">
                  Display formatted preview of your notes
                </p>
              </div>
              <Switch
                checked={showPreview}
                onCheckedChange={setShowPreview}
              />
            </div>

            <div className="pt-4">
              <Button onClick={savePreferences} className="bg-gradient-to-r from-primary to-accent">
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Account Actions</CardTitle>
            <CardDescription>
              Manage your account and session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove all your data from our servers, including all
                      notes, folders, tags, and flashcards.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                      I understand, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}