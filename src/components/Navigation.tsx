/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Search, Bookmark, ShieldAlert, Clock, User as UserIcon, 
  Menu, X, Radio, ArrowRight, ChevronDown, Check, LogIn
} from "lucide-react";
import { User, UserRole, Article, Category } from "../types";

interface NavigationProps {
  currentUser: User | null;
  activeRole: UserRole | "Visitor";
  setActiveRole: (role: UserRole | "Visitor") => void;
  categories: Category[];
  activeCategory: string | null;
  onNavigate: (view: string, params?: any) => void;
  breakingArticles: Article[];
  onSearch: (query: string) => void;
  searchQuery: string;
}

export default function Navigation({
  currentUser,
  activeRole,
  setActiveRole,
  categories,
  activeCategory,
  onNavigate,
  breakingArticles,
  onSearch,
  searchQuery
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [timeStr, setTimeStr] = useState("");

  // Live countdown clock matching high human standards
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Breaking news ticker animation loop
  useEffect(() => {
    if (breakingArticles.length <= 1) return;
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % breakingArticles.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [breakingArticles]);

  const rolesList: (UserRole | "Visitor")[] = [
    "Visitor", "Subscriber", "Moderator", "Journalist", "Editor", "Super Admin"
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white">
      {/* Top Utility Bar: Live Updates & Active Clock & Simulated Role Selector */}
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-1.5 text-xs text-slate-700">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          
          {/* Breaking Ticker */}
          <div className="flex flex-1 items-center space-x-2 overflow-hidden mr-4">
            <span className="flex items-center space-x-1.5 bg-red-600 px-2 py-0.5 font-bold uppercase tracking-wider text-[9px] text-white rounded-xs shrink-0 animate-pulse">
              <Radio className="h-3 w-3" />
              <span>Breaking</span>
            </span>
            <div className="relative h-5 flex-1 overflow-hidden">
              {breakingArticles.length > 0 ? (
                <div 
                  className="absolute left-0 w-full transition-transform duration-500 ease-in-out cursor-pointer hover:text-red-700 font-medium text-slate-600 truncate"
                  style={{ transform: `translateY(0px)` }}
                  onClick={() => onNavigate("article", { slug: breakingArticles[tickerIndex].slug })}
                >
                  <span className="font-bold text-red-650 mr-2">[{breakingArticles[tickerIndex].category.toUpperCase()}]</span>
                  {breakingArticles[tickerIndex].title}
                </div>
              ) : (
                <span className="text-slate-400">Monitoring global airwaves for major reports...</span>
              )}
            </div>
          </div>

          {/* Time & Simulated Controls */}
          <div className="flex items-center space-x-4 shrink-0">
            <div className="hidden sm:flex items-center space-x-1.5 text-slate-500 border-r border-slate-200 pr-4">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-mono text-[11px]">{timeStr} UTC</span>
            </div>

            {/* Simulated CMS Persona Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-1.5 bg-white hover:bg-slate-100 px-2.5 py-1 rounded border border-slate-200 text-slate-700 text-xs transition cursor-pointer font-medium shadow-2xs"
                id="role-switch-btn"
              >
                <div className={`h-2 w-2 rounded-full ${activeRole === "Visitor" ? "bg-slate-400" : activeRole === "Subscriber" ? "bg-blue-500" : "bg-emerald-500 animate-ping"}`} />
                <span>Role: {activeRole}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-white text-slate-800 rounded-md border border-slate-200 shadow-md py-1.5 z-50">
                  <div className="px-3 py-1 border-b border-slate-100 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">CMS Simulator Bypass</span>
                  </div>
                  {rolesList.map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        setActiveRole(r);
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className={activeRole === r ? "font-semibold text-slate-900" : "text-slate-600"}>
                        {r}
                      </span>
                      {activeRole === r && (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                    </button>
                  ))}
                  <div className="mt-1.5 px-3 py-1 border-t border-slate-150 pt-1.5 bg-slate-50 text-[10px] text-slate-500">
                    Switch roles to test editorial edits or comment moderation dashboard flags!
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Main Bar: Logo & Core Navigation */}
      <div className="px-6 py-4 bg-white border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          
          {/* Left: Mobile Toggle & Home Link */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div 
              onClick={() => onNavigate("home")} 
              className="group flex items-center space-x-1.5 cursor-pointer select-none font-sans text-2xl font-black tracking-tighter text-black"
            >
              <span className="bg-black text-white px-2 py-0.5 text-lg font-bold rounded-xs leading-none select-none">C</span>
              <span>HRONICLE</span>
            </div>
          </div>

          {/* Center: Search input */}
          <div className="hidden md:block flex-1 max-w-sm mx-8">
            <div className="relative">
              <input 
                type="text"
                placeholder="Search quantum, deep reading, green sails..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 text-xs rounded-full bg-slate-50 border border-slate-200 outline-hidden text-slate-800 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
              />
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-450" />
            </div>
          </div>

          {/* Right: bookmarks lists, CMS portal entries, profile logs */}
          <div className="flex items-center space-x-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <button 
              onClick={() => onNavigate("bookmarks")}
              className={`py-1.5 px-2.5 rounded-full transition flex items-center space-x-1.5 hover:bg-slate-50 hover:text-black cursor-pointer ${activeCategory === "bookmarks" && "bg-slate-100 text-black font-bold"}`}
              title="Saved Articles"
            >
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Saved</span>
            </button>

            {/* If role is Editor/Admin/Journalist, show Portal Link */}
            {activeRole !== "Visitor" && activeRole !== "Subscriber" && (
              <button 
                onClick={() => onNavigate("admin")}
                className="px-3 py-1.5 border border-black hover:bg-black hover:text-white rounded text-black font-bold uppercase tracking-wider text-[10px] font-sans flex items-center space-x-1 transition cursor-pointer"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Admin CMS</span>
              </button>
            )}

            {/* Display profile details */}
            <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
              {currentUser ? (
                <div className="flex items-center space-x-2">
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="h-7 w-7 rounded-sm object-cover border border-slate-200"
                  />
                  <div className="hidden xl:block text-left leading-tight">
                    <div className="text-slate-800 font-bold lowercase tracking-tight">{currentUser.name.replace(/\s+/g, "").toLowerCase()}</div>
                    <div className="text-slate-400 text-[9px] font-normal tracking-wide">{currentUser.role}</div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setActiveRole("Subscriber")}
                  className="flex items-center space-x-1 hover:text-black cursor-pointer text-[10px] uppercase font-bold tracking-widest text-slate-500"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Log In</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Navigation Categories Strip (Desk) */}
      <nav className="hidden lg:block bg-white py-1.5 border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <div className="flex items-center space-x-6 overflow-x-auto text-[10px] font-bold tracking-wider uppercase">
            <button 
              onClick={() => onNavigate("home")}
              className={`pb-1 cursor-pointer transition ${activeCategory === null ? "text-black border-b border-black font-black" : "text-slate-400 hover:text-black"}`}
            >
              Feed Home
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => onNavigate("category", { id: c.id })}
                className={`pb-1 cursor-pointer transition ${activeCategory === c.id ? "text-black border-b border-black font-black" : "text-slate-400 hover:text-black"}`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Quick link */}
          <div className="hidden xl:flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-black transition cursor-pointer">
            <span>Editor's Picks</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </nav>

      {/* Mobile Menu (Drawer panel) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-y-0 w-64 bg-white border-r border-gray-200 shadow-xl z-50 p-4 pt-16 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 px-3">Search Platform</span>
              <div className="relative px-3">
                <input 
                  type="text"
                  placeholder="Query..."
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 rounded bg-gray-100 text-xs text-slate-800 border-none outline-hidden focus:ring-1 focus:ring-slate-500"
                />
                <Search className="absolute left-5 top-1.5 w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 px-3">Journalism Categories</span>
              <button
                onClick={() => {
                  onNavigate("home");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-medium ${activeCategory === null ? "bg-slate-100 text-slate-900 font-bold" : "text-gray-600 hover:bg-slate-50"}`}
              >
                Feed Home
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    onNavigate("category", { id: c.id });
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-medium ${activeCategory === c.id ? "bg-slate-100 text-indigo-600 font-bold" : "text-gray-600 hover:bg-slate-50"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 text-xs text-gray-500 px-3 space-y-2">
            <div>Current simulation role: <span className="font-bold text-slate-700">{activeRole}</span></div>
            <div className="text-[10px]">Customize your secrets inside Google AI Studio to unlock full server integrations.</div>
          </div>
        </div>
      )}
    </header>
  );
}
