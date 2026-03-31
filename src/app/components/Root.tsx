import { Outlet, Link, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";

export function Root() {
  const location = useLocation();
  const [showTrophyShelf, setShowTrophyShelf] = useState(() => {
    const saved = localStorage.getItem("showTrophyShelf");
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const navItems = [
    { path: "/", label: "Home" },
    { path: "/calendar", label: "Calendar" },
    { path: "/about", label: "About the Podcast" },
    { path: "/credentials", label: "Credentials" },
    { path: "/assets", label: "Asset Library" },
  ];

  // Save trophy shelf preference
  useEffect(() => {
    localStorage.setItem("showTrophyShelf", JSON.stringify(showTrophyShelf));
    // Dispatch custom event to notify Home component
    window.dispatchEvent(new CustomEvent("trophyShelfToggle", { detail: showTrophyShelf }));
  }, [showTrophyShelf]);

  const isHomePage = location.pathname === "/";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Podcast OS</h1>
              <p className="text-sm text-gray-600 mt-1">Plan, track, and complete your 7-day promotion cycle</p>
            </div>
            
            {/* Trophy Shelf Toggle - Only show on home page */}
            {isHomePage && (
              <button
                onClick={() => setShowTrophyShelf(!showTrophyShelf)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Trophy className="w-3.5 h-3.5" />
                {showTrophyShelf ? "Hide" : "Show"} Trophies
              </button>
            )}
          </div>
          
          <nav className="flex gap-6 mt-6">
            {navItems.map((item) => {
              const isActive = item.path === "/" 
                ? location.pathname === "/" 
                : location.pathname.startsWith(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}