import { useState } from "react";
import { Plus, Link as LinkIcon, Search, ExternalLink, Copy, Pencil, Trash2, Filter, Video, Image as ImageIcon, FileText, FolderOpen, Sparkles, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { useApp, Asset } from "../context/AppContext";

const assetTypes = [
  { value: "recording", label: "Recording", icon: Video },
  { value: "video", label: "Video", icon: Video },
  { value: "image", label: "Image/Thumbnail", icon: ImageIcon },
  { value: "document", label: "Document", icon: FileText },
  { value: "folder", label: "Folder", icon: FolderOpen },
  { value: "other", label: "Other", icon: LinkIcon },
];

export function AssetLibrary() {
  const { assets, addAsset, updateAsset, deleteAsset } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [episodeFilter, setEpisodeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    episode: "",
    type: "other"
  });

  // Get unique episodes for filter
  const episodes = Array.from(new Set(assets.map(a => a.episode))).sort();

  const handleAdd = () => {
    if (!formData.name || !formData.url || !formData.episode) return;

    const newAsset: Asset = {
      id: Date.now().toString(),
      name: formData.name,
      url: formData.url,
      episode: formData.episode,
      type: formData.type,
      addedDate: new Date().toISOString().split('T')[0]
    };

    addAsset(newAsset);
    setFormData({ name: "", url: "", episode: "", type: "other" });
    setIsAddDialogOpen(false);
  };

  const handleEdit = (asset: Asset) => {
    setEditingId(asset.id);
    setFormData({
      name: asset.name,
      url: asset.url,
      episode: asset.episode,
      type: asset.type
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingId || !formData.name || !formData.url || !formData.episode) return;

    updateAsset(editingId, formData);
    setFormData({ name: "", url: "", episode: "", type: "other" });
    setEditingId(null);
    setIsAddDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteAsset(id);
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingId(null);
    setFormData({ name: "", url: "", episode: "", type: "other" });
  };

  const handleCopyLink = async (url: string, id: string) => {
    try {
      // Try modern Clipboard API first
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      // Fallback for when Clipboard API is blocked
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (e) {
        console.error('Failed to copy:', e);
      }
      document.body.removeChild(textarea);
    }
  };

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.episode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEpisode = episodeFilter === "all" || asset.episode === episodeFilter;
    return matchesSearch && matchesEpisode;
  });

  // Group by episode
  const groupedAssets = filteredAssets.reduce((acc, asset) => {
    // Use episode number as the grouping key if available, otherwise use episode name
    const groupKey = asset.episodeNumber ? `Episode ${asset.episodeNumber}` : asset.episode;
    if (!acc[groupKey]) {
      acc[groupKey] = {
        assets: [],
        episodeNumber: asset.episodeNumber,
        episodeName: asset.episode
      };
    }
    acc[groupKey].assets.push(asset);
    return acc;
  }, {} as Record<string, { assets: Asset[], episodeNumber?: string, episodeName: string }>);

  // Sort groups by episode number (descending - most recent first)
  const sortedGroups = Object.entries(groupedAssets).sort(([keyA, groupA], [keyB, groupB]) => {
    const numA = groupA.episodeNumber ? parseInt(groupA.episodeNumber) : 0;
    const numB = groupB.episodeNumber ? parseInt(groupB.episodeNumber) : 0;
    
    // If both have episode numbers, sort numerically (descending)
    if (numA && numB) return numB - numA;
    
    // If only one has an episode number, prioritize it
    if (numA && !numB) return -1;
    if (!numA && numB) return 1;
    
    // If neither has episode numbers, sort alphabetically
    return keyB.localeCompare(keyA);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Asset Library</h2>
          <p className="text-sm text-gray-600 mt-1">
            Organize and access all your podcast media links in one place
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="size-4" />
              Add Asset Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Asset" : "Add New Asset Link"}</DialogTitle>
              <DialogDescription>
                Store a link to your recording, video, image, or file
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Custom Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., TY Bello — Full Recording"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Give this asset a recognizable name for your team
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL / Link</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="episode">Episode</Label>
                <Input
                  id="episode"
                  placeholder="e.g., Episode 12"
                  value={formData.episode}
                  onChange={(e) => setFormData({ ...formData, episode: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Asset Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={editingId ? handleUpdate : handleAdd}
                  disabled={!formData.name || !formData.url || !formData.episode}
                  className="flex-1"
                >
                  {editingId ? "Update" : "Add"} Asset
                </Button>
                <Button variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search by name or episode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={episodeFilter} onValueChange={setEpisodeFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="size-4 mr-2" />
                <SelectValue placeholder="All Episodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Episodes</SelectItem>
                {episodes.map((episode) => (
                  <SelectItem key={episode} value={episode}>
                    {episode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Display */}
      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LinkIcon className="size-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || episodeFilter !== "all" ? "No assets found" : "No assets yet"}
            </h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              {searchQuery || episodeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Add your first asset link to start organizing your podcast media"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedGroups.map(([episode, group]) => (
            <Card key={episode}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    {group.episodeNumber 
                      ? `Episode ${group.episodeNumber}: ${group.episodeName}`
                      : group.episodeName}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {group.assets.length} {group.assets.length === 1 ? "asset" : "assets"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-0 divide-y divide-gray-100">
                  {group.assets.map((asset) => {
                    const assetType = assetTypes.find(t => t.value === asset.type);
                    const Icon = assetType?.icon || LinkIcon;
                    const isCopied = copiedId === asset.id;

                    return (
                      <div key={asset.id} className="py-3 flex items-center gap-4 hover:bg-gray-50 -mx-6 px-6 transition-colors">
                        <div className="size-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <Icon className="size-4 text-blue-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-gray-900">{asset.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {assetType?.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                            <LinkIcon className="size-3" />
                            <span className="truncate max-w-md">{asset.url}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(asset.url, '_blank')}
                            className="text-xs h-8"
                          >
                            <ExternalLink className="size-3 mr-1.5" />
                            Open
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(asset)}
                            className="size-8 p-0"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteAssetId(asset.id)}
                            className="size-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteAssetId !== null} onOpenChange={(open) => !open && setDeleteAssetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this link?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The asset link will be permanently removed from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteAssetId) {
                  handleDelete(deleteAssetId);
                  setDeleteAssetId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}