/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, Newspaper, MessageSquare, Radio, Shield, 
  Sparkles, Plus, Edit3, Trash2, CheckCircle, XCircle, 
  Eye, MousePointer, BarChart2, Calendar, FileText, AlertTriangle, 
  RefreshCw, Layers, Sliders, Play, Info, ArrowUpRight
} from "lucide-react";
import { Article, Category, Comment, AdBanner, User, DashboardStats } from "../types";

interface AdminDashboardViewProps {
  currentUser: User | null;
  articles: Article[];
  categories: Category[];
  comments: Comment[];
  ads: AdBanner[];
  onNavigate: (view: string, params?: any) => void;
  onCreateArticle: (articleData: any) => Promise<boolean>;
  onUpdateArticle: (id: string, articleData: any) => Promise<boolean>;
  onDeleteArticle: (id: string) => Promise<boolean>;
  onModerateComment: (id: string, status: "Approved" | "Rejected") => Promise<boolean>;
  onCreateCategory: (catData: any) => Promise<boolean>;
  onCreateAd: (adData: any) => Promise<boolean>;
}

export default function AdminDashboardView({
  currentUser,
  articles,
  categories,
  comments,
  ads,
  onNavigate,
  onCreateArticle,
  onUpdateArticle,
  onDeleteArticle,
  onModerateComment,
  onCreateCategory,
  onCreateAd
}: AdminDashboardViewProps) {
  
  // Tab control states: 'analytics' | 'articles' | 'categories' | 'comments' | 'ads'
  const [activeTab, setActiveTab] = useState<"analytics" | "articles" | "categories" | "comments" | "ads">("analytics");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Article form controller states
  const [formMode, setFormMode] = useState<"list" | "create" | "edit">("list");
  const [editArticleId, setEditArticleId] = useState<string | null>(null);
  
  // Draft outline fields
  const [artTitle, setArtTitle] = useState("");
  const [artSubtitle, setArtSubtitle] = useState("");
  const [artContent, setArtContent] = useState("");
  const [artSummary, setArtSummary] = useState("");
  const [artCategory, setArtCategory] = useState(categories[0]?.id || "tech");
  const [artTagsString, setArtTagsString] = useState("");
  const [artImage, setArtImage] = useState("");
  const [artVideo, setArtVideo] = useState("");
  const [artStatus, setArtStatus] = useState<"Draft" | "Published" | "Scheduled">("Draft");
  const [artScheduledDate, setArtScheduledDate] = useState("");
  const [artIsBreaking, setArtIsBreaking] = useState(false);
  const [artIsFeatured, setArtIsFeatured] = useState(false);

  // Gemini assistant editor state panel
  const [geminiSuggestions, setGeminiSuggestions] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiIsFallback, setGeminiIsFallback] = useState(false);

  // New Category schema fields
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catColor, setCatColor] = useState("indigo-600");
  const [catSuccess, setCatSuccess] = useState(false);

  // New Ad banner schema fields
  const [adName, setAdName] = useState("");
  const [adType, setAdType] = useState<any>("Banner");
  const [adPlacement, setAdPlacement] = useState<any>("sidebar");
  const [adImageUrl, setAdImageUrl] = useState("");
  const [adLinkUrl, setAdLinkUrl] = useState("");
  const [adSuccess, setAdSuccess] = useState(false);

  const [toastMsg, setToastMsg] = useState("");

  const fetchAnalytics = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/analytics");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to load CMS analytics stats:", e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [articles, comments, ads]);

  // Handle Toast pop trigger
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Trigger Gemini API suggest headline pipeline
  const handleGeminiSuggest = async () => {
    if (!artContent && !artTitle) {
      showToast("Please provide at least a title or content draft first.");
      return;
    }
    setGeminiLoading(true);
    try {
      const res = await fetch("/api/gemini/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: artTitle, content: artContent })
      });
      const data = await res.json();
      setGeminiSuggestions(data.suggestions);
      setGeminiIsFallback(!!data.isFallback);
    } catch (e) {
      console.error(e);
      setGeminiSuggestions("Alternative Headlines:\n1. 'System Connection Error: Sourcing AI outline.'\n\nSuggested tags:\n• Offline, • Network, • Local");
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = artTagsString.split(",").map(t => t.trim()).filter(Boolean);

    const articlePayload = {
      title: artTitle,
      subtitle: artSubtitle,
      content: artContent,
      summary: artSummary || artTitle,
      category: artCategory,
      featuredImage: artImage || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
      videoUrl: artVideo,
      tags: tagsArray,
      status: artStatus,
      isBreaking: artIsBreaking,
      isFeatured: artIsFeatured,
      authorId: currentUser?.id || "super-admin-1",
      scheduledDate: artStatus === "Scheduled" ? artScheduledDate : undefined
    };

    if (formMode === "create") {
      const success = await onCreateArticle(articlePayload);
      if (success) {
        showToast("Column Article successfully registered as " + artStatus + "!");
        resetArticleForm();
      }
    } else if (formMode === "edit" && editArticleId) {
      const success = await onUpdateArticle(editArticleId, articlePayload);
      if (success) {
        showToast("Column Article configuration successfully updated!");
        resetArticleForm();
      }
    }
  };

  const handleEditInit = (art: Article) => {
    setEditArticleId(art.id);
    setArtTitle(art.title);
    setArtSubtitle(art.subtitle);
    setArtContent(art.content);
    setArtSummary(art.summary);
    setArtCategory(art.category);
    setArtTagsString(art.tags.join(", "));
    setArtImage(art.featuredImage);
    setArtVideo(art.videoUrl || "");
    setArtStatus(art.status);
    setArtIsBreaking(art.isBreaking);
    setArtIsFeatured(art.isFeatured);
    setFormMode("edit");
  };

  const resetArticleForm = () => {
    setEditArticleId(null);
    setArtTitle("");
    setArtSubtitle("");
    setArtContent("");
    setArtSummary("");
    setArtTagsString("");
    setArtImage("");
    setArtVideo("");
    setArtStatus("Draft");
    setArtIsBreaking(false);
    setArtIsFeatured(false);
    setGeminiSuggestions("");
    setFormMode("list");
  };

  const handleDeleteTrigger = async (id: string) => {
    if (confirm("Are you absolutely certain you want to purge this article?")) {
      const success = await onDeleteArticle(id);
      if (success) {
        showToast("Article successfully purged from memory.");
      }
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    const success = await onCreateCategory({ name: catName, description: catDesc, color: catColor });
    if (success) {
      setCatName("");
      setCatDesc("");
      setCatSuccess(true);
      setTimeout(() => setCatSuccess(false), 3000);
      showToast("New category successfully registered.");
    }
  };

  const handleAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adName || !adLinkUrl) return;
    const success = await onCreateAd({ name: adName, type: adType, placement: adPlacement, imageUrl: adImageUrl || "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400", linkUrl: adLinkUrl });
    if (success) {
      setAdName("");
      setAdImageUrl("");
      setAdLinkUrl("");
      setAdSuccess(true);
      setTimeout(() => setAdSuccess(false), 3000);
      showToast("Marketing Campaign published!");
    }
  };

  // Simple comment spam filter pattern checker to assist moderator UI
  const detectCommentSpam = (content: string) => {
    const spamWords = ["1000x", "crypto", "telegram", "gains", "no scam", "token", "rich fast"];
    const text = content.toLowerCase();
    return spamWords.some(word => text.includes(word));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 select-none pb-24">
      
      {/* Toast Pop banner */}
      {toastMsg && (
        <div className="fixed top-24 right-4 z-50 bg-slate-950 border border-slate-850 text-white text-[10px] font-bold px-4 py-2.5 rounded-sm shadow-md flex items-center space-x-2 flex-wrap shrink-0 uppercase tracking-wider">
          <Info className="h-4 w-4 text-amber-500" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Panel Header details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-150 pb-5 gap-4">
        <div className="space-y-1 text-left">
          <div className="flex items-center space-x-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
            <Shield className="h-3.5 w-3.5 text-black" />
            <span>CHRONICLE PUBLISHERS CONSOLE</span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-black text-slate-950 tracking-tight leading-none">
            Editorial CMS Panel
          </h1>
          <p className="text-[10px] text-slate-450 font-serif font-medium">Log out using the simulated bypassing toggle at top. Sourced identities regulate role permissions: {currentUser?.role}</p>
        </div>

        {/* Toolbar Tabs navigators */}
        <div className="flex flex-wrap gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xs text-[10px] font-bold uppercase tracking-wider">
          <button 
            onClick={() => { setActiveTab("analytics"); resetArticleForm(); }}
            className={`px-3.5 py-1.5 rounded-xs transition cursor-pointer ${activeTab === "analytics" ? "bg-black text-white" : "text-slate-500 hover:text-black"}`}
          >
            <BarChart2 className="inline h-3.5 w-3.5 mr-1" />
            <span>Metrics</span>
          </button>
          <button 
            onClick={() => setActiveTab("articles")}
            className={`px-3.5 py-1.5 rounded-xs transition cursor-pointer ${activeTab === "articles" ? "bg-black text-white" : "text-slate-500 hover:text-black"}`}
          >
            <Newspaper className="inline h-3.5 w-3.5 mr-1" />
            <span>Articles</span>
          </button>
          <button 
            onClick={() => { setActiveTab("categories"); resetArticleForm(); }}
            className={`px-3.5 py-1.5 rounded-xs transition cursor-pointer ${activeTab === "categories" ? "bg-black text-white" : "text-slate-500 hover:text-black"}`}
          >
            <Layers className="inline h-3.5 w-3.5 mr-1" />
            <span>Categories</span>
          </button>
          <button 
            onClick={() => { setActiveTab("comments"); resetArticleForm(); }}
            className={`px-3.5 py-1.5 rounded-xs transition cursor-pointer ${activeTab === "comments" ? "bg-black text-white" : "text-slate-500 hover:text-black"}`}
          >
            <MessageSquare className="inline h-3.5 w-3.5 mr-1" />
            <span>Comments</span>
          </button>
          <button 
            onClick={() => { setActiveTab("ads"); resetArticleForm(); }}
            className={`px-3.5 py-1.5 rounded-xs transition cursor-pointer ${activeTab === "ads" ? "bg-black text-white" : "text-slate-500 hover:text-black"}`}
          >
            <Sliders className="inline h-3.5 w-3.5 mr-1" />
            <span>Campaigns</span>
          </button>
        </div>
      </div>

      {/* Core Tab panel Switcher */}
      <div className="mt-8">
        
        {/* TAB 1: ANALYTICS BOARD */}
        {activeTab === "analytics" && (
          <div className="space-y-8 animate-fade-in">
            {loadingStats ? (
              <div className="py-24 text-center text-sm text-slate-400 animate-pulse">
                Sourcing live analytical database nodes...
              </div>
            ) : stats ? (
              <div className="space-y-8">
                {/* Metrics top strip cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex items-center justify-between">
                    <div className="space-y-1 text-left">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Subscribers Sourced</span>
                      <div className="text-2xl font-serif font-black text-slate-900">{stats.totalUsers}</div>
                    </div>
                    <span className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <Users className="h-5.5 w-5.5" />
                    </span>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex items-center justify-between">
                    <div className="space-y-1 text-left">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Articles Compiled</span>
                      <div className="text-2xl font-serif font-black text-slate-900">{stats.totalArticles}</div>
                    </div>
                    <span className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                      <Newspaper className="h-5.5 w-5.5" />
                    </span>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex items-center justify-between">
                    <div className="space-y-1 text-left">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pending Moderations</span>
                      <div className="text-2xl font-serif font-black text-slate-900">{stats.totalPendingComments}</div>
                    </div>
                    <span className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                      <MessageSquare className="h-5.5 w-5.5" />
                    </span>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex items-center justify-between">
                    <div className="space-y-1 text-left">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Breaking channels</span>
                      <div className="text-2xl font-serif font-black text-slate-900">{stats.breakingCount} active</div>
                    </div>
                    <span className="p-3 bg-red-50 text-red-600 rounded-lg shrink-0">
                      <Radio className="h-5.5 w-5.5" />
                    </span>
                  </div>

                </div>

                {/* Handcrafted Interactive SVG Charts Grid (React 19 safe and highly tailored!) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* CHART A: LINE GRAPHS SITE VIEWS LAST 7 DAYS */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-4 text-left">
                    <div className="space-y-0.5">
                      <h4 className="font-serif font-black text-slate-900 text-sm">Audience Page Views Velocity</h4>
                      <p className="text-[10px] text-slate-400">Chronological rolling telemetry logs (Last 7 Days)</p>
                    </div>

                    {/* Clean line SVG */}
                    <div className="w-full h-56 pt-4">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180">
                        {/* Horizontal mesh grids lines */}
                        <line x1="30" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="30" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="30" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="30" y1="140" x2="480" y2="140" stroke="#f1f5f9" strokeWidth="1" />

                        {/* Node coordinates mappings:
                            May 15: 4200 (y ~ 138)
                            May 16: 4800 (y ~ 124)
                            May 17: 5600 (y ~ 108)
                            May 18: 6100 (y ~ 98)
                            May 19: 5200 (y ~ 116)
                            May 20: 7300 (y ~ 74)
                            May 21: 8900 (y ~ 42)
                        */}
                        <path 
                          d="M 30,138 L 105,124 L 180,108 L 255,98 L 330,116 L 405,74 L 480,42"
                          fill="none"
                          stroke="rgba(99, 102, 241, 0.9)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />

                        {/* Interactive Circle Indicators */}
                        <circle cx="30" cy="138" r="4.5" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                        <circle cx="105" cy="124" r="4.5" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                        <circle cx="180" cy="108" r="4.5" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                        <circle cx="255" cy="98" r="4.5" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                        <circle cx="330" cy="116" r="4.5" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                        <circle cx="405" cy="74" r="4.5" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                        <circle cx="480" cy="42" r="5" fill="#4f46e5" stroke="#fff" strokeWidth="2" />

                        {/* Metrics labels */}
                        <text x="30" y="162" className="fill-slate-400 font-mono text-[9px] text-center" textAnchor="middle">15th</text>
                        <text x="105" y="162" className="fill-slate-400 font-mono text-[9px] text-center" textAnchor="middle">16th</text>
                        <text x="180" y="162" className="fill-slate-400 font-mono text-[9px] text-center" textAnchor="middle">17th</text>
                        <text x="255" y="162" className="fill-slate-400 font-mono text-[9px] text-center" textAnchor="middle">18th</text>
                        <text x="330" y="162" className="fill-slate-400 font-mono text-[9px] text-center" textAnchor="middle">19th</text>
                        <text x="405" y="162" className="fill-slate-400 font-mono text-[9px] text-center" textAnchor="middle">20th</text>
                        <text x="480" y="162" className="fill-slate-900 font-mono text-[9px] font-bold text-center" textAnchor="middle">Today</text>

                        <text x="475" y="32" className="fill-indigo-600 font-mono text-[10px] font-black text-right" textAnchor="end">8.9K reads</text>
                      </svg>
                    </div>
                  </div>

                  {/* CHART B: BAR CHART CATEGORY PERFORMANCES */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-4 text-left">
                    <div className="space-y-0.5">
                      <h4 className="font-serif font-black text-slate-900 text-sm">Category Reading Ratios</h4>
                      <p className="text-[10px] text-slate-400">Total analytical clicks per editorial genre category</p>
                    </div>

                    {/* Handcrafted bar node graph */}
                    <div className="w-full h-56 pt-4">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 540 180">
                        {stats.categoryPerformance.slice(0, 5).map((cat, idx) => {
                          // Map height proportionally
                          const maxViews = 6000;
                          const height = Math.min(130, Math.max(15, (cat.views / maxViews) * 130));
                          const x = 40 + (idx * 100);
                          const y = 140 - height;
                          return (
                            <g key={cat.category} className="group/bar">
                              {/* Background column shell */}
                              <rect x={x} y="10" width="36" height="130" fill="#f8fafc" rx="4" />
                              {/* Filled value bar */}
                              <rect x={x} y={y} width="36" height={height} fill="#2563eb" rx="4" />
                              
                              {/* Category Name label */}
                              <text x={x + 18} y="162" className="fill-slate-500 font-sans text-[10px] font-semibold text-center" textAnchor="middle">
                                {cat.category}
                              </text>
                              {/* Numeric value scale overlay */}
                              <text x={x + 18} y={y - 6} className="fill-slate-800 font-mono text-[9px] font-bold text-center" textAnchor="middle">
                                {cat.views}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                </div>

                {/* Bottom detail tables: ad placements performance clicks */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs text-left">
                  <div className="border-b border-gray-100 pb-3 mb-4 space-y-1">
                    <h4 className="font-serif font-black text-slate-900 text-sm">Marketing Campaigns Click-Through Metrics</h4>
                    <span className="text-[10px] text-gray-400 block font-medium">Actively tracking custom advertisement banners CTR variables</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400 font-bold uppercase border-b border-gray-100 bg-slate-50 text-[10px] tracking-wider">
                          <th className="py-2.5 px-3 text-left">Campaign Name</th>
                          <th className="py-2.5 px-3 text-left">Ad Type</th>
                          <th className="py-2.5 px-3 text-center">Page Views</th>
                          <th className="py-2.5 px-3 text-center">User Clicks</th>
                          <th className="py-2.5 px-3 text-center">CTR Ratings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {ads.map(ad => {
                          const ctr = ad.views > 0 ? ((ad.clicks / ad.views) * 100).toFixed(1) : "0.0";
                          return (
                            <tr key={ad.id} className="hover:bg-slate-50">
                              <td className="py-3 px-3 font-semibold text-slate-800">{ad.name}</td>
                              <td className="py-3 px-3">
                                <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 border border-blue-100 rounded text-[10px] uppercase font-bold">{ad.type}</span>
                              </td>
                              <td className="py-3 px-3 text-center font-mono">{ad.views}</td>
                              <td className="py-3 px-3 text-center font-mono">{ad.clicks}</td>
                              <td className="py-3 px-3 text-center">
                                <span className="bg-emerald-50 text-emerald-700 font-mono font-bold px-2 py-0.5 rounded text-[10px]">
                                  {ctr}% CTR
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <p className="text-center py-12 text-xs text-gray-400">Database failed compilation. Try triggering edits or restart dev servers.</p>
            )}
          </div>
        )}

        {/* TAB 2: ARTICLES MANAGEMENT (Drafting, editing with Gemini) */}
        {activeTab === "articles" && (
          <div className="space-y-6 animate-fade-in text-left">
            
            {/* List panel */}
            {formMode === "list" && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div className="space-y-0.5">
                    <h3 className="font-serif font-black text-slate-900 text-sm">Global Dispatch Registry</h3>
                    <p className="text-[10px] text-gray-400">Total index of published, scheduled columns, and working draft boards.</p>
                  </div>
                  
                  {/* Allow Admin/Editors/Journalists to draft */}
                  {currentUser && (currentUser.role === "Super Admin" || currentUser.role === "Editor" || currentUser.role === "Journalist") ? (
                    <button 
                      onClick={() => setFormMode("create")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg flex items-center space-x-1 transition shadow-xs cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Draft a Column</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-amber-500 font-semibold border border-amber-200/50 bg-amber-50 p-2 rounded">
                      Role {currentUser?.role} does not possess publishing authorization levels.
                    </span>
                  )}
                </div>

                {/* Desktop Articles Grid */}
                <div className="overflow-x-auto text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-400 font-bold uppercase border-b border-gray-100 bg-slate-50 text-[10px] tracking-wider">
                        <th className="py-3 px-3 text-left">Title</th>
                        <th className="py-3 px-3 text-left">Category</th>
                        <th className="py-3 px-3 text-left">Author</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-center flex-wrap shrink-0">Views / Likes</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {articles.map(art => {
                        const isScheduled = art.status === "Scheduled";
                        return (
                          <tr key={art.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3 max-w-sm">
                              <div className="font-bold text-slate-900 truncate hover:text-indigo-600 cursor-pointer" onClick={() => onNavigate("article", { slug: art.slug })}>{art.title}</div>
                              <span className="text-[10px] text-gray-400">Created {new Date(art.publishDate).toLocaleDateString()} &bull; {art.readingTime}m</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{art.category}</span>
                            </td>
                            <td className="py-3 px-3 text-gray-500 font-semibold">{art.authorName}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider border ${
                                art.status === "Published" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                isScheduled ? "bg-blue-50 text-blue-700 border-blue-100 animate-pulse" :
                                "bg-amber-50 text-amber-700 border-amber-100"
                              }`}>
                                {art.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono space-x-2 text-slate-500">
                              <span>👁 {art.views}</span>
                              <span>❤️ {art.likes}</span>
                            </td>
                            <td className="py-3 px-3 text-right space-x-1 shrink-0 whitespace-nowrap">
                              {/* Edit buttons authorization restricts to admins, editors, or original author */}
                              {(currentUser?.role === "Super Admin" || currentUser?.role === "Editor" || currentUser?.id === art.authorId) && (
                                <>
                                  <button 
                                    onClick={() => handleEditInit(art)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition border border-gray-100 inline-block"
                                    title="Edit details"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteTrigger(art.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer transition border border-gray-100 inline-block"
                                    title="Delete purge"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Create or Edit dynamic forms panel with built-in Gemini Suggestions sidebar! */}
            {(formMode === "create" || formMode === "edit") && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Visual Editor Form fields */}
                <form onSubmit={handleArticleSubmit} className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap shrink-0">
                    <h3 className="font-serif font-black text-sm text-slate-900 uppercase">
                      {formMode === "create" ? "Draft New News Story" : "Configure Article Parameters"}
                    </h3>
                    <button 
                      type="button" 
                      onClick={resetArticleForm}
                      className="text-xs text-gray-500 hover:text-slate-900 border border-gray-200 px-3 py-1 rounded hover:bg-slate-50 transition cursor-pointer"
                    >
                      Back to list grid
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Article Title Header</label>
                      <input 
                        type="text"
                        placeholder="E.g. Quantum AI systems reach supersonic speeds..."
                        value={artTitle}
                        onChange={(e) => setArtTitle(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-lg outline-hidden focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subtitle Hook</label>
                      <input 
                        type="text"
                        placeholder="E.g. Researchers compute sparse vector loops instantly..."
                        value={artSubtitle}
                        onChange={(e) => setArtSubtitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-lg outline-hidden focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category ID</label>
                      <select 
                        value={artCategory}
                        onChange={(e) => setArtCategory(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:outline-hidden"
                      >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Metadata Tags (Commas Separated)</label>
                      <input 
                        type="text"
                        placeholder="Security, AI, Cloud, Spanner"
                        value={artTagsString}
                        onChange={(e) => setArtTagsString(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-lg outline-hidden focus:ring-1 focus:ring-slate-400"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Launch Target</label>
                      <select 
                        value={artStatus}
                        onChange={(e) => setArtStatus(e.target.value as any)}
                        className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:outline-hidden"
                      >
                        <option value="Draft">Draft Board</option>
                        <option value="Published">Publish Live</option>
                        <option value="Scheduled">Scheduled Calendar</option>
                      </select>
                    </div>
                  </div>

                  {artStatus === "Scheduled" && (
                    <div className="space-y-1.5 p-3 rounded-lg bg-blue-50 border border-blue-100 text-left animate-fade-in text-xs max-w-xs">
                      <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Target Schedule Calendar Date</label>
                      <input 
                        type="datetime-local"
                        value={artScheduledDate}
                        onChange={(e) => setArtScheduledDate(e.target.value)}
                        required
                        className="p-1 px-2.5 bg-white border border-blue-300 rounded text-xs select-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Featured Display Photo URL</label>
                      <input 
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={artImage}
                        onChange={(e) => setArtImage(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-lg outline-hidden focus:ring-1 focus:ring-slate-400 placeholder-gray-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Optional Video Embed MP4 URL</label>
                      <input 
                        type="text"
                        placeholder="https://www.w3schools.com/html/..."
                        value={artVideo}
                        onChange={(e) => setArtVideo(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-lg outline-hidden focus:ring-1 focus:ring-slate-400 placeholder-gray-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">TL;DR Visual Summary text</label>
                    <textarea 
                      rows={2}
                      placeholder="Write brief 1-2 sentence visual summary..."
                      value={artSummary}
                      onChange={(e) => setArtSummary(e.target.value)}
                      className="w-full p-3 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-400 placeholder-gray-300 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Core Editorial Content (Supports Markdown: &apos;# Header&apos;, &apos;&gt; Quotes&apos;)</label>
                    <textarea 
                      rows={9}
                      placeholder="# Sourcing Quantum Networks..."
                      value={artContent}
                      onChange={(e) => setArtContent(e.target.value)}
                      required
                      className="w-full p-3 font-serif text-xs bg-slate-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-400"
                    />
                  </div>

                  {/* Flag options selection */}
                  <div className="flex flex-wrap items-center gap-6 text-xs font-semibold py-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={artIsBreaking}
                        onChange={(e) => setArtIsBreaking(e.target.checked)}
                        className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-slate-800">Assign Breaking News Ticker</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={artIsFeatured}
                        onChange={(e) => setArtIsFeatured(e.target.checked)}
                        className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-slate-800">Feature on Slideshow Cover</span>
                    </label>
                  </div>

                  <button 
                    type="submit"
                    className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer text-center"
                  >
                    {formMode === "create" ? "Transmit and Log Draft Page Instance" : "Persist Article Configuration details"}
                  </button>
                </form>

                {/* TAB Column Right: Gemini Assistant suggest widget */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
                    <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                      <Sparkles className="h-5 w-5 text-indigo-400 fill-indigo-400 animate-pulse animate-spin" />
                      <div className="text-left leading-tight">
                        <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-widest">AI ARTICLE CO-COPILOT</span>
                        <h4 className="font-serif text-xs font-black text-white">Gemini SEO assistant</h4>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-normal text-left">
                      Struggling to outline alternative high-click titles or extract relevant semantic indicators? Tap the editor assistant below to source insights on keywords.
                    </p>

                    <button 
                      type="button"
                      disabled={geminiLoading}
                      onClick={handleGeminiSuggest}
                      className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
                    >
                      {geminiLoading ? "Mapping Outline..." : "Analyze Draft & Suggest Headlines"}
                    </button>

                    {geminiSuggestions && (
                      <div className="space-y-3.5 text-left animate-fade-in">
                        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Response Blueprint:</label>
                        <div className="text-[11px] text-slate-200 bg-slate-950 p-3.5 rounded-lg border border-slate-950 max-h-[220px] overflow-y-auto font-mono whitespace-pre-line leading-relaxed">
                          {geminiSuggestions}
                        </div>
                        {geminiIsFallback && (
                          <div className="flex gap-2 items-start bg-amber-500/10 border border-amber-600/30 text-amber-500 rounded p-2 text-[10px] leading-relaxed select-text">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                            <span>Using pre-seeded offline summaries. Update `GEMINI_API_KEY` to connect server nodes to active Gemini LLM grids securely!</span>
                          </div>
                        )}
                        <button 
                          type="button"
                          onClick={() => {
                            // Extract title suggestion if found or let them copy manually
                            navigator.clipboard.writeText(geminiSuggestions);
                            showToast("Suggestions copied to clipboard!");
                          }}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-semibold flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Copy output buffer</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 3: CATEGORIES LISTS CRUD */}
        {activeTab === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in text-left">
            
            {/* Create category panel forms */}
            <div className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="font-serif font-black text-slate-900 border-b border-gray-100 pb-2 text-sm uppercase">Register Category Shell</h4>
              
              <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest">Category Name</label>
                  <input 
                    type="text"
                    placeholder="E.g. FinTech, Artificial Systems"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest">Color Theme Class</label>
                  <select 
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded focus:outline-hidden"
                  >
                    <option value="emerald-600">Emerald Cyber Green (TechCrunch)</option>
                    <option value="indigo-600">Indigo Sapphire (Medium)</option>
                    <option value="blue-600">Electric Royal Blue</option>
                    <option value="red-600">Scarlet Crimson</option>
                    <option value="purple-600">Deep Amethyst</option>
                    <option value="orange-600">Burnt Amber</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest">Purpose Description</label>
                  <textarea 
                    rows={3}
                    placeholder="E.g. Sourcing corporate capital and funding algorithms..."
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded focus:outline-hidden resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-white font-extrabold rounded-lg transition text-xs cursor-pointer text-center"
                >
                  Regulate Brand category Node
                </button>
              </form>

              {catSuccess && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2 text-xs rounded font-semibold text-center mt-3 animate-fade-in">
                  ✓ Category successfully logged in memory schema.
                </div>
              )}
            </div>

            {/* List panel */}
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-gray-100 pb-2">
                <h4 className="font-serif font-black text-slate-900 text-sm uppercase">Active Category Nodes ({categories.length})</h4>
              </div>

              <div className="divide-y divide-gray-100">
                {categories.map(cat => (
                  <div key={cat.id} className="py-4 flex items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`h-2.5 w-2.5 rounded-full bg-${cat.color}`} />
                        <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">ID: {cat.id}</span>
                      </div>
                      <p className="text-gray-500 text-xs font-medium max-w-lg">{cat.description}</p>
                    </div>

                    <span className="text-[10px] font-bold text-gray-400 tracking-wider">REST Node Active</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: COMMENTS MODERATION (Spam alerts & Auto Flags) */}
        {activeTab === "comments" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs text-left space-y-4 animate-fade-in">
            <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <h3 className="font-serif font-black text-slate-900 text-sm">Audience Commentary Pipeline</h3>
                <p className="text-[10px] text-gray-400">Moderating and vetting audience insights to protect platforms against digital spam vectors.</p>
              </div>
              <span className="bg-amber-100 text-amber-800 border border-amber-200 font-bold px-2.5 py-1 text-[10px] rounded uppercase">Role Required: Moderator / Admin</span>
            </div>

            <div className="space-y-4">
              {comments.map(c => {
                const isSpam = detectCommentSpam(c.content);
                const isAppColor = c.status === "Approved" ? "border-emerald-200 bg-emerald-50/20" : c.status === "Rejected" ? "border-red-200 bg-red-50/20" : "border-gray-100 bg-slate-50/30";
                return (
                  <div key={c.id} className={`border p-4.5 rounded-2xl flex flex-col md:flex-row justify-between gap-4 items-start ${isAppColor} transition-colors`}>
                    
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <img src={c.userAvatar} alt={c.userName} className="h-8 w-8 rounded-full object-cover border border-slate-200" />
                        <div className="text-xs leading-none">
                          <span className="block font-bold text-slate-800">{c.userName}</span>
                          <span className="text-[10px] text-gray-400 italic font-semibold">{c.userEmail} &bull; {new Date(c.date).toLocaleDateString()}</span>
                        </div>

                        {isSpam && (
                          <span className="bg-red-100 text-red-700 border border-red-200 font-bold px-2 py-0.5 text-[9px] tracking-wider rounded uppercase flex items-center space-x-1 animate-pulse">
                            <AlertTriangle className="h-3 w-3 inline" />
                            <span>Spam Alarm Detected</span>
                          </span>
                        )}

                        {c.reportCount > 0 && (
                          <span className="bg-orange-100 text-orange-700 border border-orange-200 font-extrabold px-2 py-0.5 text-[9px] rounded uppercase">
                            ⚠️ {c.reportCount} Users Reported This
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 select-text bg-white p-3 border border-gray-100 rounded-xl leading-relaxed">
                        {c.content}
                      </p>

                      <div className="text-[10px] text-gray-400 font-semibold">
                        Reference Dispatch: <span className="text-indigo-600 hover:underline hover:text-indigo-800 font-bold cursor-pointer">{c.articleTitle}</span>
                      </div>
                    </div>

                    {/* Actions control */}
                    <div className="flex flex-row md:flex-col gap-2 shrink-0 md:justify-end text-xs w-full md:w-auto">
                      
                      {c.status === "Pending" ? (
                        <>
                          <button 
                            onClick={async () => {
                              const success = await onModerateComment(c.id, "Approved");
                              if (success) showToast("Insight approved and launched!");
                            }}
                            className="flex-1 md:w-28 px-3 py-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition shadow-xs"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Approve publish</span>
                          </button>
                          <button 
                            onClick={async () => {
                              const success = await onModerateComment(c.id, "Rejected");
                              if (success) showToast("Insight rejected and deleted.");
                            }}
                            className="flex-1 md:w-28 px-3 py-1.5 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject & delete</span>
                          </button>
                        </>
                      ) : (
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded uppercase text-center w-full md:w-28 cursor-default ${
                          c.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                          {c.status}
                        </span>
                      )}

                    </div>

                  </div>
                );
              })}

              {comments.length === 0 && (
                <p className="text-center py-12 text-xs text-gray-400 italic">No commentary pipeline feeds registered.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CAMPAIGNS PLACEMENT & CTR GRIDS */}
        {activeTab === "ads" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in text-left">
            
            {/* Create campaign form */}
            <div className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="font-serif font-black text-slate-900 border-b border-gray-100 pb-2 text-sm uppercase">Register Campaign Banner</h4>
              
              <form onSubmit={handleAdSubmit} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest">Sponsor Name</label>
                  <input 
                    type="text"
                    placeholder="E.g. Apex Cloud databases"
                    value={adName}
                    onChange={(e) => setAdName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest">Campaign Style</label>
                    <select 
                      value={adType}
                      onChange={(e) => setAdType(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded focus:outline-hidden"
                    >
                      <option value="Sponsored">Sponsored Ads</option>
                      <option value="Banner">Top Banner</option>
                      <option value="In-feed">In-Feed Layout</option>
                      <option value="Sidebar">Sidebar Card</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest">Placement Location</label>
                    <select 
                      value={adPlacement}
                      onChange={(e) => setAdPlacement(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded focus:outline-hidden"
                    >
                      <option value="top-header">Header Margin strip</option>
                      <option value="sidebar">Sidebar Widget</option>
                      <option value="in-feed">Feeds grid lists card</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest">Campaign Click Destination Link</label>
                  <input 
                    type="text"
                    placeholder="https://cloud.google.com/spanner"
                    value={adLinkUrl}
                    onChange={(e) => setAdLinkUrl(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest">Visual Image URL</label>
                  <input 
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={adImageUrl}
                    onChange={(e) => setAdImageUrl(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded focus:outline-hidden focus:ring-1 focus:ring-slate-400 placeholder-gray-300"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-white font-extrabold rounded-lg transition text-xs cursor-pointer text-center"
                >
                  Deploy Advertisement Node
                </button>
              </form>

              {adSuccess && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2 text-xs rounded font-semibold text-center mt-3 animate-fade-in">
                  ✓ Marketing campaign registered in schema.
                </div>
              )}
            </div>

            {/* List panel and ad overview banner specs */}
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-gray-100 pb-2">
                <h4 className="font-serif font-black text-slate-900 text-sm uppercase">Active Advertisement Campaigns</h4>
              </div>

              <div className="divide-y divide-gray-100">
                {ads.map(ad => {
                  const ctrPct = ad.views > 0 ? ((ad.clicks / ad.views) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={ad.id} className="py-4.5 flex gap-4.5 items-center select-none justify-between">
                      <div className="flex gap-4 items-center flex-1">
                        <img src={ad.imageUrl} alt={ad.name} className="h-11 w-11 rounded-lg border border-slate-200 object-cover shrink-0" />
                        <div className="space-y-0.5 text-xs text-left">
                          <span className="block font-bold text-slate-900">{ad.name}</span>
                          <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded uppercase">Placement: {ad.placement}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-xs text-center">
                        <div className="space-y-0.5">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block">IMPRESSIONS</span>
                          <span className="font-mono font-bold text-slate-700">{ad.views}</span>
                        </div>
                        <div className="space-y-0.5 border-l border-gray-200 pl-4">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block">CLICKS</span>
                          <span className="font-mono font-bold text-slate-700 text-blue-600">{ad.clicks}</span>
                        </div>
                        <div className="space-y-0.5 border-l border-gray-200 pl-4 shrink-0">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block shrink-0">CTR LEVEL</span>
                          <span className="font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">{ctrPct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
