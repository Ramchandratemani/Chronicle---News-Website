/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Bookmark, Clock, Calendar, ArrowRight,
  Shield, Check, Heart, Newspaper, Trash2
} from "lucide-react";
import { User, Article } from "../types";

interface BookmarksViewProps {
  currentUser: User | null;
  bookmarkedArticles: Article[];
  onNavigate: (view: string, params?: any) => void;
  onToggleBookmark: (slug: string) => void;
  onUpdateUserBio: (name: string, bio: string) => void;
}

export default function BookmarksView({
  currentUser,
  bookmarkedArticles,
  onNavigate,
  onToggleBookmark,
  onUpdateUserBio
}: BookmarksViewProps) {
  const [profileName, setProfileName] = useState(currentUser?.name || "");
  const [profileBio, setProfileBio] = useState(currentUser?.bio || "");
  const [profileSaved, setProfileSaved] = useState(false);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserBio(profileName, profileBio);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center space-y-4 select-none">
        <Bookmark className="h-10 w-10 text-slate-350 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">Your Saved Shelf Cabin</h2>
        <p className="text-slate-500 font-serif text-xs leading-relaxed max-w-sm mx-auto">
          Please select a role persona from the simulated bypass bar located at the top to access dynamic bookmarks, custom bios, and reading telemetry statistics.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-12 text-left select-none pb-24 bg-white animate-fade-in">
      
      {/* 1. Left Column: Account Profile Editor Settings */}
      <div className="lg:col-span-1 space-y-8">
        
        {/* Profile Card Summary */}
        <div className="bg-slate-50 border border-slate-150 rounded-sm p-6 text-center space-y-4">
          <div className="relative inline-block">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="h-20 w-20 rounded-sm mx-auto object-cover border border-slate-200"
            />
            <span className="absolute -bottom-1 -right-1 bg-black text-white p-1 rounded-sm text-[10px] ring-2 ring-slate-50 shadow-none">
              <Shield className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-slate-900 leading-none">{currentUser.name}</h3>
            <span className="inline-block text-[9px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-xs uppercase tracking-wider">
              {currentUser.role} Account
            </span>
          </div>

          <p className="text-slate-600 font-serif text-xs italic leading-relaxed max-w-xs mx-auto">
            "{currentUser.bio || "No profile bio recorded yet. Write your editorial manifesto below."}"
          </p>

          <div className="pt-4 border-t border-slate-205 border-slate-200 grid grid-cols-2 text-left text-[10px] gap-4">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">MEMBER SINCE</span>
              <div className="font-mono text-slate-800 flex items-center space-x-1 font-bold">
                <Calendar className="h-3.5 w-3.5 text-slate-350" />
                <span>2024</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">SHELF CONTENT</span>
              <div className="font-mono text-slate-800 flex items-center space-x-1 font-bold">
                <Newspaper className="h-3.5 w-3.5 text-slate-350" />
                <span>{bookmarkedArticles.length} Columns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Bio Profile Form Editor */}
        <div className="border border-slate-150 rounded-sm p-5 bg-white space-y-4">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] pb-1.5 border-b border-black text-slate-900 font-sans">
            Subscriber Profile
          </h4>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Full Username</label>
              <input 
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xs bg-slate-50 text-xs text-slate-800 border border-slate-200 focus:outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Manifesto Bio</label>
              <textarea 
                rows={3}
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                className="w-full px-3 py-2 rounded-xs bg-slate-50 text-xs text-slate-800 border border-slate-200 focus:outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-400 placeholder-slate-405 resize-none"
                placeholder="Write your brief bio manifesto..."
              />
            </div>

            <button 
              type="submit"
              className="w-full px-4 py-2 bg-black hover:bg-slate-850 text-white font-bold text-xs uppercase tracking-widest rounded-xs transition cursor-pointer"
            >
              Update Profile Information
            </button>
          </form>

          {profileSaved && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-150 border-emerald-100 p-2 rounded-sm text-xs font-semibold flex items-center space-x-1 text-center justify-center animate-fade-in">
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span>Bio persisted successfully inside temporary disk context.</span>
            </div>
          )}
        </div>

      </div>

      {/* 2. Middle & Right Columns: Reading List & Access History logs */}
      <div className="lg:col-span-2 space-y-10">
        
        {/* Core Saved bookmarks columns */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] pb-3 border-b border-black text-slate-900 font-sans">
            Simulated Reading Library
          </h3>

          <div className="space-y-4">
            {bookmarkedArticles.map(art => (
              <div 
                key={art.id}
                className="flex flex-col sm:flex-row gap-5 items-stretch border border-slate-100 rounded-sm overflow-hidden hover:border-slate-350 transition bg-white p-4 group"
              >
                <div className="w-full sm:w-44 aspect-video sm:aspect-auto rounded-sm overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                  <img src={art.featuredImage} alt={art.title} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-3 p-1">
                  <div className="space-y-1.5 text-left">
                    <span className="text-[8px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50 border border-slate-150 px-2.0 py-0.5 rounded-xs select-none">
                      [{art.category}]
                    </span>
                    <h4 
                      onClick={() => onNavigate("article", { slug: art.slug })}
                      className="font-serif text-base font-bold text-slate-900 line-clamp-1 hover:underline cursor-pointer transition leading-snug"
                    >
                      {art.title}
                    </h4>
                    <p className="text-slate-500 font-serif text-xs line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold pt-2 border-t border-slate-50 text-slate-400">
                    <div className="flex items-center space-x-2">
                      <img src={art.authorAvatar} alt={art.authorName} className="h-5.5 w-5.5 rounded-sm object-cover border border-slate-205" />
                      <span className="text-slate-705 lowercase tracking-tight">{art.authorName.replace(/\s+/g, "").toLowerCase()}</span>
                    </div>

                    <div className="flex items-center space-x-3 select-none">
                      <button 
                        onClick={() => onToggleBookmark(art.slug)}
                        className="p-1 text-red-650 hover:text-red-700 hover:bg-slate-50 rounded-xs cursor-pointer transition flex items-center space-x-1"
                        title="Delete Bookmark"
                      >
                        <Trash2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Unsave</span>
                      </button>
                      <button 
                        onClick={() => onNavigate("article", { slug: art.slug })}
                        className="text-black hover:underline font-bold uppercase tracking-wider flex items-center space-x-0.5"
                      >
                        <span>Read</span>
                        <ArrowRight className="h-3 w-3 animate-pulse" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {bookmarkedArticles.length === 0 && (
              <div className="text-center py-16 bg-slate-50 border border-slate-150 rounded-sm max-w-lg mx-auto py-12 space-y-4">
                <Bookmark className="h-8 w-8 mx-auto text-slate-300" />
                <h4 className="font-serif font-bold text-slate-800">Your simulated library shelf is blank</h4>
                <p className="text-xs text-slate-500 font-serif max-w-xs mx-auto leading-relaxed">
                  Deeply explore dispatches inside our dynamic categories columns. Bookmark columns of interest to populate this personalized dashboard shelf instantly!
                </p>
                <button 
                  onClick={() => onNavigate("home")}
                  className="px-4 py-2 bg-black hover:bg-slate-850 text-white font-bold text-[10px] uppercase tracking-widest rounded-sm cursor-pointer transition select-none"
                >
                  Discover Columns &rarr;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Reading History logs */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] pb-2 border-b border-black text-slate-900 font-sans">
            Chronological History
          </h3>

          <div className="space-y-3 bg-slate-50 rounded-sm p-5 border border-slate-150">
            <div className="flex gap-4 items-start select-none">
              <span className="bg-white p-1.5 rounded-sm border border-slate-205 text-slate-600 shrink-0">
                <Newspaper className="h-4 w-4" />
              </span>
              <div className="text-left text-xs leading-normal">
                <span className="block font-bold text-slate-800">Quantum AI-agents study analysed</span>
                <p className="text-slate-400 text-[10px] mt-0.5 font-serif font-medium">Assessed deep sub-nanosecond processing logs 4 minutes ago.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start select-none border-t border-slate-200/50 pt-3">
              <span className="bg-white p-1.5 rounded-sm border border-slate-205 text-slate-650 shrink-0">
                <Bookmark className="h-4 w-4" />
              </span>
              <div className="text-left text-xs leading-normal">
                <span className="block font-bold text-slate-800">Saved exoplanetary transit records to Shelf</span>
                <p className="text-slate-400 text-[10px] mt-0.5 font-serif font-medium font-medium">Sourced atmosphere spectrograph metrics yesterday afternoon.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
