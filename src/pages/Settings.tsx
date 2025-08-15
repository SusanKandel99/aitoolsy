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
import { User, Mail, Settings as SettingsIcon, Trash2, LogOut, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
  const [isDeleting, setIsDeleting] = useState(false);

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
    // Validate auto-save interval
    const interval = parseInt(autoSaveInterval);
    if (isNaN(interval) || interval < 500 || interval > 10000) {
      toast({
        title: "Invalid auto-save interval",
        description: "Auto-save interval must be between 500 and 10000 milliseconds.",
        variant: "destructive",
      });
      return;
    }

    const preferences = {
      autoSaveEnabled,
      autoSaveInterval,
      confirmDelete,
      showPreview,
    };
    
    localStorage.setItem('app-preferences', JSON.stringify(preferences));
    
    // Dispatch custom event to notify other components about preference changes
    window.dispatchEvent(new CustomEvent('preferences-updated', { detail: preferences }));
    
    toast({
      title: "Preferences saved",
      description: "Your settings have been updated successfully.",
    });
  };

  const handleSignOut = async () => {
    try {
      // Clean up any stored preferences if needed
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      // Delete all user data first
      const { error: notesError } = await supabase
        .from('notes')
        .delete()
        .eq('user_id', user.id);

      const { error: foldersError } = await supabase
        .from('folders')
        .delete()
        .eq('user_id', user.id);

      const { error: flashcardsError } = await supabase
        .from('flashcards')
        .delete()
        .eq('user_id', user.id);

      if (notesError || foldersError || flashcardsError) {
        throw new Error('Failed to delete user data');
      }

      // Clear local storage
      localStorage.clear();
      
      // Delete the user account
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) {
        throw authError;
      }

      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently deleted.",
      });

      // Sign out and redirect
      await signOut();
    } catch (error) {
      console.error('Delete account error:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please contact support if this issue persists.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
                onCheckedChange={(checked) => {
                  setAutoSaveEnabled(checked);
                  // Auto-save this preference immediately
                  const newPrefs = {
                    autoSaveEnabled: checked,
                    autoSaveInterval,
                    confirmDelete,
                    showPreview,
                  };
                  localStorage.setItem('app-preferences', JSON.stringify(newPrefs));
                  window.dispatchEvent(new CustomEvent('preferences-updated', { detail: newPrefs }));
                }}
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
                onCheckedChange={(checked) => {
                  setConfirmDelete(checked);
                  const newPrefs = {
                    autoSaveEnabled,
                    autoSaveInterval,
                    confirmDelete: checked,
                    showPreview,
                  };
                  localStorage.setItem('app-preferences', JSON.stringify(newPrefs));
                  window.dispatchEvent(new CustomEvent('preferences-updated', { detail: newPrefs }));
                }}
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
                onCheckedChange={(checked) => {
                  setShowPreview(checked);
                  const newPrefs = {
                    autoSaveEnabled,
                    autoSaveInterval,
                    confirmDelete,
                    showPreview: checked,
                  };
                  localStorage.setItem('app-preferences', JSON.stringify(newPrefs));
                  window.dispatchEvent(new CustomEvent('preferences-updated', { detail: newPrefs }));
                }}
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
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Deleting...
                        </>
                      ) : (
                        'I understand, delete my account'
                      )}
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