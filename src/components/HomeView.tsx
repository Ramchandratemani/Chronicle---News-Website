/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ArrowRight, Heart, Share2, Eye, Calendar, BookOpen, 
  Sparkles, Mail, Play, AlertCircle, ChevronLeft, ChevronRight, Clock 
} from "lucide-react";
import { Article, Category, AdBanner } from "../types";

interface HomeViewProps {
  articles: Article[];
  categories: Category[];
  activeAd?: AdBanner;
  onNavigate: (view: string, params?: any) => void;
  onTrackAd: (id: string, action: "view" | "click") => void;
  onSubscribeNewsletter: (email: string) => Promise<boolean>;
  onToggleBookmark: (slug: string) => void;
  bookmarkedSlugs: string[];
}

export default function HomeView({
  articles,
  categories,
  activeAd,
  onNavigate,
  onTrackAd,
  onSubscribeNewsletter,
  onToggleBookmark,
  bookmarkedSlugs
}: HomeViewProps) {
  const [heroIndex, setHeroIndex] = useState(0);
  const [newsLetterEmail, setNewsLetterEmail] = useState("");
  const [newsletterSubbed, setNewsletterSubbed] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Filter out draft/scheduled, retrieve featured and standard
  const publishedArticles = articles.filter(a => a.status === "Published");
  const featuredArticles = publishedArticles.filter(a => a.isFeatured);
  const coreHeroList = featuredArticles.length > 0 ? featuredArticles : publishedArticles.slice(0, 3);
  const standardArticles = publishedArticles.filter(a => !coreHeroList.some(h => h.id === a.id));

  // Simulated trending (sort by views)
  const trendingArticles = [...publishedArticles]
    .sort((a, b) => b.views - a.views)
    .slice(0, 4);

  // Trigger view telemetry for ads if display exists
  React.useEffect(() => {
    if (activeAd) {
      onTrackAd(activeAd.id, "view");
    }
  }, [activeAd]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsLetterEmail) return;
    setNewsletterLoading(true);
    const success = await onSubscribeNewsletter(newsLetterEmail);
    setNewsletterLoading(false);
    if (success) {
      setNewsletterSubbed(true);
      setNewsLetterEmail("");
    }
  };

  const handleHeroNext = () => {
    setHeroIndex(prev => (prev + 1) % coreHeroList.length);
  };

  const handleHeroPrev = () => {
    setHeroIndex(prev => (prev - 1 + coreHeroList.length) % coreHeroList.length);
  };

  const activeHero = coreHeroList[heroIndex];

  return (
    <div className="space-y-12 pb-16">
      
      {/* Dynamic Sponsored Upper Banner Unit */}
      {activeAd && activeAd.placement === "top-header" && (
        <div className="w-full bg-slate-50 border-b border-slate-150 py-2.5 px-6">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between text-xs">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 bg-slate-200 px-2 py-0.5 rounded-xs">ADVERTISEMENT</span>
            <a 
              href={activeAd.linkUrl} 
              target="_blank" 
              rel="noreferrer"
              onClick={() => onTrackAd(activeAd.id, "click")}
              className="flex items-center space-x-3 text-slate-600 hover:text-black font-semibold focus:outline-hidden text-center md:text-left mt-2 md:mt-0 transition duration-150"
            >
              <span className="font-sans text-[11px] font-medium">{activeAd.name}</span>
              <span className="text-blue-600 hover:underline text-[11px] font-sans font-bold">Launch Solution &rarr;</span>
            </a>
          </div>
        </div>
      )}

      {/* Hero Breaking News Section: Cinematic Slider */}
      {activeHero && (
        <section className="mx-auto max-w-7xl px-6 mt-6">
          <div className="relative rounded-sm overflow-hidden bg-slate-950 h-[380px] lg:h-[420px] group/hero">
            
            {/* Background Image Panel */}
            <div className="absolute inset-0 transition-transform duration-1000 ease-out group-hover/hero:scale-101">
              <img 
                src={activeHero.featuredImage} 
                alt={activeHero.title} 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>

            {/* Content Overlays */}
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-col justify-end h-full">
              <div className="max-w-3xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-red-650 bg-red-600 text-white font-extrabold uppercase px-2 py-0.5 text-[9px] tracking-widest rounded-xs">
                    {activeHero.isBreaking ? "Breaking" : "Feature"}
                  </span>
                  <span className="bg-black/60 text-white font-semibold uppercase px-2 py-0.5 text-[9px] tracking-widest rounded-xs">
                    {activeHero.category.toUpperCase()}
                  </span>
                  <span className="text-slate-300 text-[10px] uppercase tracking-wider font-semibold flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{activeHero.readingTime} min read</span>
                  </span>
                </div>

                <h1 
                  onClick={() => onNavigate("article", { slug: activeHero.slug })}
                  className="font-serif text-2xl md:text-4xl font-bold tracking-tight text-white leading-tight cursor-pointer hover:underline underline-offset-4 decoration-1 transition-colors"
                >
                  {activeHero.title}
                </h1>

                <p className="text-slate-300 text-xs md:text-sm line-clamp-2 max-w-2xl font-serif leading-relaxed">
                  {activeHero.summary}
                </p>

                {/* Author attribution info */}
                <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/10">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={activeHero.authorAvatar} 
                      alt={activeHero.authorName} 
                      className="h-8 w-8 rounded-sm object-cover border border-white/20"
                    />
                    <div className="text-left leading-tight">
                      <span className="block text-xs font-bold text-white lowercase tracking-tight">{activeHero.authorName.replace(/\s+/g, "").toLowerCase()}</span>
                      <span className="text-[9px] text-slate-400 font-medium">Journalist &bull; {new Date(activeHero.publishDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate("article", { slug: activeHero.slug })}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-[10px] tracking-wider uppercase rounded-xs transition cursor-pointer"
                  >
                    <span>Full Analysis</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Slider navigations */}
            {coreHeroList.length > 1 && (
              <>
                <button 
                  onClick={handleHeroPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white cursor-pointer transition opacity-0 group-hover/hero:opacity-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                  onClick={handleHeroNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white cursor-pointer transition opacity-0 group-hover/hero:opacity-100"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

          </div>
        </section>
      )}

      {/* Main Bento Layout: Trending, latest & Category Streams */}
      <section className="mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: News streams */}
        <div className="lg:col-span-2 space-y-10">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="font-serif text-lg font-bold tracking-tight text-slate-900">
              Latest Columns
            </h2>
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:underline cursor-pointer flex items-center space-x-1">
              <span>View Archives</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {standardArticles.map(art => {
              const isSaved = bookmarkedSlugs.includes(art.slug);
              return (
                <article 
                  key={art.id} 
                  className="flex flex-col justify-between bg-white border border-slate-100 rounded-sm overflow-hidden transition-all duration-150 hover:border-slate-300 group"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-50">
                    <img 
                      src={art.featuredImage} 
                      alt={art.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-101"
                    />
                    <span className="absolute top-3 left-3 bg-black text-white font-bold uppercase px-2 py-0.5 text-[8px] tracking-widest rounded-xs select-none">
                      {art.category.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-slate-350" />
                        <span>{new Date(art.publishDate).toLocaleDateString()} &bull; {art.readingTime} min read</span>
                      </span>
                      <h3 
                        onClick={() => onNavigate("article", { slug: art.slug })}
                        className="font-serif text-base font-bold text-slate-900 cursor-pointer line-clamp-2 hover:underline hover:text-black tracking-tight leading-snug transition-all"
                      >
                        {art.title}
                      </h3>
                      <p className="text-slate-500 text-xs font-serif line-clamp-2 leading-relaxed">
                        {art.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={art.authorAvatar} 
                          alt={art.authorName} 
                          className="h-6 w-6 rounded-sm object-cover border border-slate-200"
                        />
                        <span className="text-[10px] font-bold text-slate-700 lowercase tracking-tight">{art.authorName.replace(/\s+/g, "").toLowerCase()}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2.5 text-slate-400">
                        <button 
                          onClick={() => onToggleBookmark(art.slug)}
                          className={`p-1.5 rounded-sm hover:bg-slate-50 transition cursor-pointer ${isSaved ? "text-amber-500" : "hover:text-amber-500"}`}
                          title={isSaved ? "Saved" : "Save Article"}
                        >
                          <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                          </svg>
                        </button>
                        <span className="text-[9px] font-mono flex items-center space-x-0.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{art.views}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {standardArticles.length === 0 && (
              <div className="col-span-2 text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-sm space-y-1.5 bg-slate-50">
                <AlertCircle className="h-6 w-6 mx-auto text-slate-350" />
                <p className="text-xs font-medium">All pending insights are slated inside the admin CMS portal.</p>
              </div>
            )}
          </div>

          {/* Embedded Interactive Video Section */}
          <div className="bg-slate-50 border border-slate-150 rounded-sm p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Chronicle Video Feed</span>
                <h3 className="font-serif text-base font-bold">Press Room Immersive</h3>
              </div>
              <span className="bg-red-500/10 text-red-600 border border-red-200 px-2 py-0.5 rounded-xs text-[8px] uppercase font-bold tracking-wider animate-pulse">Live Feed</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="rounded-sm overflow-hidden aspect-video bg-black relative group shadow-xs">
                {articles[0]?.videoUrl ? (
                  <video 
                    src={articles[0].videoUrl} 
                    controls 
                    className="w-full h-full object-cover" 
                    poster={articles[0].featuredImage}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-950">
                    <Play className="h-10 w-10 text-slate-550 group-hover:scale-105 transition duration-300" />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <span className="text-[8px] font-bold tracking-wider bg-slate-200 text-slate-800 px-2 py-0.5 rounded-xs">BREAKING ROADCAST PREVIEW</span>
                <h4 className="font-bold text-sm tracking-tight text-slate-900 hover:underline transition cursor-pointer" onClick={() => onNavigate("article", { slug: articles[0]?.slug })}>
                  {articles[0]?.title || "Broadcasting upcoming global summit developments..."}
                </h4>
                <p className="text-slate-500 text-xs leading-relaxed font-serif line-clamp-3">
                  Watch live coverage from our principal journalists deployed on-site mapping topological computing records, sustainable logistics, and deep-space exoplanet atmosphere spectrographs.
                </p>
                <button 
                  onClick={() => onNavigate("article", { slug: articles[0]?.slug })}
                  className="text-[10px] text-blue-600 hover:underline flex items-center space-x-1 cursor-pointer font-bold uppercase tracking-wider"
                >
                  <span>Explore Associated Column</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Trending, sidebar ads & Newsletter info */}
        <div className="space-y-8">
          
          {/* Trending Panel (sorted by views) */}
          <div className="border border-slate-150 rounded-sm p-6 bg-slate-50 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] pb-2 border-b border-black text-slate-900 font-sans">
              Trending Now
            </h3>

            <div className="space-y-5">
              {trendingArticles.map((art, i) => (
                <div key={art.id} className="flex gap-4 items-start select-none">
                  <span className="font-serif text-2xl font-black text-slate-200 shrink-0 leading-none">
                    0{i + 1}
                  </span>
                  <div className="space-y-1 text-left">
                    <span className="text-[8px] uppercase font-bold tracking-widest text-slate-400">
                      {art.category}
                    </span>
                    <h4 
                      onClick={() => onNavigate("article", { slug: art.slug })}
                      className="text-xs font-bold text-slate-950 hover:underline cursor-pointer line-clamp-2 leading-snug"
                    >
                      {art.title}
                    </h4>
                    <span className="block text-[9px] text-slate-455 font-serif font-medium text-slate-400">
                      by {art.authorName.replace(/\s+/g, "").toLowerCase()} &bull; {art.views} reads
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ad banner Sidebar */}
          {activeAd && activeAd.placement === "sidebar" && (
            <div className="border border-slate-150 rounded-sm p-4 bg-white space-y-3 relative overflow-hidden group">
              <div className="flex justify-between items-center">
                <span className="text-[8px] uppercase font-bold tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-xs">ADVERTISEMENT PARTNER</span>
                <span className="text-[9px] text-slate-400">Vetted</span>
              </div>
              <a 
                href={activeAd.linkUrl} 
                target="_blank" 
                rel="noreferrer"
                onClick={() => onTrackAd(activeAd.id, "click")}
                className="block space-y-3 focus:outline-hidden"
              >
                <img 
                  src={activeAd.imageUrl} 
                  alt={activeAd.name} 
                  className="w-full h-40 object-cover rounded-xs shadow-none group-hover:opacity-95 transition duration-200"
                />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-slate-900 group-hover:underline leading-snug">
                    {activeAd.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-serif leading-normal line-clamp-2">
                    Access premium cloud integrations and infrastructure designed for modern software scale.
                  </p>
                </div>
              </a>
            </div>
          )}

          {/* Core Newsletter signup */}
          <div className="bg-blue-50/50 border border-blue-105 border-slate-100 rounded-sm p-6 text-slate-900 relative overflow-hidden">
            <div className="space-y-4">
              <span className="text-[9px] font-bold tracking-widest text-blue-600 uppercase">Daily Briefing</span>
              <h3 className="font-serif text-lg font-bold leading-tight">Subscribe to Weekly Intel</h3>
              <p className="text-slate-655 text-xs font-serif leading-relaxed text-slate-600">
                Join 14,000+ publishers, founders, and research analysts reading sub-nanosecond hardware updates, climate tech, and global trade corridors.
              </p>

              {newsletterSubbed ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xs text-xs font-semibold leading-relaxed animate-fade-in">
                  ✓ Welcome aboard! You have successfully registered for our premium Weekly Intel. Check your inbox this Saturday!
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <input 
                    type="email"
                    placeholder="your@email.com"
                    value={newsLetterEmail}
                    onChange={(e) => setNewsLetterEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-sm bg-white border border-blue-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button 
                    type="submit"
                    disabled={newsletterLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-sm uppercase tracking-widest cursor-pointer transition-colors duration-150"
                  >
                    {newsletterLoading ? "Registering..." : "Subscribe Now"}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </section>

    </div>
  );
}
