import { useState } from "react";
import { Swords, Lock, Plus, Trophy, Clock, ChevronLeft, ChevronRight, CheckCircle2, Crown, HelpCircle, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Episode, Asset, Showdown, ShowdownContender, useApp } from "../context/AppContext";

const DEFAULT_METRICS = ["Comments", "Saves", "Shares", "Views", "Conversions"];

function isPlanComplete(episode: Episode): boolean {
  if (!episode.promotionPlan || episode.promotionPlan.length < 7) return false;
  return episode.promotionPlan.every(day => {
    const hasPlatform = day.platform;
    if (day.isManualPost !== false) {
      return day.assetId && day.caption && hasPlatform;
    } else {
      return day.scheduledPostLink && hasPlatform;
    }
  });
}

function formatDeadline(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

function isDeadlinePassed(deadline: string): boolean {
  return new Date() >= new Date(deadline);
}

interface ContentShowdownProps {
  episode: Episode;
  assets: Asset[];
}

// ─── Wizard ──────────────────────────────────────────────────────────────────

interface WizardProps {
  episode: Episode;
  assets: Asset[];
  onCancel: () => void;
  onCreated: () => void;
}

function CreateShowdownWizard({ episode, assets, onCancel, onCreated }: WizardProps) {
  const { addShowdown, customMetrics, addCustomMetric } = useApp();
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [metric, setMetric] = useState("");
  const [customMetricInput, setCustomMetricInput] = useState("");
  const [showCustomMetricInput, setShowCustomMetricInput] = useState(false);
  const [whatTesting, setWhatTesting] = useState("");
  const [whyMatters, setWhyMatters] = useState("");
  const [podcastGoals, setPodcastGoals] = useState("");
  const [engagementPlan, setEngagementPlan] = useState("");

  // Step 2 fields
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  // Step 3 fields
  const [deadline, setDeadline] = useState("");

  const allMetrics = [...DEFAULT_METRICS, ...customMetrics.map(m => m.name)];

  const planDays = episode.promotionPlan || [];

  const getAssetName = (assetId?: string) => {
    if (!assetId) return "No asset";
    const asset = assets.find(a => a.id === assetId);
    return asset?.name || "Unknown asset";
  };

  const handleSaveCustomMetric = () => {
    const trimmed = customMetricInput.trim();
    if (!trimmed || allMetrics.includes(trimmed)) return;
    addCustomMetric({ id: `metric-${Date.now()}`, name: trimmed });
    setMetric(trimmed);
    setCustomMetricInput("");
    setShowCustomMetricInput(false);
  };

  const toggleDay = (dayNum: number) => {
    setSelectedDays(prev =>
      prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum]
    );
  };

  const handleStart = () => {
    const contenders: ShowdownContender[] = selectedDays.map(dayNum => {
      const dayPlan = planDays.find(d => d.day === dayNum);
      return {
        id: `contender-${Date.now()}-${dayNum}`,
        dayNumber: dayNum,
        assetId: dayPlan?.assetId,
        assetName: getAssetName(dayPlan?.assetId),
        platform: dayPlan?.platform,
      };
    });

    const showdown: Showdown = {
      id: `showdown-${Date.now()}`,
      episodeId: episode.id,
      name,
      metric,
      whatTesting,
      whyMatters: whyMatters || undefined,
      podcastGoals: podcastGoals || undefined,
      engagementPlan: engagementPlan || undefined,
      contenders,
      deadline,
      status: "running",
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    addShowdown(showdown);
    onCreated();
  };

  const step1Valid = name.trim() && metric && whatTesting.trim();
  const step2Valid = selectedDays.length >= 2;
  const step3Valid = !!deadline;

  return (
    <div className="space-y-4">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold ${
              s < step ? "bg-green-500 text-white" :
              s === step ? "bg-gray-900 text-white" :
              "bg-gray-100 text-gray-400"
            }`}>
              {s < step ? <CheckCircle2 className="size-4" /> : s}
            </div>
            <span className={`text-xs ${s === step ? "text-gray-900 font-medium" : "text-gray-400"}`}>
              {s === 1 ? "Define" : s === 2 ? "Select Content" : "Set Deadline"}
            </span>
            {s < 3 && <ChevronRight className="size-3 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">Step 1: Define the Metric & Strategy</h3>
            <p className="text-xs text-gray-500 mt-0.5">Name this showdown and set what you're testing for.</p>
          </div>

          <div className="space-y-2">
            <Label>Showdown Name <span className="text-red-500">*</span></Label>
            <Input
              placeholder='e.g. "Hook Style Test — Ep 12"'
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Metric <span className="text-red-500">*</span></Label>
            <Select value={metric} onValueChange={val => {
              if (val === "__custom__") {
                setShowCustomMetricInput(true);
              } else {
                setMetric(val);
                setShowCustomMetricInput(false);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="What are you measuring?" />
              </SelectTrigger>
              <SelectContent>
                {allMetrics.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
                <SelectItem value="__custom__">
                  <span className="flex items-center gap-2 text-blue-600">
                    <Plus className="size-3" /> Add custom metric…
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {showCustomMetricInput && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder='e.g. "ManyChat responses"'
                  value={customMetricInput}
                  onChange={e => setCustomMetricInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSaveCustomMetric()}
                />
                <Button size="sm" onClick={handleSaveCustomMetric} disabled={!customMetricInput.trim()}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCustomMetricInput(false)}>
                  Cancel
                </Button>
              </div>
            )}

            {metric && !showCustomMetricInput && (
              <p className="text-xs text-gray-500">Measuring: <span className="font-medium text-gray-700">{metric}</span></p>
            )}
          </div>

          <div className="space-y-2">
            <Label>What are you testing? <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Which hook style drives more conversation"
              value={whatTesting}
              onChange={e => setWhatTesting(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Why does this matter right now? <span className="text-gray-400 text-xs">(optional)</span></Label>
            <Textarea
              placeholder="We want to understand what gets our audience talking before our next series launch."
              rows={2}
              value={whyMatters}
              onChange={e => setWhyMatters(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>How does this connect to your podcast goals? <span className="text-gray-400 text-xs">(optional)</span></Label>
            <Textarea
              placeholder="More comments mean more community signals which can give us ideas for product launches."
              rows={2}
              value={podcastGoals}
              onChange={e => setPodcastGoals(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Engagement plan <span className="text-gray-400 text-xs">(optional)</span></Label>
            <Textarea
              placeholder="All three clips posted to Stories same day, 30 mins of post-engagement and responding to comments."
              rows={2}
              value={engagementPlan}
              onChange={e => setEngagementPlan(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={() => setStep(2)} disabled={!step1Valid} className="flex-1">
              Next: Select Content <ChevronRight className="size-4 ml-1" />
            </Button>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">Step 2: Select Content</h3>
            <p className="text-xs text-gray-500 mt-0.5">Pick 2 or more pieces from your Promotion Plan to go head to head.</p>
          </div>

          <div className="space-y-2">
            {planDays.map(day => {
              const selected = selectedDays.includes(day.day);
              const assetName = getAssetName(day.assetId);
              return (
                <button
                  key={day.day}
                  onClick={() => toggleDay(day.day)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selected
                      ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Day {day.day}</span>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{assetName}</p>
                      {day.platform && (
                        <p className="text-xs text-gray-500 mt-0.5">{day.platform}</p>
                      )}
                    </div>
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selected ? "border-gray-900 bg-gray-900" : "border-gray-300"
                    }`}>
                      {selected && <CheckCircle2 className="size-3 text-white" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedDays.length === 1 && (
            <p className="text-xs text-amber-600">Select at least one more piece of content.</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="size-4 mr-1" /> Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!step2Valid} className="flex-1">
              Next: Set Deadline <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3 ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">Step 3: Set a Deadline & Start</h3>
            <p className="text-xs text-gray-500 mt-0.5">The showdown runs until this date. When it hits, you'll enter the results.</p>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg border p-3 space-y-1.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Showdown summary</p>
            <p className="text-sm font-semibold text-gray-900">{name}</p>
            <p className="text-xs text-gray-600">Metric: <span className="font-medium">{metric}</span></p>
            <p className="text-xs text-gray-600">Testing: <span className="font-medium">{whatTesting}</span></p>
            <p className="text-xs text-gray-600">
              Contenders: {selectedDays.sort((a,b) => a-b).map(d => `Day ${d}`).join(" vs ")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline <span className="text-red-500">*</span></Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ChevronLeft className="size-4 mr-1" /> Back
            </Button>
            <Button onClick={handleStart} disabled={!step3Valid} className="flex-1">
              <Swords className="size-4 mr-2" /> Start Showdown
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Showdown Card ────────────────────────────────────────────────────────────

interface ShowdownCardProps {
  showdown: Showdown;
  assets: Asset[];
}

function ShowdownCard({ showdown, assets }: ShowdownCardProps) {
  const { updateShowdown } = useApp();
  const [stats, setStats] = useState<Record<string, string>>({});
  const [reflection1, setReflection1] = useState(showdown.reflection1 || "");
  const [reflection2, setReflection2] = useState(showdown.reflection2 || "");
  const [isExpanded, setIsExpanded] = useState(false);

  const getAssetName = (assetId?: string) => {
    if (!assetId) return "No asset";
    return assets.find(a => a.id === assetId)?.name || "Unknown asset";
  };

  const deadlinePassed = showdown.deadline ? isDeadlinePassed(showdown.deadline) : false;

  const handleEnterResults = () => {
    updateShowdown(showdown.id, { status: "results" });
  };

  const handleSubmitResults = () => {
    const updatedContenders = showdown.contenders.map(c => ({
      ...c,
      finalStat: parseFloat(stats[c.id] || "0") || 0,
    }));

    const winner = updatedContenders.reduce((best, c) =>
      (c.finalStat ?? 0) > (best.finalStat ?? 0) ? c : best
    );

    updateShowdown(showdown.id, {
      contenders: updatedContenders,
      winnerId: winner.id,
      status: "complete",
    });
  };

  const handleSaveReflection = () => {
    updateShowdown(showdown.id, { reflection1, reflection2 });
  };

  const winner = showdown.contenders.find(c => c.id === showdown.winnerId);
  const reflectionSaved = !!(showdown.reflection1 || showdown.reflection2);

  const statusColor = {
    running: "bg-blue-100 text-blue-700",
    results: "bg-amber-100 text-amber-700",
    complete: "bg-green-100 text-green-700",
    setup: "bg-gray-100 text-gray-600",
  }[showdown.status];

  const statusLabel = {
    running: "Running",
    results: "Enter Results",
    complete: "Complete",
    setup: "Setup",
  }[showdown.status];

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Swords className="size-4 text-gray-500 flex-shrink-0" />
              <h4 className="font-semibold text-gray-900 text-sm">{showdown.name}</h4>
              <Badge className={`text-xs py-0 h-5 ${statusColor}`}>{statusLabel}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Metric: <span className="font-medium text-gray-700">{showdown.metric}</span>
              {showdown.deadline && (
                <span className="ml-2">· Deadline: {formatDeadline(showdown.deadline)}</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(v => !v)}
            className="text-xs text-blue-600 hover:text-blue-700 flex-shrink-0"
          >
            {isExpanded ? "Collapse" : "View"}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            {/* Strategy */}
            <div className="space-y-1.5 bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Strategy</p>
              <p className="text-sm text-gray-800"><span className="font-medium">Testing:</span> {showdown.whatTesting}</p>
              {showdown.whyMatters && <p className="text-xs text-gray-600"><span className="font-medium">Why now:</span> {showdown.whyMatters}</p>}
              {showdown.podcastGoals && <p className="text-xs text-gray-600"><span className="font-medium">Goal:</span> {showdown.podcastGoals}</p>}
              {showdown.engagementPlan && <p className="text-xs text-gray-600"><span className="font-medium">Engagement plan:</span> {showdown.engagementPlan}</p>}
            </div>

            {/* Contenders */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Contenders</p>
              <div className="grid grid-cols-2 gap-2">
                {showdown.contenders.map(c => {
                  const isWinner = showdown.winnerId === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`p-3 rounded-lg border ${
                        isWinner
                          ? "border-yellow-400 bg-yellow-50"
                          : showdown.status === "complete"
                          ? "border-gray-200 bg-gray-50 opacity-60"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      {isWinner && (
                        <div className="flex items-center gap-1 mb-1.5">
                          <Crown className="size-3.5 text-yellow-600" />
                          <span className="text-xs font-semibold text-yellow-700">Winner</span>
                        </div>
                      )}
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Day {c.dayNumber}</p>
                      <p className="text-sm font-medium text-gray-900 leading-tight mt-0.5">{c.assetName || getAssetName(c.assetId)}</p>
                      {c.platform && <p className="text-xs text-gray-500 mt-0.5">{c.platform}</p>}
                      {c.finalStat !== undefined && (
                        <p className="text-lg font-bold text-gray-900 mt-1">{c.finalStat} <span className="text-xs font-normal text-gray-500">{showdown.metric}</span></p>
                      )}

                      {/* Results input */}
                      {showdown.status === "results" && (
                        <div className="mt-2">
                          <Input
                            type="number"
                            placeholder={`${showdown.metric} count`}
                            value={stats[c.id] || ""}
                            onChange={e => setStats(prev => ({ ...prev, [c.id]: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Running state CTA */}
            {showdown.status === "running" && (
              <div className={`rounded-lg p-3 border ${deadlinePassed ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={`size-4 ${deadlinePassed ? "text-amber-600" : "text-blue-600"}`} />
                  <span className={`text-sm font-medium ${deadlinePassed ? "text-amber-800" : "text-blue-800"}`}>
                    {deadlinePassed ? "Deadline passed — ready for results" : `Running until ${formatDeadline(showdown.deadline!)}`}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  variant={deadlinePassed ? "default" : "outline"}
                  onClick={handleEnterResults}
                >
                  Enter Results
                </Button>
              </div>
            )}

            {/* Results entry CTA */}
            {showdown.status === "results" && (
              <Button
                className="w-full"
                disabled={showdown.contenders.some(c => !stats[c.id])}
                onClick={handleSubmitResults}
              >
                <Trophy className="size-4 mr-2" /> Declare Winner
              </Button>
            )}

            {/* Complete: winner + reflection */}
            {showdown.status === "complete" && winner && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-center gap-3">
                  <Crown className="size-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Winner</p>
                    <p className="text-sm font-bold text-gray-900">{winner.assetName || getAssetName(winner.assetId)}</p>
                    <p className="text-xs text-gray-600">Day {winner.dayNumber} · {winner.finalStat} {showdown.metric}</p>
                  </div>
                </div>

                {/* Reflection */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reflection</p>

                  <div className="space-y-1.5">
                    <Label className="text-sm">What did this showdown tell you?</Label>
                    <Textarea
                      placeholder="Short punchy hooks drove 3x more comments than story-led ones"
                      rows={2}
                      value={reflection1}
                      onChange={e => setReflection1(e.target.value)}
                      disabled={reflectionSaved}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm">What will you do differently next time?</Label>
                    <Textarea
                      placeholder="Find more guests with a stronger point of view — our audience responds when there's tension in the conversation."
                      rows={2}
                      value={reflection2}
                      onChange={e => setReflection2(e.target.value)}
                      disabled={reflectionSaved}
                    />
                  </div>

                  {!reflectionSaved ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={!reflection1.trim() && !reflection2.trim()}
                      onClick={handleSaveReflection}
                    >
                      Save Reflection
                    </Button>
                  ) : (
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" /> Reflection saved
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

const SHOWDOWN_DESCRIPTION = "Content Showdown is a structured experiment that helps your team build real instinct about what resonates with your audience — episode by episode. Pick two or more pieces of content from your Promotion Plan, set a metric, run them head to head, and let the results speak. Over time, the reflections build into a body of knowledge written in your own words, from real results.";

export function ContentShowdown({ episode, assets }: ContentShowdownProps) {
  const { showdowns } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const planComplete = isPlanComplete(episode);
  const episodeShowdowns = showdowns.filter(s => s.episodeId === episode.id);

  const SectionLabel = () => (
    <div className="space-y-1">
      <p className="text-xs font-medium tracking-widest text-gray-400 uppercase">Experiment</p>
      <div className="flex items-center gap-2">
        <Swords className="size-5 text-gray-700" />
        <h3 className="font-semibold text-gray-900">Content Showdown</h3>
        <button
          onClick={() => setShowInfo(v => !v)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="What is Content Showdown?"
        >
          <HelpCircle className="size-4" />
        </button>
      </div>
      {showInfo && (
        <div className="relative mt-2 bg-gray-900 text-white text-xs rounded-lg p-3 pr-7 leading-relaxed max-w-lg">
          {SHOWDOWN_DESCRIPTION}
          <button
            onClick={() => setShowInfo(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  if (!planComplete) {
    return (
      <div className="space-y-2">
        <SectionLabel />
        <Card className="border-dashed border-gray-300 bg-gray-50">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <Lock className="size-5 text-gray-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Locked</h3>
              <p className="text-sm text-gray-500 mt-1">
                Complete all 7 days of the Promotion Plan to unlock Content Showdown.
                Every experiment should be grounded in committed, intentional content.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="space-y-2">
        <SectionLabel />
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">New Content Showdown</h3>
            </div>
            <CreateShowdownWizard
              episode={episode}
              assets={assets}
              onCancel={() => setIsCreating(false)}
              onCreated={() => setIsCreating(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <SectionLabel />
        <Button size="sm" onClick={() => setIsCreating(true)} className="flex items-center gap-1.5 mt-5">
          <Plus className="size-3.5" /> New Showdown
        </Button>
      </div>

      {episodeShowdowns.length === 0 ? (
        <Card className="border-dashed border-gray-200">
          <CardContent className="p-6 text-center">
            <Swords className="size-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">No showdowns yet</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              Run a structured content experiment to find out which posts drive the most response.
            </p>
            <Button className="mt-4" size="sm" onClick={() => setIsCreating(true)}>
              Start First Showdown
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {episodeShowdowns.map(s => (
            <ShowdownCard key={s.id} showdown={s} assets={assets} />
          ))}
        </div>
      )}
    </div>
  );
}
