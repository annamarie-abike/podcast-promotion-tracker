import { useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../context/AppContext";

export function Calendar() {
  const { episodes } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Helper: Get the first day of the month
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // Helper: Get the last day of the month
  const getLastDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  // Helper: Get all days in the current month view (including padding)
  const getDaysInMonth = () => {
    const firstDay = getFirstDayOfMonth(currentMonth);
    const lastDay = getLastDayOfMonth(currentMonth);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: (Date | null)[] = [];

    // Add empty cells for days before the 1st
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }

    return days;
  };

  // Helper: Check if a date is today
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Helper: Format date to YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Helper: Get all promotion days for all episodes
  const getPromotionDaysData = () => {
    const promotionData: {
      [dateKey: string]: {
        isReleaseDate: boolean;
        promotionDays: { episodeId: string; dayNumber: number; isCompleted: boolean }[];
      };
    } = {};

    episodes.forEach((episode) => {
      // Mark release date
      if (episode.releaseDate) {
        const releaseDateKey = episode.releaseDate;
        if (!promotionData[releaseDateKey]) {
          promotionData[releaseDateKey] = { isReleaseDate: false, promotionDays: [] };
        }
        promotionData[releaseDateKey].isReleaseDate = true;
      }

      // Mark promotion days (only if promotion has started)
      if (episode.promotionStartDate && episode.stage !== "planning") {
        const startDate = new Date(episode.promotionStartDate);
        for (let i = 0; i < 7; i++) {
          const promotionDate = new Date(startDate);
          promotionDate.setDate(startDate.getDate() + i);
          const dateKey = formatDate(promotionDate);

          if (!promotionData[dateKey]) {
            promotionData[dateKey] = { isReleaseDate: false, promotionDays: [] };
          }

          const isCompleted = episode.completedDays?.includes(i + 1) || false;
          promotionData[dateKey].promotionDays.push({
            episodeId: episode.id,
            dayNumber: i + 1,
            isCompleted,
          });
        }
      }
    });

    return promotionData;
  };

  const promotionData = getPromotionDaysData();
  const days = getDaysInMonth();

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
        <p className="text-sm text-gray-600 mt-1">
          A visual map of every episode's promotion activity — release dates, scheduled posts, and momentum
        </p>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {monthName}
            </h3>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateKey = formatDate(date);
            const dayData = promotionData[dateKey];
            const hasReleaseDate = dayData?.isReleaseDate || false;
            const promotionDays = dayData?.promotionDays || [];
            const hasPromotionDays = promotionDays.length > 0;
            const allPromotionDaysCompleted =
              hasPromotionDays && promotionDays.every((p) => p.isCompleted);
            const somePromotionDaysCompleted =
              hasPromotionDays && promotionDays.some((p) => p.isCompleted);

            return (
              <div
                key={`${dateKey}-${index}`}
                className={`aspect-square p-2 rounded-lg border transition-all ${
                  isToday(date)
                    ? "border-2 border-blue-600"
                    : "border border-gray-200"
                } ${
                  hasReleaseDate
                    ? "bg-purple-100"
                    : hasPromotionDays
                    ? "bg-blue-50"
                    : "bg-white"
                }`}
              >
                <div className="flex flex-col h-full">
                  <div className="text-sm font-medium text-gray-900">
                    {date.getDate()}
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    {somePromotionDaysCompleted && (
                      <div className="flex flex-wrap gap-1 items-center justify-center">
                        {promotionDays.map((promoDay, idx) =>
                          promoDay.isCompleted ? (
                            <Check
                              key={`${dateKey}-${promoDay.episodeId}-${promoDay.dayNumber}-${idx}`}
                              className="w-4 h-4 text-green-600"
                            />
                          ) : null
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 border-blue-600 bg-white" />
              <span className="text-gray-600">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-200 bg-purple-100" />
              <span className="text-gray-600">Release Date</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-200 bg-blue-50" />
              <span className="text-gray-600">Promotion Day</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">Post Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Episode Status Cards */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Active Episodes</h3>
        {episodes
          .filter((ep) => ep.stage !== "planning")
          .map((episode) => {
            const completedCount = episode.completedDays?.length || 0;
            const allDaysComplete = completedCount === 7;

            return (
              <div
                key={episode.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-medium text-gray-900">{episode.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {completedCount}/7 days complete
                  </p>
                </div>
                {allDaysComplete && (
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Post Content
                  </button>
                )}
              </div>
            );
          })}
        {episodes.filter((ep) => ep.stage !== "planning").length === 0 && (
          <p className="text-sm text-gray-500 italic">
            No active promotions yet. Start a promotion from the Home screen.
          </p>
        )}
      </div>
    </div>
  );
}