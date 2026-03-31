import { useState } from "react";
import { Plus, Eye, EyeOff, Pencil, Trash2, Lock, Youtube, Instagram, Twitter, Facebook, Linkedin, Monitor } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface Credential {
  id: string;
  platform: string;
  category: string;
  username: string;
  password: string;
  notes: string;
}

const platformIcons: Record<string, any> = {
  "YouTube": Youtube,
  "Instagram": Instagram,
  "Twitter/X": Twitter,
  "Facebook": Facebook,
  "LinkedIn": Linkedin,
  "TikTok": Monitor,
  "Spotify for Podcasters": Monitor,
  "Apple Podcasts Connect": Monitor,
  "Riverside.fm": Monitor,
  "Descript": Monitor,
  "Buffer": Monitor,
  "Later": Monitor,
};

const categories = ["Social Media", "Hosting & Distribution", "Video Editing", "Scheduling & Analytics", "Other"];

const commonPlatforms = [
  { name: "YouTube", category: "Social Media" },
  { name: "Instagram", category: "Social Media" },
  { name: "Twitter/X", category: "Social Media" },
  { name: "Facebook", category: "Social Media" },
  { name: "LinkedIn", category: "Social Media" },
  { name: "TikTok", category: "Social Media" },
  { name: "Spotify for Podcasters", category: "Hosting & Distribution" },
  { name: "Apple Podcasts Connect", category: "Hosting & Distribution" },
  { name: "Riverside.fm", category: "Video Editing" },
  { name: "Descript", category: "Video Editing" },
  { name: "Buffer", category: "Scheduling & Analytics" },
  { name: "Later", category: "Scheduling & Analytics" },
];

export function Credentials() {
  const [credentials, setCredentials] = useState<Credential[]>([
    {
      id: "1",
      platform: "YouTube",
      category: "Social Media",
      username: "podcast@example.com",
      password: "youtube_secure_password_123",
      notes: "Main channel for video episodes"
    },
    {
      id: "2",
      platform: "Instagram",
      category: "Social Media",
      username: "@mypodcast",
      password: "instagram_secure_pass",
      notes: "For short clips and promotion"
    },
    {
      id: "3",
      platform: "Spotify for Podcasters",
      category: "Hosting & Distribution",
      username: "host@example.com",
      password: "spotify_hosting_pass",
      notes: "Primary hosting platform"
    }
  ]);

  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customPlatformName, setCustomPlatformName] = useState("");
  const [formData, setFormData] = useState({
    platform: "",
    category: "",
    username: "",
    password: "",
    notes: ""
  });

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAdd = () => {
    if (!formData.platform || !formData.username || !formData.password) return;

    const newCredential: Credential = {
      id: Date.now().toString(),
      platform: formData.platform,
      category: formData.category || "Other",
      username: formData.username,
      password: formData.password,
      notes: formData.notes
    };

    setCredentials([...credentials, newCredential]);
    setFormData({ platform: "", category: "", username: "", password: "", notes: "" });
    setIsAddDialogOpen(false);
  };

  const handleEdit = (credential: Credential) => {
    setEditingId(credential.id);
    setCustomPlatformName("");
    setFormData({
      platform: credential.platform,
      category: credential.category,
      username: credential.username,
      password: credential.password,
      notes: credential.notes
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingId || !formData.platform || !formData.username || !formData.password) return;

    setCredentials(credentials.map(cred => 
      cred.id === editingId 
        ? { ...cred, ...formData }
        : cred
    ));
    setFormData({ platform: "", category: "", username: "", password: "", notes: "" });
    setEditingId(null);
    setIsAddDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setCredentials(credentials.filter(cred => cred.id !== id));
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingId(null);
    setCustomPlatformName("");
    setFormData({ platform: "", category: "", username: "", password: "", notes: "" });
  };

  const groupedCredentials = credentials.reduce((acc, cred) => {
    if (!acc[cred.category]) {
      acc[cred.category] = [];
    }
    acc[cred.category].push(cred);
    return acc;
  }, {} as Record<string, Credential[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Credentials</h2>
          <p className="text-sm text-gray-600 mt-1">
            Secure storage for all your podcast platform credentials
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="size-4" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Credential" : "Add New Credential"}</DialogTitle>
              <DialogDescription>
                Store login details for your podcast tools and platforms
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform / Service</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => {
                    setFormData({ ...formData, platform: value });
                    const platformInfo = commonPlatforms.find(p => p.name === value);
                    if (platformInfo && !formData.category) {
                      setFormData(prev => ({ ...prev, category: platformInfo.category }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonPlatforms.map((platform) => (
                      <SelectItem key={platform.name} value={platform.name}>
                        {platform.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="Custom">Custom / Other</SelectItem>
                  </SelectContent>
                </Select>
                {formData.platform === "Custom" && (
                  <Input
                    placeholder="Enter custom platform name"
                    value={customPlatformName}
                    onChange={(e) => {
                      setCustomPlatformName(e.target.value);
                      setFormData({ ...formData, platform: e.target.value || "Custom" });
                    }}
                    className="mt-2"
                    autoFocus
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username / Email</Label>
                <Input
                  id="username"
                  placeholder="username or email@example.com"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional information or context"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={editingId ? handleUpdate : handleAdd}
                  disabled={!formData.platform || !formData.username || !formData.password}
                  className="flex-1"
                >
                  {editingId ? "Update" : "Add"} Credential
                </Button>
                <Button variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {credentials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="size-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No credentials stored yet</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Add your first credential to keep all your platform logins in one secure place
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCredentials).map(([category, creds]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                {category}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {creds.map((credential) => {
                  const Icon = platformIcons[credential.platform] || Monitor;
                  const isPasswordVisible = visiblePasswords.has(credential.id);

                  return (
                    <Card key={credential.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Icon className="size-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{credential.platform}</CardTitle>
                              <CardDescription className="text-xs mt-0.5">
                                {credential.username}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(credential)}
                              className="size-8 p-0"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(credential.id)}
                              className="size-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">Password</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePasswordVisibility(credential.id)}
                              className="h-auto p-1 text-gray-600 hover:text-gray-900"
                            >
                              {isPasswordVisible ? (
                                <EyeOff className="size-3.5" />
                              ) : (
                                <Eye className="size-3.5" />
                              )}
                            </Button>
                          </div>
                          <div className="font-mono text-sm bg-gray-100 rounded px-3 py-2 border border-gray-200">
                            {isPasswordVisible ? credential.password : "•".repeat(16)}
                          </div>
                        </div>

                        {credential.notes && (
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-700">Notes</span>
                            <p className="text-xs text-gray-600">{credential.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
