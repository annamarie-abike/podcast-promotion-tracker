import { createContext, useContext, useState, ReactNode } from "react";

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

interface AppContextType {
  episodes: Episode[];
  assets: Asset[];
  addEpisode: (episode: Episode) => void;
  updateEpisode: (id: string, updates: Partial<Episode>) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [episodes, setEpisodes] = useState<Episode[]>([
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
  ]);

  const [assets, setAssets] = useState<Asset[]>([
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
  ]);

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

  return (
    <AppContext.Provider
      value={{
        episodes,
        assets,
        addEpisode,
        updateEpisode,
        addAsset,
        updateAsset,
        deleteAsset
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