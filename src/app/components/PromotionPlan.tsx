import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ChevronDown, ChevronUp, Target, Calendar, Plus, Video, Image as ImageIcon, FileText, FolderOpen, Link as LinkIcon, X } from "lucide-react";
import { Episode, PromotionDay, Asset } from "../context/AppContext";

interface PromotionPlanProps {
  episode: Episode;
  assets: Asset[];
  onUpdateEpisode: (id: string, updates: Partial<Episode>) => void;
  onAddAsset?: (asset: Omit<Asset, "id">, callback: (assetId: string) => void) => void;
}

const platforms = [
  "Twitter/X",
  "Instagram",
  "LinkedIn",
  "Facebook",
  "TikTok",
  "YouTube",
  "Threads",
  "Newsletter",
  "Blog",
  "Other"
];

const assetTypeIcons: Record<string, React.ElementType> = {
  recording: Video,
  video: Video,
  image: ImageIcon,
  document: FileText,
  folder: FolderOpen,
};

interface AssetDropZoneProps {
  dayNumber: number;
  assetId?: string;
  assets: Asset[];
  isDragOver: boolean;
  isGlobalDragging: boolean;
  required?: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (assetId: string) => void;
  onClear: () => void;
}

function AssetDropZone({ dayNumber, assetId, assets, isDragOver, isGlobalDragging, required, onDragOver, onDragLeave, onDrop, onClear }: AssetDropZoneProps) {
  const assigned = assets.find(a => a.id === assetId);
  const IconComponent = assigned ? (assetTypeIcons[assigned.type] || LinkIcon) : LinkIcon;

  // Pulsing ready state: dragging has started somewhere but not yet over this zone
  const isReady = isGlobalDragging && !isDragOver && !assigned;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('assetId');
        if (id) onDrop(id);
      }}
      className={`flex items-center gap-3 p-2.5 rounded-lg border-2 transition-all duration-150 ${
        isDragOver
          ? 'border-blue-400 bg-blue-50 scale-[1.01]'
          : isReady
          ? 'border-blue-300 bg-blue-50 animate-pulse'
          : assigned
          ? 'border-gray-200 bg-white'
          : 'border-dashed border-gray-300 bg-gray-50'
      }`}
    >
      {/* Icon slot */}
      <div className={`size-8 rounded flex items-center justify-center flex-shrink-0 ${
        isDragOver || isReady ? 'bg-blue-100' : assigned ? 'bg-blue-50' : 'bg-gray-100'
      }`}>
        <IconComponent className={`size-4 ${isDragOver || isReady ? 'text-blue-500' : assigned ? 'text-blue-600' : 'text-gray-400'}`} />
      </div>

      {/* Text slot */}
      <div className="flex-1 min-w-0">
        {isDragOver ? (
          <p className="text-sm font-semibold text-blue-600">Drop here ↓</p>
        ) : isReady ? (
          <p className="text-sm font-medium text-blue-500">Drop here ↓</p>
        ) : assigned ? (
          <>
            <p className="text-sm font-medium text-gray-900 truncate">{assigned.name}</p>
            <p className="text-xs text-gray-500 truncate">{assigned.url}</p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">Drag from the library →</p>
            <p className="text-xs text-gray-400">or use the dropdown below</p>
          </>
        )}
      </div>

      {/* Clear button */}
      {assigned && !isDragOver && (
        <button
          onClick={onClear}
          className="size-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-300 hover:text-red-400 flex-shrink-0 transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function PromotionPlan({ episode, assets, onUpdateEpisode, onAddAsset }: PromotionPlanProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");
  const [animKey, setAnimKey] = useState(0);
  const prevDayRef = useRef(1);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [showConfirmPrompt, setShowConfirmPrompt] = useState(false);
  const prevCompleteRef = useRef<{ day: number; complete: boolean }>({ day: 0, complete: false });
  const hasInitializedDay = useRef(false);

  useEffect(() => {
    const onStart = () => setIsGlobalDragging(true);
    const onEnd = () => { setIsGlobalDragging(false); setDragOverDay(null); };
    window.addEventListener('dragstart', onStart);
    window.addEventListener('dragend', onEnd);
    return () => { window.removeEventListener('dragstart', onStart); window.removeEventListener('dragend', onEnd); };
  }, []);

  const goToDay = (day: number) => {
    setSlideDir(day > prevDayRef.current ? "right" : "left");
    prevDayRef.current = day;
    setCurrentDay(day);
    setAnimKey(k => k + 1);
  };
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddingAsset, setIsAddingAsset] = useState<number | null>(null);
  const [newAssetUrl, setNewAssetUrl] = useState("");
  const [newAssetName, setNewAssetName] = useState("");
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const [confirmedPlanDays, setConfirmedPlanDays] = useState<number[]>([]); // Track which days have been confirmed during planning
  
  // Initialize promotion plan if it doesn't exist
  const promotionPlan: PromotionDay[] = episode.promotionPlan || Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    isManualPost: true // Default to manual posting
  }));

  // Auto-navigate to the first incomplete day (based on plan data, not posted status)
  useEffect(() => {
    // Find the first day (1-7) that hasn't been filled out yet
    const firstIncompletePlanDay = [1, 2, 3, 4, 5, 6, 7].find(dayNum => {
      const dayPlan = promotionPlan.find(d => d.day === dayNum);
      if (!dayPlan) return true;
      
      const hasPlatform = dayPlan.platform;
      if (dayPlan.isManualPost !== false) {
        const hasAsset = dayPlan.assetId;
        const hasCaption = dayPlan.caption;
        return !(hasAsset && hasCaption && hasPlatform);
      } else {
        const hasScheduledLink = dayPlan.scheduledPostLink;
        return !(hasScheduledLink && hasPlatform);
      }
    });
    
    if (firstIncompletePlanDay) {
      setCurrentDay(firstIncompletePlanDay);
    } else {
      // All days have complete planning data - stay on Day 7
      setCurrentDay(7);
    }
  }, [promotionPlan]);

  const updateDayPlan = (day: number, updates: Partial<PromotionDay>) => {
    const updatedPlan = promotionPlan.map(d => 
      d.day === day ? { ...d, ...updates } : d
    );
    onUpdateEpisode(episode.id, { promotionPlan: updatedPlan });
  };

  // Check if all days are filled
  const isPlanComplete = promotionPlan.every(day => {
    const hasPlatform = day.platform;
    
    if (day.isManualPost !== false) {
      // Manual: requires asset, caption, and platform
      const hasAsset = day.assetId;
      const hasCaption = day.caption;
      return hasAsset && hasCaption && hasPlatform;
    } else {
      // Automated: requires only scheduled link and platform (asset is optional)
      const hasScheduledLink = day.scheduledPostLink;
      return hasScheduledLink && hasPlatform;
    }
  });

  const handleStartPromotion = () => {
    onUpdateEpisode(episode.id, {
      stage: "in-progress",
      promotionStartDate: startDate
    });
    setIsStartDialogOpen(false);
  };

  const handleAddInlineAsset = (dayNumber: number) => {
    if (!newAssetUrl || !newAssetName || !onAddAsset) return;

    const newAsset: Omit<Asset, "id"> = {
      name: newAssetName,
      url: newAssetUrl,
      type: "other",
      episode: episode.name,
      addedDate: new Date().toISOString().split('T')[0]
    };

    onAddAsset(newAsset, (assetId) => {
      // Automatically select the newly created asset for this day
      updateDayPlan(dayNumber, { assetId: assetId });
    });
    
    // Clear form
    setNewAssetUrl("");
    setNewAssetName("");
    setIsAddingAsset(null);
  };

  const handleConfirmDay = (dayNumber: number) => {
    // Add this day to local confirmed list
    if (!confirmedPlanDays.includes(dayNumber)) {
      const updatedConfirmed = [...confirmedPlanDays, dayNumber].sort((a, b) => a - b);
      setConfirmedPlanDays(updatedConfirmed);
      
      // Check if all 7 days are now confirmed
      if (updatedConfirmed.length === 7 && isPlanComplete) {
        // Show success dialog after a brief delay to let the UI update
        setTimeout(() => setShowCompleteDialog(true), 300);
      }
    }
    // The useEffect will automatically navigate to the next incomplete day
  };

  const handleStartPromotionClick = () => {
    if (!isPlanComplete) {
      setShowIncompleteDialog(true);
    } else {
      setIsStartDialogOpen(true);
    }
  };

  const renderDayForm = (day: PromotionDay) => {
    const isManualPost = day.isManualPost !== false; // Default to true
    const isAddingAssetForThisDay = isAddingAsset === day.day;
    const isDayComplete = (() => {
      const hasPlatform = day.platform;
      
      if (isManualPost) {
        // Manual: requires asset, caption, and platform
        const hasAsset = day.assetId;
        const hasCaption = day.caption;
        return hasAsset && hasCaption && hasPlatform;
      } else {
        // Automated: requires only scheduled link and platform (asset is optional)
        const hasScheduledLink = day.scheduledPostLink;
        return hasScheduledLink && hasPlatform;
      }
    })();

    return (
      <Card key={day.day} className="border-l-4 border-l-blue-500">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Day {day.day}</h4>
            <span className="text-xs text-gray-500">
              {isDayComplete ? "✓ Complete" : "Incomplete"}
            </span>
          </div>

          {/* Manual/Automated Toggle */}
          <div className="space-y-2">
            <Label>Posting Method</Label>
            <div className="flex gap-2">
              <Button
                variant={isManualPost ? "default" : "outline"}
                size="sm"
                onClick={() => updateDayPlan(day.day, { isManualPost: true })}
                className="flex-1"
              >
                Manual Post
              </Button>
              <Button
                variant={!isManualPost ? "default" : "outline"}
                size="sm"
                onClick={() => updateDayPlan(day.day, { isManualPost: false })}
                className="flex-1"
              >
                Schedule Post
              </Button>
            </div>
          </div>

          {/* Conditional Fields Based on Posting Method */}
          {isManualPost ? (
            <>
              {/* Content Asset */}
              <div className="space-y-2">
                <Label htmlFor={`asset-${day.day}`}>
                  Content Asset <span className="text-red-500">*</span>
                </Label>
                <AssetDropZone
                  dayNumber={day.day}
                  assetId={day.assetId}
                  assets={assets}
                  isDragOver={dragOverDay === day.day}
                  required
                  isGlobalDragging={isGlobalDragging}
                  onDragOver={() => setDragOverDay(day.day)}
                  onDragLeave={() => setDragOverDay(null)}
                  onDrop={(id) => { updateDayPlan(day.day, { assetId: id }); setDragOverDay(null); }}
                  onClear={() => updateDayPlan(day.day, { assetId: undefined })}
                />
                <Select
                  value={day.assetId || ""}
                  onValueChange={(value) => updateDayPlan(day.day, { assetId: value })}
                >
                  <SelectTrigger id={`asset-${day.day}`}>
                    <SelectValue placeholder="Select an asset from library" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        No assets available. Add one below.
                      </div>
                    ) : (
                      assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Add New Asset Inline */}
                {!isAddingAssetForThisDay ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingAsset(day.day)}
                    className="w-full flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="size-4" />
                    Add New Asset
                  </Button>
                ) : (
                  <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="space-y-2">
                      <Input
                        placeholder="Asset URL..."
                        value={newAssetUrl}
                        onChange={(e) => setNewAssetUrl(e.target.value)}
                      />
                      <Input
                        placeholder="Asset Name..."
                        value={newAssetName}
                        onChange={(e) => setNewAssetName(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddInlineAsset(day.day)}
                        disabled={!newAssetUrl || !newAssetName}
                        className="flex-1"
                      >
                        Save Asset
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAddingAsset(null);
                          setNewAssetUrl("");
                          setNewAssetName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Platform */}
              <div className="space-y-2">
                <Label htmlFor={`platform-${day.day}`}>
                  Platform <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={day.platform || ""}
                  onValueChange={(value) => updateDayPlan(day.day, { platform: value })}
                >
                  <SelectTrigger id={`platform-${day.day}`}>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Caption for Manual Posting */}
              <div className="space-y-2">
                <Label htmlFor={`caption-${day.day}`}>
                  Caption <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id={`caption-${day.day}`}
                  placeholder="Write the caption for this post..."
                  rows={3}
                  value={day.caption || ""}
                  onChange={(e) => updateDayPlan(day.day, { caption: e.target.value })}
                />
              </div>

              {/* Notes for Manual Posting */}
              <div className="space-y-2">
                <Label htmlFor={`notes-${day.day}`}>Notes (optional)</Label>
                <Textarea
                  id={`notes-${day.day}`}
                  placeholder="Add any posting instructions..."
                  rows={2}
                  value={day.notes || ""}
                  onChange={(e) => updateDayPlan(day.day, { notes: e.target.value })}
                />
              </div>
            </>
          ) : (
            <>
              {/* Content Asset - FIRST (Optional for scheduled posts) */}
              <div className="space-y-2">
                <Label htmlFor={`asset-${day.day}`}>
                  Content Asset <span className="text-gray-400">(optional)</span>
                </Label>
                <AssetDropZone
                  dayNumber={day.day}
                  assetId={day.assetId}
                  assets={assets}
                  isDragOver={dragOverDay === day.day}
                  isGlobalDragging={isGlobalDragging}
                  onDragOver={() => setDragOverDay(day.day)}
                  onDragLeave={() => setDragOverDay(null)}
                  onDrop={(id) => { updateDayPlan(day.day, { assetId: id }); setDragOverDay(null); }}
                  onClear={() => updateDayPlan(day.day, { assetId: undefined })}
                />
                <Select
                  value={day.assetId || ""}
                  onValueChange={(value) => updateDayPlan(day.day, { assetId: value })}
                >
                  <SelectTrigger id={`asset-${day.day}`}>
                    <SelectValue placeholder="Select an asset from library" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        No assets available. Add one below.
                      </div>
                    ) : (
                      assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Add New Asset Inline */}
                {!isAddingAssetForThisDay ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingAsset(day.day)}
                    className="w-full flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="size-4" />
                    Add New Asset
                  </Button>
                ) : (
                  <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="space-y-2">
                      <Input
                        placeholder="Asset URL..."
                        value={newAssetUrl}
                        onChange={(e) => setNewAssetUrl(e.target.value)}
                      />
                      <Input
                        placeholder="Asset Name..."
                        value={newAssetName}
                        onChange={(e) => setNewAssetName(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddInlineAsset(day.day)}
                        disabled={!newAssetUrl || !newAssetName}
                        className="flex-1"
                      >
                        Save Asset
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAddingAsset(null);
                          setNewAssetUrl("");
                          setNewAssetName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Scheduled Post Link - SECOND (Required) */}
              <div className="space-y-2">
                <Label htmlFor={`scheduled-${day.day}`}>
                  Scheduled Post Link <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`scheduled-${day.day}`}
                  placeholder="Paste link from scheduling tool..."
                  value={day.scheduledPostLink || ""}
                  onChange={(e) => updateDayPlan(day.day, { scheduledPostLink: e.target.value })}
                />
                <p className="text-xs text-gray-600">
                  Link to your scheduled post in Buffer, Hootsuite, or other scheduling tools
                </p>
              </div>

              {/* Platform - THIRD (Required) */}
              <div className="space-y-2">
                <Label htmlFor={`platform-${day.day}`}>
                  Platform <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={day.platform || ""}
                  onValueChange={(value) => updateDayPlan(day.day, { platform: value })}
                >
                  <SelectTrigger id={`platform-${day.day}`}>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Confirm Button at Bottom */}
          <div className="pt-2 border-t">
            <Button
              className="w-full"
              disabled={!isDayComplete}
              variant={isDayComplete ? "default" : "outline"}
              onClick={() => handleConfirmDay(day.day)}
            >
              Confirm Day {day.day}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isExpanded) {
    return (
      <div className="px-2">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 h-10"
          onClick={() => setIsExpanded(true)}
        >
          <Target className="size-4" />
          Create Promotion Plan
          <ChevronDown className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="px-2 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-blue-700" />
          <h3 className="font-semibold text-gray-900">Promotion Plan</h3>
          <span className="text-xs text-gray-400 font-normal">
            {promotionPlan.filter(day => {
              const hasPlatform = day.platform;
              return day.isManualPost !== false
                ? day.assetId && day.caption && hasPlatform
                : day.scheduledPostLink && hasPlatform;
            }).length} / 7 days complete
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleStartPromotionClick}
            className={`h-8 text-xs px-3 ${isPlanComplete ? "" : "opacity-70"}`}
          >
            <Calendar className="size-3 mr-1.5" />
            Start Promotion
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-8 w-8 p-0"
          >
            <ChevronUp className="size-4" />
          </Button>
        </div>
      </div>

      {/* Day selector — grid so all 7 fit without scrolling */}
      <div className="grid grid-cols-7 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const dayPlan = promotionPlan.find(d => d.day === day);
          const isDayComplete = (() => {
            if (!dayPlan) return false;
            const hasPlatform = dayPlan.platform;
            if (dayPlan.isManualPost !== false) {
              return !!(dayPlan.assetId && dayPlan.caption && hasPlatform);
            } else {
              return !!(dayPlan.scheduledPostLink && hasPlatform);
            }
          })();
          const isActive = currentDay === day;

          return (
            <button
              key={day}
              onClick={() => goToDay(day)}
              className={`relative flex flex-col items-center py-2 rounded-lg border text-xs font-medium transition-all ${
                isActive
                  ? "bg-gray-900 text-white border-gray-900"
                  : isDayComplete
                  ? "bg-green-50 text-green-700 border-green-400 hover:bg-green-100"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              <span className="text-[10px] opacity-60 font-normal">Day</span>
              <span className="text-sm font-bold leading-tight">{day}</span>
              {isDayComplete && (
                <span className={`text-[9px] mt-0.5 ${isActive ? "text-green-300" : "text-green-600"}`}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content area — animated slide on day change */}
      <div
        key={animKey}
        className="space-y-4 max-h-[600px] overflow-y-auto"
        style={{
          animation: `slideIn${slideDir === "right" ? "Right" : "Left"} 0.22s ease both`
        }}
      >
        {renderDayForm(promotionPlan.find(d => d.day === currentDay)!)}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>


      {/* Start Promotion Confirmation Dialog */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Promotion</DialogTitle>
            <DialogDescription>
              Confirm the start date for your 7-day promotion cycle
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {startDate === new Date().toISOString().split('T')[0] && (
                <p className="text-xs text-gray-600">Today</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                Once you start, the promotion will begin and the episode will move to "In Progress".
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleStartPromotion} className="flex-1">
                Confirm & Start
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsStartDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Promotion Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-sm text-center">
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
              <Calendar className="size-8 text-green-600" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-xl font-bold text-gray-900">
                Your plan is ready.
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                All 7 days are set. Your promotion plan is complete and locked in — time to launch it.
              </DialogDescription>
            </div>
            <div className="w-full space-y-2 pt-1">
              <Button onClick={handleStartPromotionClick} className="w-full h-11 text-base font-semibold">
                Start Promotion Now
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-gray-500"
                onClick={() => setShowCompleteDialog(false)}
              >
                Not yet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Promotion Incomplete Dialog */}
      <Dialog open={showIncompleteDialog} onOpenChange={setShowIncompleteDialog}>
        <DialogContent className="max-w-sm text-center">
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="size-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Target className="size-8 text-amber-600" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-xl font-bold text-gray-900">
                Not quite ready yet
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Add content for all 7 days before starting your promotion. Every day needs an asset, caption, and platform.
              </DialogDescription>
            </div>
            <div className="w-full space-y-2 pt-1">
              {/* Show which days are still missing */}
              <div className="flex gap-1.5 justify-center flex-wrap">
                {[1,2,3,4,5,6,7].map(day => {
                  const dayPlan = promotionPlan.find(d => d.day === day);
                  const complete = dayPlan && (
                    dayPlan.isManualPost !== false
                      ? dayPlan.assetId && dayPlan.caption && dayPlan.platform
                      : dayPlan.scheduledPostLink && dayPlan.platform
                  );
                  return (
                    <span
                      key={day}
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        complete ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      Day {day} {complete ? "✓" : ""}
                    </span>
                  );
                })}
              </div>
              <Button className="w-full mt-2" onClick={() => setShowIncompleteDialog(false)}>
                Go Back & Complete Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}