import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ChevronDown, ChevronUp, Target, Calendar, Plus } from "lucide-react";
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

export function PromotionPlan({ episode, assets, onUpdateEpisode, onAddAsset }: PromotionPlanProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
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

    // Generate a unique ID for the new asset
    const newAssetId = `asset-${Date.now()}`;
    
    const newAsset: Omit<Asset, "id"> = {
      name: newAssetName,
      url: newAssetUrl,
      type: "other",
      episode: episode.name
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
      {/* Header with collapse button */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-blue-700" />
              <h3 className="font-medium text-gray-900">Promotion Plan</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-8"
            >
              <ChevronUp className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const dayPlan = promotionPlan.find(d => d.day === day);
          const isDayComplete = (() => {
            if (!dayPlan) return false;
            const hasPlatform = dayPlan.platform;
            
            if (dayPlan.isManualPost !== false) {
              // Manual: requires asset, caption, and platform
              const hasAsset = dayPlan.assetId;
              const hasCaption = dayPlan.caption;
              return hasAsset && hasCaption && hasPlatform;
            } else {
              // Automated: requires only scheduled link and platform (asset is optional)
              const hasScheduledLink = dayPlan.scheduledPostLink;
              return hasScheduledLink && hasPlatform;
            }
          })();
          
          return (
            <Button
              key={day}
              variant={currentDay === day ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentDay(day)}
              className={`flex-shrink-0 ${isDayComplete ? "border-green-500" : ""}`}
            >
              Day {day} {isDayComplete && "✓"}
            </Button>
          );
        })}
      </div>

      {/* Content area - Single day view */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {renderDayForm(promotionPlan.find(d => d.day === currentDay)!)}
      </div>

      {/* Start Promotion Button */}
      <Card className="bg-gray-50 border-gray-300">
        <CardContent className="p-4">
          <Button
            className="w-full"
            disabled={!isPlanComplete}
            onClick={handleStartPromotionClick}
          >
            <Calendar className="size-4 mr-2" />
            Start Promotion Today
          </Button>
          {!isPlanComplete && (
            <p className="text-xs text-gray-600 text-center mt-2">
              Complete all 7 days to start promotion
            </p>
          )}
        </CardContent>
      </Card>

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promotion Plan Complete</DialogTitle>
            <DialogDescription>
              Your promotion plan is fully set up and ready to start.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-900">
                All 7 days have been completed and your promotion plan is ready to start.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleStartPromotionClick} className="flex-1">
                Start Promotion
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCompleteDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Promotion Incomplete Dialog */}
      <Dialog open={showIncompleteDialog} onOpenChange={setShowIncompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promotion Plan Incomplete</DialogTitle>
            <DialogDescription>
              Your promotion plan is not fully set up yet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-900">
                Please complete all 7 days of your promotion plan before starting.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowIncompleteDialog(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}