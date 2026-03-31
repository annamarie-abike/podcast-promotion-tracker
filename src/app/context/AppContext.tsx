import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface PromotionDay {
  day: number;
  assetId?: string;
  caption?: string;
  platform?: string;
  notes?: string;
  scheduledPostLink?: string;
  livePostLink?: string;
  isPosted?: boolean;
  isManualPost?: boolean;
}

export interface Episode {
  id: string;
  name: string;
  releaseDate: string;
  completedDays: number[];
  stage: "planning" | "in-progress" | "complete";
  videoUrl?: string;
  guestName?: string;
  episodeNumber?: string;
  promotionPlan?: PromotionDay[];
  promotionStartDate?: string;
}

export interface Asset {
  id: string;
  name: string;
  url: string;
  episode: string; // Episode name
  episodeNumber?: string; // Episode number for sorting
  type: string;
  addedDate: string;
}

export interface CustomMetric {
  id: string;
  name: string;
}

export interface ShowdownContender {
  id: string;
  dayNumber: number;
  assetId?: string;
  assetName?: string;
  platform?: string;
  finalStat?: number;
}

export interface Showdown {
  id: string;
  episodeId: string;
  name: string;
  metric: string;
  whatTesting: string;
  whyMatters?: string;
  podcastGoals?: string;
  engagementPlan?: string;
  contenders: ShowdownContender[];
  deadline?: string;
  status: "setup" | "running" | "results" | "complete";
  startedAt?: string;
  winnerId?: string;
  reflection1?: string;
  reflection2?: string;
  createdAt: string;
}

interface AppContextType {
  episodes: Episode[];
  assets: Asset[];
  showdowns: Showdown[];
  customMetrics: CustomMetric[];
  addEpisode: (episode: Episode) => void;
  updateEpisode: (id: string, updates: Partial<Episode>) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  addShowdown: (showdown: Showdown) => void;
  updateShowdown: (id: string, updates: Partial<Showdown>) => void;
  addCustomMetric: (metric: CustomMetric) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_EPISODES: Episode[] = [
    {
      id: "1",
      name: "Episode 12: TY Bello Interview",
      releaseDate: "2025-04-05",
      completedDays: [],
      stage: "planning",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      id: "2",
      name: "Episode 11: The Power of Creativity",
      releaseDate: "2025-03-29",
      completedDays: [],
      stage: "planning",
      videoUrl: "https://youtube.com/watch?v=abc123xyz"
    },
    {
      id: "3",
      name: "Episode 10: Building Community",
      releaseDate: "2025-03-22",
      completedDays: [],
      stage: "planning"
    }
];

const DEFAULT_ASSETS: Asset[] = [
    {
      id: "1",
      name: "TY Bello — Full Recording",
      url: "https://riverside.fm/studio/abc123xyz",
      episode: "Episode 12: TY Bello Interview",
      type: "recording",
      addedDate: "2025-03-28"
    },
    {
      id: "2",
      name: "Episode 12 - Carousel Final",
      url: "https://drive.google.com/file/d/1a2b3c4d5e6f",
      episode: "Episode 12: TY Bello Interview",
      type: "image",
      addedDate: "2025-03-29"
    },
    {
      id: "3",
      name: "Full Episode Cut — YouTube",
      url: "https://youtube.com/watch?v=abc123xyz",
      episode: "Episode 11: The Power of Creativity",
      type: "video",
      addedDate: "2025-03-25"
    },
    {
      id: "4",
      name: "Episode 11 Graphics Pack",
      url: "https://dropbox.com/sh/abc123/graphics",
      episode: "Episode 11: The Power of Creativity",
      type: "folder",
      addedDate: "2025-03-24"
    }
];

const DEFAULT_METRICS: CustomMetric[] = [];

export function AppProvider({ children }: { children: ReactNode }) {
  const [episodes, setEpisodes] = useState<Episode[]>(() => {
    try {
      const saved = localStorage.getItem("ppt_episodes");
      return saved ? JSON.parse(saved) : DEFAULT_EPISODES;
    } catch {
      return DEFAULT_EPISODES;
    }
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      const saved = localStorage.getItem("ppt_assets");
      return saved ? JSON.parse(saved) : DEFAULT_ASSETS;
    } catch {
      return DEFAULT_ASSETS;
    }
  });

  const [showdowns, setShowdowns] = useState<Showdown[]>(() => {
    try {
      const saved = localStorage.getItem("ppt_showdowns");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customMetrics, setCustomMetrics] = useState<CustomMetric[]>(() => {
    try {
      const saved = localStorage.getItem("ppt_custom_metrics");
      return saved ? JSON.parse(saved) : DEFAULT_METRICS;
    } catch {
      return DEFAULT_METRICS;
    }
  });

  useEffect(() => {
    localStorage.setItem("ppt_episodes", JSON.stringify(episodes));
  }, [episodes]);

  useEffect(() => {
    localStorage.setItem("ppt_assets", JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem("ppt_showdowns", JSON.stringify(showdowns));
  }, [showdowns]);

  useEffect(() => {
    localStorage.setItem("ppt_custom_metrics", JSON.stringify(customMetrics));
  }, [customMetrics]);

  const addEpisode = (episode: Episode) => {
    setEpisodes([episode, ...episodes]);

    // Automatically add the video URL as an asset if it exists
    if (episode.videoUrl) {
      const newAsset: Asset = {
        id: `asset-${Date.now()}`,
        name: `${episode.name} — Full Video`,
        url: episode.videoUrl,
        episode: episode.name,
        episodeNumber: episode.episodeNumber,
        type: "video",
        addedDate: new Date().toISOString().split('T')[0]
      };
      setAssets([newAsset, ...assets]);
    }
  };

  const updateEpisode = (id: string, updates: Partial<Episode>) => {
    setEpisodes(episodes.map(ep => ep.id === id ? { ...ep, ...updates } : ep));
  };

  const addAsset = (asset: Asset) => {
    setAssets([asset, ...assets]);
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    setAssets(assets.map(asset => asset.id === id ? { ...asset, ...updates } : asset));
  };

  const deleteAsset = (id: string) => {
    setAssets(assets.filter(asset => asset.id !== id));
  };

  const addShowdown = (showdown: Showdown) => {
    setShowdowns([showdown, ...showdowns]);
  };

  const updateShowdown = (id: string, updates: Partial<Showdown>) => {
    setShowdowns(showdowns.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addCustomMetric = (metric: CustomMetric) => {
    setCustomMetrics([...customMetrics, metric]);
  };

  return (
    <AppContext.Provider
      value={{
        episodes,
        assets,
        showdowns,
        customMetrics,
        addEpisode,
        updateEpisode,
        addAsset,
        updateAsset,
        deleteAsset,
        addShowdown,
        updateShowdown,
        addCustomMetric
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
