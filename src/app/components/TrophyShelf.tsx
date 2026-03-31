import { useState } from "react";
import { Trophy, Swords, Crown } from "lucide-react";
import { Episode, Showdown } from "../context/AppContext";

interface TrophyData {
  id: string;
  title: string;
  description: string;
  type: "episode" | "streak";
  requirement: number | string; // number for episode count, string for streak type
  isEarned: boolean;
  dateEarned?: string;
}

interface TrophyShelfProps {
  episodes: Episode[];
  showdowns?: Showdown[];
}

export function TrophyShelf({ episodes, showdowns = [] }: TrophyShelfProps) {
  const [showAll, setShowAll] = useState(false);
  // Calculate completed episodes (stage === "complete")
  const completedEpisodes = episodes.filter((ep) => ep.stage === "complete");
  const completedCount = completedEpisodes.length;

  // Calculate streak milestones
  const calculateStreaks = () => {
    // Group episodes by month
    const episodesByMonth: { [monthKey: string]: Episode[] } = {};
    
    episodes.forEach((episode) => {
      if (episode.releaseDate) {
        const date = new Date(episode.releaseDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!episodesByMonth[monthKey]) {
          episodesByMonth[monthKey] = [];
        }
        episodesByMonth[monthKey].push(episode);
      }
    });

    // Sort month keys chronologically
    const sortedMonths = Object.keys(episodesByMonth).sort();

    // Check each month if all episodes have completed 7-day cycles
    const monthsWithFullPromotion = sortedMonths.filter((monthKey) => {
      const monthEpisodes = episodesByMonth[monthKey];
      return monthEpisodes.every((ep) => ep.completedDays?.length === 7);
    });

    // Calculate consecutive streaks
    let currentStreak = 0;
    let maxStreak = 0;
    let streakEndMonth = "";

    for (let i = sortedMonths.length - 1; i >= 0; i--) {
      const monthKey = sortedMonths[i];
      const monthEpisodes = episodesByMonth[monthKey];
      const allComplete = monthEpisodes.every((ep) => ep.completedDays?.length === 7);

      if (allComplete) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
        if (!streakEndMonth) {
          streakEndMonth = monthKey;
        }
      } else {
        if (currentStreak > 0) {
          break; // We only care about the most recent streak
        }
      }
    }

    return {
      hasMonthlyStreak: currentStreak >= 1,
      has3MonthStreak: currentStreak >= 3,
      has6MonthStreak: currentStreak >= 6,
      has1YearStreak: currentStreak >= 12,
      streakEndMonth,
    };
  };

  const streaks = calculateStreaks();

  // Define all trophies
  const trophies: TrophyData[] = [
    // Episode Milestones
    {
      id: "episode-1",
      title: "First Episode Promoted",
      description: "Complete your first full 7-day promotion cycle",
      type: "episode",
      requirement: 1,
      isEarned: completedCount >= 1,
      dateEarned: completedCount >= 1 ? completedEpisodes[0]?.releaseDate : undefined,
    },
    {
      id: "episode-3",
      title: "3 Episodes Promoted",
      description: "Consistency is starting to show",
      type: "episode",
      requirement: 3,
      isEarned: completedCount >= 3,
      dateEarned: completedCount >= 3 ? completedEpisodes[2]?.releaseDate : undefined,
    },
    {
      id: "episode-10",
      title: "10 Episodes Promoted",
      description: "This is no longer a habit, it's a practice",
      type: "episode",
      requirement: 10,
      isEarned: completedCount >= 10,
      dateEarned: completedCount >= 10 ? completedEpisodes[9]?.releaseDate : undefined,
    },
    {
      id: "episode-15",
      title: "15 Episodes Promoted",
      description: "Fifteen. You're past the point where most people quit.",
      type: "episode",
      requirement: 15,
      isEarned: completedCount >= 15,
      dateEarned: completedCount >= 15 ? completedEpisodes[14]?.releaseDate : undefined,
    },
    {
      id: "episode-20",
      title: "20 Episodes Promoted",
      description: "Most podcasts stopped here. You kept going.",
      type: "episode",
      requirement: 20,
      isEarned: completedCount >= 20,
      dateEarned: completedCount >= 20 ? completedEpisodes[19]?.releaseDate : undefined,
    },
    {
      id: "episode-25",
      title: "25 Episodes Promoted",
      description: "Twenty-five. A quarter century of episodes fully promoted.",
      type: "episode",
      requirement: 25,
      isEarned: completedCount >= 25,
      dateEarned: completedCount >= 25 ? completedEpisodes[24]?.releaseDate : undefined,
    },
    {
      id: "episode-30",
      title: "30 Episodes Promoted",
      description: "Thirty. You are not the same podcaster who recorded episode one.",
      type: "episode",
      requirement: 30,
      isEarned: completedCount >= 30,
      dateEarned: completedCount >= 30 ? completedEpisodes[29]?.releaseDate : undefined,
    },
    {
      id: "episode-35",
      title: "35 Episodes Promoted",
      description: "Thirty-five full cycles. The show has found its legs.",
      type: "episode",
      requirement: 35,
      isEarned: completedCount >= 35,
      dateEarned: completedCount >= 35 ? completedEpisodes[34]?.releaseDate : undefined,
    },
    {
      id: "episode-40",
      title: "40 Episodes Promoted",
      description: "Forty. Forty times you chose to show up for your audience.",
      type: "episode",
      requirement: 40,
      isEarned: completedCount >= 40,
      dateEarned: completedCount >= 40 ? completedEpisodes[39]?.releaseDate : undefined,
    },
    {
      id: "episode-45",
      title: "45 Episodes Promoted",
      description: "Forty-five. Five episodes from something worth marking.",
      type: "episode",
      requirement: 45,
      isEarned: completedCount >= 45,
      dateEarned: completedCount >= 45 ? completedEpisodes[44]?.releaseDate : undefined,
    },
    {
      id: "episode-50",
      title: "50 Episodes Promoted",
      description: "Fifty. Jubilee. Half a century of episodes. This is rare.",
      type: "episode",
      requirement: 50,
      isEarned: completedCount >= 50,
      dateEarned: completedCount >= 50 ? completedEpisodes[49]?.releaseDate : undefined,
    },
    {
      id: "episode-100",
      title: "100 Episodes Promoted",
      description: "One hundred. A century of showing up. The work speaks for itself.",
      type: "episode",
      requirement: 100,
      isEarned: completedCount >= 100,
      dateEarned: completedCount >= 100 ? completedEpisodes[99]?.releaseDate : undefined,
    },
    // Streak Milestones
    {
      id: "streak-monthly",
      title: "Monthly Streak",
      description: "Every episode released this month has a completed 7-day promotion cycle. Not one left behind.",
      type: "streak",
      requirement: "monthly",
      isEarned: streaks.hasMonthlyStreak,
      dateEarned: streaks.hasMonthlyStreak ? streaks.streakEndMonth : undefined,
    },
    {
      id: "streak-3month",
      title: "3-Month Streak",
      description: "Three consecutive months. Every episode promoted, every cycle finished. This is not a phase.",
      type: "streak",
      requirement: "3-month",
      isEarned: streaks.has3MonthStreak,
      dateEarned: streaks.has3MonthStreak ? streaks.streakEndMonth : undefined,
    },
    {
      id: "streak-6month",
      title: "6-Month Streak",
      description: "Six months of not skipping. Half a year of showing up for every episode you put out.",
      type: "streak",
      requirement: "6-month",
      isEarned: streaks.has6MonthStreak,
      dateEarned: streaks.has6MonthStreak ? streaks.streakEndMonth : undefined,
    },
    {
      id: "streak-1year",
      title: "1-Year Streak",
      description: "A full year. Every episode. Every cycle. No exceptions. This is who you are now.",
      type: "streak",
      requirement: "1-year",
      isEarned: streaks.has1YearStreak,
      dateEarned: streaks.has1YearStreak ? streaks.streakEndMonth : undefined,
    },
  ];

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const displayTrophies = showAll ? trophies : trophies.slice(0, 6);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Trophy Shelf</h2>
          <p className="text-sm text-gray-600 mt-1">
            Pre-set trophies that unlock automatically as you reach milestones
          </p>
        </div>
        <div className="text-sm text-gray-600">
          {trophies.filter((t) => t.isEarned).length} / {trophies.length} earned
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {displayTrophies.map((trophy) => (
          <div
            key={trophy.id}
            className={`flex flex-col items-center p-4 rounded-lg border transition-all ${
              trophy.isEarned
                ? "bg-yellow-50 border-yellow-300"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <Trophy
              className={`w-8 h-8 mb-2 ${
                trophy.isEarned ? "text-yellow-600" : "text-gray-400"
              }`}
            />
            <h3
              className={`text-sm font-semibold text-center mb-1 ${
                trophy.isEarned ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {trophy.title}
            </h3>
            <p
              className={`text-xs text-center mb-2 ${
                trophy.isEarned ? "text-gray-600" : "text-gray-400"
              }`}
            >
              {trophy.description}
            </p>
            {trophy.isEarned && trophy.dateEarned && (
              <span className="text-xs text-yellow-700 font-medium">
                {formatDate(trophy.dateEarned)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* View All Link */}
      {trophies.length > 6 && (
        <button
          className="w-full mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          onClick={() => setShowAll(prev => !prev)}
        >
          {showAll ? "Show less ↑" : `View all ${trophies.length} trophies →`}
        </button>
      )}

      {/* Showdown Winners */}
      {showdowns.filter(s => s.status === "complete" && s.winnerId).length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Swords className="size-5 text-gray-700" />
            <h3 className="text-base font-bold text-gray-900">Showdown Winners</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {showdowns
              .filter(s => s.status === "complete" && s.winnerId)
              .map(s => {
                const winner = s.contenders.find(c => c.id === s.winnerId);
                return (
                  <div
                    key={s.id}
                    className="bg-yellow-50 border border-yellow-300 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="size-4 text-yellow-600" />
                      <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Showdown Winner</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{s.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Metric: {s.metric}</p>
                    {winner && (
                      <div className="mt-2 pt-2 border-t border-yellow-200">
                        <p className="text-xs text-gray-600 font-medium">Winner</p>
                        <p className="text-sm font-semibold text-gray-900">
                          Day {winner.dayNumber} — {winner.assetName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {winner.finalStat} {s.metric}
                        </p>
                      </div>
                    )}
                    {s.reflection1 && (
                      <p className="text-xs text-gray-600 mt-2 italic">"{s.reflection1}"</p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
