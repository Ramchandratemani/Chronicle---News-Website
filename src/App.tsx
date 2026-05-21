/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  User, UserRole, Article, Category, Comment, AdBanner 
} from "./types";
import Navigation from "./components/Navigation";
import HomeView from "./components/HomeView";
import ArticleDetailView from "./components/ArticleDetailView";
import CategoryView from "./components/CategoryView";
import BookmarksView from "./components/BookmarksView";
import AdminDashboardView from "./components/AdminDashboardView";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole | "Visitor">("Subscriber");
  
  // Sourced structural database tables
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Addressable Hash routing state
  const [currentView, setCurrentView] = useState("home");
  const [routeParams, setRouteParams] = useState<any>({});
  
  // Global search and filter settings
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNavCategory, setActiveNavCategory] = useState<string | null>(null);

  // Parse URL Hash manually to orchestrate addressable routes
  const handleHashRouting = () => {
    const hash = window.location.hash;
    
    if (!hash || hash === "#/" || hash === "#home") {
      setCurrentView("home");
      setRouteParams({});
      setActiveNavCategory(null);
    } else if (hash === "#/bookmarks") {
      setCurrentView("bookmarks");
      setRouteParams({});
      setActiveNavCategory("bookmarks");
    } else if (hash === "#/admin") {
      setCurrentView("admin");
      setRouteParams({});
      setActiveNavCategory(null);
    } else if (hash.startsWith("#/category/")) {
      const id = hash.replace("#/category/", "");
      setCurrentView("category");
      setRouteParams({ id });
      setActiveNavCategory(id);
    } else if (hash.startsWith("#/article/")) {
      const slug = hash.replace("#/article/", "");
      setCurrentView("article");
      setRouteParams({ slug });
      setActiveNavCategory(null);
    }
  };

  // Bind hash change listener on boot
  useEffect(() => {
    handleHashRouting();
    window.addEventListener("hashchange", handleHashRouting);
    return () => window.removeEventListener("hashchange", handleHashRouting);
  }, []);

  // Custom visual navigation helper that updates URL Hash
  const navigateTo = (view: string, params?: any) => {
    if (view === "home") {
      window.location.hash = "#/";
    } else if (view === "bookmarks") {
      window.location.hash = "#/bookmarks";
    } else if (view === "admin") {
      window.location.hash = "#/admin";
    } else if (view === "category" && params?.id) {
      window.location.hash = `#/category/${params.id}`;
    } else if (view === "article" && params?.slug) {
      window.location.hash = `#/article/${params.slug}`;
    }
  };

  // Sync simulated credentials with the Express server
  const loadUserByRole = async (role: UserRole | "Visitor") => {
    if (role === "Visitor") {
      setCurrentUser(null);
      return;
    }
    try {
      const res = await fetch(`/api/auth/me?role=${encodeURIComponent(role)}`);
      const user = await res.json();
      setCurrentUser(user);
    } catch (e) {
      console.error("Auth sync error:", e);
    }
  };

  // Bulk load news dispatches metrics
  const loadDatabaseTables = async () => {
    setLoadingData(true);
    try {
      const [articlesRes, categoriesRes, commentsRes, adsRes] = await Promise.all([
        fetch("/api/articles?status=Published"),
        fetch("/api/categories"),
        fetch("/api/comments"),
        fetch("/api/ads")
      ]);

      const [articlesData, categoriesData, commentsData, adsData] = await Promise.all([
        articlesRes.json(),
        categoriesRes.json(),
        commentsRes.json(),
        adsRes.json()
      ]);

      setArticles(articlesData);
      setCategories(categoriesData);
      setComments(commentsData);
      setAds(adsData);
    } catch (e) {
      console.error("Failed to load tables:", e);
    } finally {
      setLoadingData(false);
    }
  };

  // Reload analytical databases if role transitions (admin dashboard needs draft articles etc.)
  const syncPrivateCmsData = async () => {
    if (activeRole === "Visitor" || activeRole === "Subscriber") {
      // Just load public dispatches
      loadDatabaseTables();
      return;
    }
    
    // Editors/Journalists/Admins source ALL articles including drafts and scheduled columns
    try {
      const [articlesRes, categoriesRes, commentsRes, adsRes] = await Promise.all([
        fetch("/api/articles"), // Sourcing draft database table rows too
        fetch("/api/categories"),
        fetch("/api/comments"),
        fetch("/api/ads")
      ]);

      const [articlesData, categoriesData, commentsData, adsData] = await Promise.all([
        articlesRes.json(),
        categoriesRes.json(),
        commentsRes.json(),
        adsRes.json()
      ]);

      setArticles(articlesData);
      setCategories(categoriesData);
      setComments(commentsData);
      setAds(adsData);
    } catch (e) {
      console.error("Cms sync failed:", e);
    }
  };

  useEffect(() => {
    loadUserByRole(activeRole);
  }, [activeRole]);

  useEffect(() => {
    syncPrivateCmsData();
  }, [activeRole]);

  const handleGlobalSearch = (query: string) => {
    setSearchQuery(query);
    navigateTo("home");
  };

  const handleTrackAd = async (id: string, action: "view" | "click") => {
    try {
      await fetch(`/api/ads/${id}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubscribeNewsletter = async (email: string) => {
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      return !!data.success;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleToggleBookmark = async (articleSlug: string) => {
    if (!currentUser) {
      alert("Please choose a subscriber/user identity to bookmark dispatches.");
      return;
    }
    try {
      const res = await fetch("/api/bookmarks/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, articleSlug })
      });
      const data = await res.json();
      
      // Update local state mappings
      setCurrentUser(prev => prev ? { ...prev, bookmarks: data.bookmarks } : null);
      syncPrivateCmsData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateUserBio = (name: string, bio: string) => {
    if (!currentUser) return;
    setCurrentUser(prev => prev ? { ...prev, name, bio } : null);
  };

  // CMS: Moderate a comment write state
  const handleModerateComment = async (id: string, status: "Approved" | "Rejected") => {
    try {
      const res = await fetch(`/api/comments/${id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        syncPrivateCmsData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // CMS: Publish commentary insight from frontend detail view
  const handlePostCommentInput = async (content: string) => {
    if (!currentUser || !routeParams.slug) return false;
    const activeArticle = articles.find(a => a.slug === routeParams.slug);
    if (!activeArticle) return false;

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: activeArticle.id,
          articleTitle: activeArticle.title,
          userName: currentUser.name,
          userEmail: currentUser.email,
          userAvatar: currentUser.avatar,
          content
        })
      });
      if (res.ok) {
        syncPrivateCmsData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // CMS: Create New Category record
  const handleCreateCategory = async (catData: any) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catData)
      });
      if (res.ok) {
        syncPrivateCmsData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // CMS: Create New Campaign write state ad
  const handleCreateAd = async (adData: any) => {
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adData) // Preseed ad ID inside
      });
      if (res.ok) {
        syncPrivateCmsData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // CMS: Save full custom article details
  const handleCreateArticle = async (articleData: any) => {
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleData)
      });
      if (res.ok) {
        syncPrivateCmsData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // CMS: Edit config params details of article
  const handleUpdateArticle = async (id: string, articleData: any) => {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleData)
      });
      if (res.ok) {
        syncPrivateCmsData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // CMS: Delete purge article
  const handleDeleteArticle = async (id: string) => {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        syncPrivateCmsData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // Sourcing standard bookmark data matches
  const bookmarkedArticles = articles.filter(a => 
    currentUser?.bookmarks?.includes(a.slug) || currentUser?.bookmarks?.includes(a.id)
  );

  const breakingArticles = articles.filter(a => a.isBreaking && a.status === "Published");
  const sidebarAd = ads.find(ad => ad.placement === "sidebar" && ad.isActive);
  const headerAd = ads.find(ad => ad.placement === "top-header" && ad.isActive);

  // Filter lists based on Search criteria if home
  const filteredHomeArticles = searchQuery.trim() !== ""
    ? articles.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.tags.some(t => t.toLowerCase() === searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between">
      
      {/* 1. Header Navigation Bar layout */}
      <Navigation 
        currentUser={currentUser}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        categories={categories}
        activeCategory={activeNavCategory}
        onNavigate={navigateTo}
        breakingArticles={breakingArticles}
        onSearch={handleGlobalSearch}
        searchQuery={searchQuery}
      />

      {/* 2. Main content viewport section based on Routing conditions */}
      <main className="flex-1 bg-white">
        {loadingData ? (
          <div className="py-32 text-center text-xs font-mono tracking-widest text-gray-500 uppercase animate-pulse">
            Compiling and loading Chronicle database...
          </div>
        ) : (
          <div className="animate-fade-in">
            {currentView === "home" && (
              <HomeView 
                articles={filteredHomeArticles}
                categories={categories}
                activeAd={sidebarAd || ads[0]}
                onNavigate={navigateTo}
                onTrackAd={handleTrackAd}
                onSubscribeNewsletter={handleSubscribeNewsletter}
                onToggleBookmark={handleToggleBookmark}
                bookmarkedSlugs={currentUser?.bookmarks || []}
              />
            )}

            {currentView === "article" && (() => {
              const activeArticle = articles.find(a => a.slug === routeParams.slug);
              if (!activeArticle) {
                return (
                  <div className="py-24 text-center text-xs text-gray-400 font-medium">
                    Dispatch column exose not found.Sourced identifier: {routeParams.slug}
                  </div>
                );
              }
              const related = articles.filter(a => a.id !== activeArticle.id && a.category === activeArticle.category).slice(0, 3);
              const isSaved = currentUser?.bookmarks?.includes(activeArticle.slug) || currentUser?.bookmarks?.includes(activeArticle.id) || false;
              
              return (
                <ArticleDetailView 
                  article={activeArticle}
                  relatedArticles={related}
                  comments={comments}
                  currentUser={currentUser}
                  onNavigate={navigateTo}
                  onPostComment={handlePostCommentInput}
                  onToggleBookmark={handleToggleBookmark}
                  isBookmarked={isSaved}
                  activeAd={sidebarAd}
                  onTrackAd={handleTrackAd}
                />
              );
            })()}

            {currentView === "category" && (() => {
              const activeCat = categories.find(c => c.id === routeParams.id);
              if (!activeCat) {
                return <div className="py-24 text-center text-xs text-gray-400">Category hub not found.</div>;
              }
              return (
                <CategoryView 
                  category={activeCat}
                  articles={articles}
                  onNavigate={navigateTo}
                />
              );
            })()}

            {currentView === "bookmarks" && (
              <BookmarksView 
                currentUser={currentUser}
                bookmarkedArticles={bookmarkedArticles}
                onNavigate={navigateTo}
                onToggleBookmark={handleToggleBookmark}
                onUpdateUserBio={handleUpdateUserBio}
              />
            )}

            {currentView === "admin" && (
              <AdminDashboardView 
                currentUser={currentUser}
                articles={articles}
                categories={categories}
                comments={comments}
                ads={ads}
                onNavigate={navigateTo}
                onCreateArticle={handleCreateArticle}
                onUpdateArticle={handleUpdateArticle}
                onDeleteArticle={handleDeleteArticle}
                onModerateComment={handleModerateComment}
                onCreateCategory={handleCreateCategory}
                onCreateAd={handleCreateAd}
              />
            )}
          </div>
        )}
      </main>

      {/* 3. Humble Legal Footer layout */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-12 px-4 selection:bg-amber-400 selection:text-slate-900">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8 text-left text-xs text-gray-400">
          <div className="space-y-4">
            <div className="flex items-center space-x-1 font-serif text-lg font-black tracking-tight text-white italic">
              <span>CHRONICLE</span>
              <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
            </div>
            <p className="leading-relaxed">
              Chronicle News provides high-performance, distraction-free digital journalism. Our server-side models enable rapid TL;DR summaries, headlines, and metrics evaluation.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-[10px] uppercase tracking-wider">Simulated CMS Credentials</h4>
            <div className="font-mono text-[10.5px] leading-relaxed space-y-1">
              <div>&bull; Admin Account: <span className="text-gray-300">admin@chronicle.com</span></div>
              <div>&bull; Editor Account: <span className="text-gray-300">editor@chronicle.com</span></div>
              <div>&bull; Journalist Account: <span className="text-gray-300">journalist@chronicle.com</span></div>
              <div className="text-[10px] text-indigo-400 mt-2 font-sans font-bold">Use bypass selector at top to preview all roles!</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-[10px] uppercase tracking-wider">Enterprise Performance</h4>
            <p className="leading-relaxed">
              Structured to satisfy Google News metrics. Handcrafted SVG lines and zero dynamic script overlays guarantee low-weight page bundles, optimizing viewport cold-starts.
            </p>
            <div className="pt-2 text-[10px] text-gray-500 font-medium">
              &copy; {new Date().getFullYear()} Chronicle News Systems. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
