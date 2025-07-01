import React, { useState, useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserContext } from '@/App';
import { UserProfileService, UserProfile } from '@/services/userDataService';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  User, 
  Edit3, 
  Save, 
  X, 
  Calendar, 
  Mail, 
  Settings, 
  Heart, 
  Pill,
  UserCheck,
  Bell,
  Shield,
  Palette
} from 'lucide-react';

const ProfileEditor: React.FC = () => {
  const { user, setUser } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('');
  const [diagnosisDate, setDiagnosisDate] = useState('');
  const [medications, setMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState('');
  
  // Preferences
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

  const loadUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const profile = await UserProfileService.getProfile(user.id);
      if (profile) {
        setUserProfile(profile);
        setDisplayName(profile.displayName || user.name || '');
        setAge(profile.medicalInfo?.age || '');
        setGender(profile.medicalInfo?.gender || '');
        setDiagnosisDate(profile.medicalInfo?.diagnosisDate ? new Date(profile.medicalInfo.diagnosisDate).toISOString().split('T')[0] : '');
        setMedications(profile.medicalInfo?.medications || []);
        setTheme(profile.preferences?.theme || 'light');
        setNotifications(profile.preferences?.notifications ?? true);
        setDataSharing(profile.preferences?.dataSharing ?? false);
      } else {
        // Initialize with user data
        setDisplayName(user.name || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile data');
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Prepare profile data
      const profileData: Partial<UserProfile> = {
        displayName,
        email: user.email,
        createdAt: userProfile?.createdAt || Date.now(),
        preferences: {
          theme,
          notifications,
          dataSharing
        },
        medicalInfo: {
          age: age !== '' ? Number(age) : undefined,
          gender: gender || undefined,
          diagnosisDate: diagnosisDate ? new Date(diagnosisDate).getTime() : undefined,
          medications: medications.length > 0 ? medications : undefined
        }
      };

      // Save to Firebase Realtime Database
      const success = await UserProfileService.saveProfile(user.id, profileData);
      
      if (success) {
        // Update Firebase Auth profile if displayName changed
        if (auth.currentUser && displayName !== user.name) {
          await updateProfile(auth.currentUser, {
            displayName: displayName
          });
        }

        // Update user context
        setUser({
          ...user,
          name: displayName
        });

        setUserProfile(prev => ({ ...prev, ...profileData } as UserProfile));
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    if (newMedication.trim() && !medications.includes(newMedication.trim())) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication('');
    }
  };

  const handleRemoveMedication = (medication: string) => {
    setMedications(medications.filter(med => med !== medication));
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadUserProfile(); // Reset to original values
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Please sign in to view your profile</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">User Profile</CardTitle>
                <CardDescription>Manage your account and preferences</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="medical">Medical Info</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  {isEditing ? (
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{displayName || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="createdAt">Member Since</Label>
                  <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  {isEditing ? (
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-muted rounded-md">
                      <span className="capitalize">{gender || 'Not specified'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  {isEditing ? (
                    <Input
                      id="age"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Enter your age"
                      min="1"
                      max="120"
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md">
                      <span>{age || 'Not specified'}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <CardTitle className="text-lg">Medical Information</CardTitle>
              </div>
              <CardDescription>
                This information helps personalize your analysis and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosisDate">Diagnosis Date (Optional)</Label>
                {isEditing ? (
                  <Input
                    id="diagnosisDate"
                    type="date"
                    value={diagnosisDate}
                    onChange={(e) => setDiagnosisDate(e.target.value)}
                  />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    <span>
                      {diagnosisDate 
                        ? new Date(diagnosisDate).toLocaleDateString()
                        : 'Not specified'
                      }
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Current Medications</Label>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newMedication}
                        onChange={(e) => setNewMedication(e.target.value)}
                        placeholder="Add medication"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddMedication()}
                      />
                      <Button type="button" onClick={handleAddMedication} size="sm">
                        <Pill className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {medications.map((med, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {med}
                          <button
                            onClick={() => handleRemoveMedication(med)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {medications.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {medications.map((med, index) => (
                          <Badge key={index} variant="outline">{med}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No medications listed</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">App Preferences</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <Label>Theme</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                  </div>
                  {isEditing ? (
                    <Select value={theme} onValueChange={(value: 'light' | 'dark') => setTheme(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="capitalize">{theme}</Badge>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Label>Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Receive analysis reminders and updates</p>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                    disabled={!isEditing}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Label>Data Sharing</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Help improve our AI models (anonymous)</p>
                  </div>
                  <Switch
                    checked={dataSharing}
                    onCheckedChange={setDataSharing}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileEditor;
