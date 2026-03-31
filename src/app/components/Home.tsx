import { useState, useEffect } from "react";
import { Plus, Calendar, Play, CheckCircle2, Circle, Pencil, Video, Image as ImageIcon, FileText, FolderOpen, Link as LinkIcon, ExternalLink, Copy, Check, Target, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { useApp, Episode } from "../context/AppContext";
import { PromotionPlan } from "./PromotionPlan";
import { TrophyShelf } from "./TrophyShelf";
import { ContentShowdown } from "./ContentShowdown";

const stages = [
  { value: "planning", label: "Planning", color: "bg-gray-400" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-500" },
  { value: "complete", label: "Complete", color: "bg-green-500" }
];

const assetTypes = [
  { value: "recording", label: "Recording", icon: Video },
  { value: "video", label: "Video", icon: Video },
  { value: "image", label: "Image/Thumbnail", icon: ImageIcon },
  { value: "document", label: "Document", icon: FileText },
  { value: "folder", label: "Folder", icon: FolderOpen },
  { value: "other", label: "Other", icon: LinkIcon },
];

// Extract YouTube video ID from various YouTube URL formats
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
    /youtube\.com\/watch\?.*v=([^&]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

function getYouTubeThumbnail(url: string): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// Find the next upcoming episode (soonest release date in the future)
function getNextUpcomingEpisode(episodes: Episode[]): Episode | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today
  
  const upcomingEpisodes = episodes.filter(ep => {
    if (!ep.releaseDate) return false;
    const releaseDate = new Date(ep.releaseDate);
    releaseDate.setHours(0, 0, 0, 0);
    return releaseDate >= now;
  });
  
  if (upcomingEpisodes.length === 0) return null;
  
  // Sort by release date (earliest first)
  upcomingEpisodes.sort((a, b) => {
    const dateA = new Date(a.releaseDate!);
    const dateB = new Date(b.releaseDate!);
    return dateA.getTime() - dateB.getTime();
  });
  
  return upcomingEpisodes[0];
}

// Calculate countdown for a given date
function getCountdown(releaseDate: string): { days: number; hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const release = new Date(releaseDate);
  
  const diffTime = release.getTime() - now.getTime();
  
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffTime % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds };
}

export function Home() {
  const { episodes, addEpisode, updateEpisode, assets, addAsset, showdowns } = useApp();
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(episodes[0]?.id || null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailView, setIsDetailView] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [showTrophyShelf, setShowTrophyShelf] = useState(() => {
    const saved = localStorage.getItem("showTrophyShelf");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [formData, setFormData] = useState({
    name: "",
    releaseDate: "",
    videoUrl: "",
    guestName: "",
    episodeNumber: ""
  });

  // Save trophy shelf preference
  useEffect(() => {
    localStorage.setItem("showTrophyShelf", JSON.stringify(showTrophyShelf));
  }, [showTrophyShelf]);

  // Listen for trophy shelf toggle from Root component
  useEffect(() => {
    const handleToggle = (event: CustomEvent) => {
      setShowTrophyShelf(event.detail);
    };
    window.addEventListener("trophyShelfToggle", handleToggle as EventListener);
    return () => {
      window.removeEventListener("trophyShelfToggle", handleToggle as EventListener);
    };
  }, []);

  const selectedEpisode = episodes.find(ep => ep.id === selectedEpisodeId);
  const nextUpcomingEpisode = getNextUpcomingEpisode(episodes);
  
  // Filter assets for the selected episode
  const episodeAssets = selectedEpisode 
    ? assets.filter(asset => asset.episode === selectedEpisode.name)
    : [];

  // Filter episodes by selected stage (show all if no stage selected)
  const filteredEpisodes = selectedStage 
    ? episodes.filter(ep => ep.stage === selectedStage)
    : episodes;

  // Reset image error when episode changes
  useEffect(() => {
    setImageError(false);
  }, [selectedEpisodeId]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleStage = (stage: string) => {
    // Clear the selected episode when toggling stage filters
    setSelectedEpisodeId(null);
    
    // If clicking the already selected stage, deselect it (show all)
    if (selectedStage === stage) {
      setSelectedStage(null);
    } else {
      // Otherwise select this stage
      setSelectedStage(stage);
    }
  };

  const handleCreateEpisode = () => {
    if (!formData.name || !formData.episodeNumber || !formData.videoUrl || !formData.releaseDate) return;

    const newEpisode: Episode = {
      id: Date.now().toString(),
      name: formData.name,
      releaseDate: formData.releaseDate,
      completedDays: [],
      stage: "planning",
      videoUrl: formData.videoUrl,
      guestName: formData.guestName || undefined,
      episodeNumber: formData.episodeNumber || undefined
    };

    addEpisode(newEpisode);
    setSelectedEpisodeId(newEpisode.id);
    setFormData({ name: "", releaseDate: "", videoUrl: "", guestName: "", episodeNumber: "" });
    setIsCreateDialogOpen(false);
  };

  const handleEditEpisode = () => {
    if (!selectedEpisodeId || !formData.name || !formData.releaseDate || !formData.videoUrl) return;

    updateEpisode(selectedEpisodeId, {
      name: formData.name,
      releaseDate: formData.releaseDate,
      videoUrl: formData.videoUrl,
      guestName: formData.guestName || undefined,
      episodeNumber: formData.episodeNumber || undefined
    });

    setFormData({ name: "", releaseDate: "", videoUrl: "", guestName: "", episodeNumber: "" });
    setIsEditDialogOpen(false);
  };

  const openEditDialog = () => {
    if (!selectedEpisode) return;
    
    setFormData({
      name: selectedEpisode.name,
      releaseDate: selectedEpisode.releaseDate,
      videoUrl: selectedEpisode.videoUrl || "",
      guestName: selectedEpisode.guestName || "",
      episodeNumber: selectedEpisode.episodeNumber || ""
    });
    setIsEditDialogOpen(true);
  };

  const getStageProgress = (stage: string): number => {
    if (stage === "planning") return 0;
    if (stage === "in-progress") return 50;
    if (stage === "complete") return 100;
    return 0;
  };

  return (
    <>
      {!isDetailView ? (
        <>
          {/* Main Dashboard View */}
          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Left Panel - Episode List */}
            <div className="w-[420px] flex flex-col gap-4">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full flex items-center gap-2">
                    <Plus className="size-4" />
                    Create New Episode
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Episode</DialogTitle>
                    <DialogDescription>
                      Start a new 7-day promotion cycle for your podcast episode
                    </DialogDescription>
                  </DialogHeader>

                  {/* Subtle reminder line */}
                  <div className="border-t border-gray-200 pt-4 pb-2">
                    <p className="text-sm text-gray-600 italic">
                      Only create an episode once you've finished recording.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Episode Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g., Episode: Guest Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="episodeNumber">
                        Episode Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="episodeNumber"
                        type="number"
                        placeholder="e.g., 13"
                        value={formData.episodeNumber}
                        onChange={(e) => setFormData({ ...formData, episodeNumber: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="videoUrl">
                        Full Video Link <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="videoUrl"
                        placeholder="e.g. Riverside recording, YouTube upload, Google Drive or Dropbox file — paste whatever link you have"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="releaseDate">
                        Release Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="releaseDate"
                        type="date"
                        value={formData.releaseDate}
                        onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guestName">Guest Name(s)</Label>
                      <Input
                        id="guestName"
                        placeholder="Leave blank if solo episode"
                        value={formData.guestName}
                        onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleCreateEpisode}
                        disabled={!formData.name || !formData.episodeNumber || !formData.videoUrl || !formData.releaseDate}
                        className="flex-1"
                      >
                        Create Episode
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          setFormData({ name: "", releaseDate: "", videoUrl: "", guestName: "", episodeNumber: "" });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Episode</DialogTitle>
                    <DialogDescription>
                      Update details for your podcast episode
                    </DialogDescription>
                  </DialogHeader>

                  {/* Subtle reminder line */}
                  <div className="border-t border-gray-200 pt-4 pb-2">
                    <p className="text-sm text-gray-600 italic">
                      Only create an episode once you've finished recording.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">
                        Episode Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-name"
                        placeholder="e.g., Episode: Guest Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-episodeNumber">
                        Episode Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-episodeNumber"
                        type="number"
                        placeholder="e.g., 13"
                        value={formData.episodeNumber}
                        onChange={(e) => setFormData({ ...formData, episodeNumber: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-videoUrl">
                        Full Video Link <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-videoUrl"
                        placeholder="e.g. Riverside recording, YouTube upload, Google Drive or Dropbox file — paste whatever link you have"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-releaseDate">
                        Release Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-releaseDate"
                        type="date"
                        value={formData.releaseDate}
                        onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-guestName">Guest Name(s)</Label>
                      <Input
                        id="edit-guestName"
                        placeholder="Leave blank if solo episode"
                        value={formData.guestName}
                        onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleEditEpisode}
                        disabled={!formData.name || !formData.episodeNumber || !formData.videoUrl || !formData.releaseDate}
                        className="flex-1"
                      >
                        Update Episode
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditDialogOpen(false);
                          setFormData({ name: "", releaseDate: "", videoUrl: "", guestName: "", episodeNumber: "" });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Next Episode Release Header */}
              {nextUpcomingEpisode && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-2.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-blue-900 uppercase tracking-wide">
                      <Calendar className="size-3.5" />
                      Next Episode Release
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm leading-tight">
                      {nextUpcomingEpisode.episodeNumber 
                        ? `Episode ${nextUpcomingEpisode.episodeNumber}: ${nextUpcomingEpisode.name}`
                        : nextUpcomingEpisode.name}
                    </h3>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-600">
                        {new Date(nextUpcomingEpisode.releaseDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <div className="flex gap-1">
                        <div className="bg-white rounded px-1.5 py-0.5 text-center border border-blue-200">
                          <span className="text-xs font-bold text-blue-700">
                            {getCountdown(nextUpcomingEpisode.releaseDate).days}d
                          </span>
                        </div>
                        <div className="bg-white rounded px-1.5 py-0.5 text-center border border-blue-200">
                          <span className="text-xs font-bold text-blue-700">
                            {getCountdown(nextUpcomingEpisode.releaseDate).hours}h
                          </span>
                        </div>
                        <div className="bg-white rounded px-1.5 py-0.5 text-center border border-blue-200">
                          <span className="text-xs font-bold text-blue-700">
                            {getCountdown(nextUpcomingEpisode.releaseDate).minutes}m
                          </span>
                        </div>
                        <div className="bg-white rounded px-1.5 py-0.5 text-center border border-blue-200">
                          <span className="text-xs font-bold text-blue-700">
                            {getCountdown(nextUpcomingEpisode.releaseDate).seconds}s
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stage Filter Toggles */}
              <div className="flex gap-2 px-2">
                {stages.map((stage) => {
                  const isActive = selectedStage === stage.value;
                  const count = episodes.filter(ep => ep.stage === stage.value).length;
                  
                  return (
                    <Button
                      key={stage.value}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 text-xs h-8 ${
                        isActive 
                          ? stage.value === "complete" 
                            ? "bg-green-600 hover:bg-green-700" 
                            : stage.value === "in-progress"
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-600 hover:bg-gray-700"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => toggleStage(stage.value)}
                    >
                      {stage.label} ({count})
                    </Button>
                  );
                })}
              </div>

              {/* Episode List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 px-2">
                {filteredEpisodes.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Play className="size-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No episodes yet
                      </h3>
                      <p className="text-sm text-gray-600 text-center">
                        Create your first episode to start tracking your promotion cycle
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  [...filteredEpisodes]
                    .sort((a, b) => {
                      // Sort: planning and in-progress first, complete last
                      if (a.stage === "complete" && b.stage !== "complete") return 1;
                      if (a.stage !== "complete" && b.stage === "complete") return -1;
                      return 0;
                    })
                    .map((episode) => {
                    const isSelected = selectedEpisodeId === episode.id;
                    const stageInfo = stages.find(s => s.value === episode.stage);
                    const hasActivePromotion = episode.stage === "in-progress" || episode.completedDays.length > 0;

                    return (
                      <Card
                        key={episode.id}
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? "ring-2 ring-blue-600 bg-blue-50/50" 
                            : episode.stage === "complete"
                            ? "bg-green-50 hover:shadow-sm hover:border-gray-300"
                            : "hover:shadow-sm hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedEpisodeId(episode.id)}
                      >
                        <CardContent className="p-2.5 space-y-1.5">
                          {/* Episode Name */}
                          <h3 className="font-medium text-gray-900 text-sm leading-tight">
                            {episode.episodeNumber 
                              ? `Episode ${episode.episodeNumber}: ${episode.name}`
                              : episode.name}
                          </h3>

                          {/* Release Date */}
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-600">Release Date:</span>
                            <span className="text-gray-900">
                              {new Date(episode.releaseDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-600">Status:</span>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs py-0 h-5 ${
                                episode.stage === "complete" 
                                  ? "bg-green-100 text-green-700" 
                                  : ""
                              }`}
                            >
                              {stageInfo?.label}
                            </Badge>
                          </div>

                          {/* 7-Day Promotion Tracker (only if active) */}
                          {hasActivePromotion && (
                            <div className="pt-1.5 border-t border-gray-200">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                                  const isCompleted = episode.completedDays.includes(day);
                                  return (
                                    <div
                                      key={day}
                                      className={`flex-1 h-6 rounded flex items-center justify-center transition-colors ${
                                        isCompleted
                                          ? "bg-green-500 text-white"
                                          : "bg-gray-100 text-gray-400"
                                      }`}
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 className="size-3" />
                                      ) : (
                                        <Circle className="size-3" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Panel - Gallery View */}
            <div className="flex-1">
              {selectedEpisode ? (
                <Card className="h-full">
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {selectedEpisode.name}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Release: {new Date(selectedEpisode.releaseDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog();
                        }}
                        className="flex items-center gap-2"
                      >
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                    </div>

                    {/* Gallery Content */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="w-full max-w-2xl space-y-4">
                        {selectedEpisode.videoUrl ? (
                          !imageError ? (
                            <img
                              key={selectedEpisodeId}
                              src={getYouTubeThumbnail(selectedEpisode.videoUrl) || ""}
                              alt={`${selectedEpisode.name} thumbnail`}
                              className="w-full rounded-lg shadow-md"
                              onError={() => setImageError(true)}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                              <Video className="size-16 mb-4 text-gray-400" />
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                Could not load video thumbnail
                              </p>
                              <p className="text-xs text-gray-600">
                                Make sure the video URL is accessible
                              </p>
                            </div>
                          )
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <Play className="size-16 mb-4 text-gray-400" />
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              No video asset linked
                            </p>
                            <p className="text-xs text-gray-600">
                              Add a YouTube link in Asset Library to see a preview here
                            </p>
                          </div>
                        )}
                        
                        {/* View Promotion Plan Button */}
                        <Button
                          onClick={() => setIsDetailView(true)}
                          className="w-full"
                          size="lg"
                        >
                          View Promotion Plan
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full">
                  <CardContent className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Play className="size-16 mb-4 text-gray-400 mx-auto" />
                      <p className="text-sm">
                        Select an episode to view its preview
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Trophy Shelf - Bottom of Home Page */}
          {showTrophyShelf && <TrophyShelf episodes={episodes} showdowns={showdowns} />}
        </>
      ) : (
        /* Full-Page Episode Detail View */
        selectedEpisode && (
          <div className="h-[calc(100vh-200px)] flex flex-col">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDetailView(false)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                
                {/* Thumbnail */}
                {selectedEpisode.videoUrl && (
                  !imageError ? (
                    <img
                      src={getYouTubeThumbnail(selectedEpisode.videoUrl) || ""}
                      alt={`${selectedEpisode.name} thumbnail`}
                      className="w-24 h-14 object-cover rounded border border-gray-200"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-24 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                      <Video className="size-6 text-gray-400" />
                    </div>
                  )
                )}
                
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {selectedEpisode.episodeNumber 
                      ? `Episode ${selectedEpisode.episodeNumber}: ${selectedEpisode.name}`
                      : selectedEpisode.name}
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Release: {new Date(selectedEpisode.releaseDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDetailView(false);
                  openEditDialog();
                }}
                className="flex items-center gap-2"
              >
                <Pencil className="size-4" />
                Edit
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pt-6 space-y-6">

              {/* Two-column: Plan (left) + Library (right) */}
              <div className="flex gap-6 items-start">

                {/* Left: Promotion Plan + Progress */}
                <div className="flex-1 min-w-0 space-y-4">
                  <PromotionPlan
                    episode={selectedEpisode}
                    assets={episodeAssets}
                    onUpdateEpisode={updateEpisode}
                    onAddAsset={(asset, callback) => {
                      const newAssetId = `asset-${Date.now()}`;
                      const newAsset = {
                        ...asset,
                        id: newAssetId,
                        addedDate: new Date().toISOString().split('T')[0]
                      };
                      addAsset(newAsset);
                      callback(newAssetId);
                    }}
                  />

                  {/* 7-Day Promotion Progress */}
                  {(selectedEpisode.stage === "in-progress" || selectedEpisode.completedDays.length > 0) && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-gray-900">Promotion Progress</h3>
                          <span className="text-sm text-gray-600">
                            Day {selectedEpisode.completedDays.length} of 7
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                            const isCompleted = selectedEpisode.completedDays.includes(day);
                            return (
                              <div
                                key={day}
                                className={`flex-1 h-10 rounded-md flex items-center justify-center transition-colors ${
                                  isCompleted
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="size-4" />
                                ) : (
                                  <Circle className="size-4" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right: Episode Library (sticky) */}
                <div className="w-72 flex-shrink-0 sticky top-0">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900">Episode Library</h3>
                        <Badge variant="secondary" className="text-xs">
                          {episodeAssets.length} {episodeAssets.length === 1 ? 'asset' : 'assets'}
                        </Badge>
                      </div>

                      {episodeAssets.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <LinkIcon className="size-10 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No assets yet</p>
                          <p className="text-xs mt-1 text-gray-400">Assets from the Asset Library will appear here</p>
                        </div>
                      ) : (
                        <div>
                        <p className="text-xs text-gray-400 mb-2">Drag any asset into a day's content field</p>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                          {episodeAssets.map((asset) => {
                            const assetType = assetTypes.find(t => t.value === asset.type);
                            const IconComponent = assetType?.icon || LinkIcon;
                            return (
                              <div
                                key={asset.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('assetId', asset.id);
                                  e.dataTransfer.effectAllowed = 'copy';
                                }}
                                className="group relative flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors cursor-grab active:cursor-grabbing active:opacity-60 active:border-blue-400"
                              >
                                {/* Hover tooltip */}
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                                  Drag to assign to a day
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                </div>
                                <div className="size-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                                  <IconComponent className="size-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{asset.url}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" className="size-8 p-0"
                                    onClick={() => copyToClipboard(asset.url, asset.id)}>
                                    {copiedId === asset.id
                                      ? <Check className="size-4 text-green-600" />
                                      : <Copy className="size-4" />}
                                  </Button>
                                  <Button variant="ghost" size="sm" className="size-8 p-0"
                                    onClick={() => window.open(asset.url, '_blank')}>
                                    <ExternalLink className="size-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Content Showdown — at the bottom */}
              <ContentShowdown episode={selectedEpisode} assets={episodeAssets} />

            </div>
          </div>
        )
      )}
    </>
  );
}