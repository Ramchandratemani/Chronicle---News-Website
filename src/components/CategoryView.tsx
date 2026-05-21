/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ArrowRight, Heart, Eye, Calendar, BookOpen, Clock,
  Filter, Search, ArrowUpDown, ChevronRight, CornerDownRight 
} from "lucide-react";
import { Article, Category } from "../types";

interface CategoryViewProps {
  category: Category;
  articles: Article[];
  onNavigate: (view: string, params?: any) => void;
}

export default function CategoryView({
  category,
  articles,
  onNavigate
}: CategoryViewProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "trending" | "oldest">("newest");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Filter single category & status
  let filtered = articles.filter(a => a.category.toLowerCase() === category.id.toLowerCase() && a.status === "Published");

  // Search filter
  if (localSearchQuery) {
    const q = localSearchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.subtitle.toLowerCase().includes(q) || 
      a.content.toLowerCase().includes(q)
    );
  }

  // Tag filter
  if (selectedTag) {
    filtered = filtered.filter(a => a.tags.includes(selectedTag));
  }

  // Extract all unique tags in this category for pills
  const allCategoryTags = Array.from(new Set(
    articles
      .filter(a => a.category === category.id && a.status === "Published")
      .flatMap(a => a.tags)
  )).slice(0, 8);

  // Sorting
  if (sortBy === "newest") {
    filtered.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  } else if (sortBy === "trending") {
    filtered.sort((a, b) => b.views - a.views);
  } else if (sortBy === "oldest") {
    filtered.sort((a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime());
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 select-none">
      
      {/* Category header details */}
      <div className="p-8 rounded-sm border border-slate-150 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6 relative text-left">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="cursor-pointer hover:underline" onClick={() => onNavigate("home")}>Chronicle Hub</span>
            <ChevronRight className="h-3 w-3" />
            <span>Category</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-slate-900 leading-none tracking-tight">
            {category.name} News
          </h1>
          <p className="text-xs text-slate-500 font-serif leading-relaxed">
            {category.description}
          </p>
        </div>
        
        {/* Floating statistics count */}
        <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 text-center shrink-0 min-w-32">
          <div className="text-3xl font-serif font-black text-slate-900">{filtered.length}</div>
          <div className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-1">Columns</div>
        </div>
      </div>

      {/* Sorting & Search Sub Filter Toolbar */}
      <div className="bg-slate-50 border border-slate-150 p-4 rounded-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Sorting options */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 bg-white border border-slate-250 border-slate-200 rounded-xs px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <ArrowUpDown className="h-3 w-3" />
            <span>Sort By:</span>
          </div>
          <button 
            onClick={() => setSortBy("newest")}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition ${sortBy === "newest" ? "bg-black text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"}`}
          >
            Newest
          </button>
          <button 
            onClick={() => setSortBy("trending")}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition ${sortBy === "trending" ? "bg-black text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"}`}
          >
            Trending
          </button>
          <button 
            onClick={() => setSortBy("oldest")}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition ${sortBy === "oldest" ? "bg-black text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"}`}
          >
            Oldest
          </button>
        </div>

        {/* Local category search */}
        <div className="relative w-full md:w-72">
          <input 
            type="text"
            placeholder={`Search within ${category.name}...`}
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-sm border border-slate-200 bg-white placeholder-slate-400 focus:outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
          />
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-405" />
        </div>

      </div>

      {/* Dynamic Sub-Tag Filter pills */}
      {allCategoryTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-left">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mr-1 flex items-center space-x-1 select-none">
            <Filter className="h-3.5 w-3.5" />
            <span>Refine tag:</span>
          </span>
          <button 
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition ${!selectedTag ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-400 hover:bg-slate-50"}`}
          >
            All tag items ({filtered.length})
          </button>
          {allCategoryTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition ${selectedTag === tag ? "bg-slate-905 bg-black text-white" : "border border-slate-200 text-slate-450 hover:bg-slate-50"}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Structured Category Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {filtered.map(art => (
          <div 
            key={art.id}
            className="flex flex-col justify-between border border-slate-100 rounded-sm overflow-hidden transition duration-150 hover:border-slate-350 bg-white select-none group"
          >
            <div className="relative aspect-video w-full bg-slate-50 overflow-hidden">
              <img src={art.featuredImage} alt={art.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-101" />
              {art.isBreaking && (
                <span className="absolute top-3 left-3 bg-red-600 text-white font-extrabold text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-xs animate-pulse">BREAKING</span>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5 text-left">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center space-x-1 leading-none select-none">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-slate-350" />
                  <span>{new Date(art.publishDate).toLocaleDateString()} &bull; {art.readingTime} min read</span>
                </span>
                
                <h3 
                  onClick={() => onNavigate("article", { slug: art.slug })}
                  className="font-serif font-bold text-slate-900 text-base line-clamp-2 hover:underline hover:text-black cursor-pointer transition leading-snug"
                >
                  {art.title}
                </h3>
                
                <p className="text-slate-500 text-xs font-serif line-clamp-2 leading-relaxed">
                  {art.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img src={art.authorAvatar} alt={art.authorName} className="h-6 w-6 rounded-sm object-cover border border-slate-150" />
                  <span className="text-[10px] font-bold text-slate-700 lowercase tracking-tight">{art.authorName.replace(/\s+/g, "").toLowerCase()}</span>
                </div>
                
                <div className="flex items-center space-x-1 text-[9px] font-bold text-slate-400 select-none">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="font-mono">{art.views}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-1 md:col-span-3 text-center py-16 border border-slate-150 rounded-sm bg-slate-50 py-12 max-w-xl mx-auto space-y-3">
            <Filter className="h-6 w-6 mx-auto text-slate-350" />
            <h4 className="font-serif font-bold text-slate-800 text-md">No Columns Found</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-serif max-w-xs">No standard articles currently mapped to this classification. Reset filters, clear search parameters, or create items in Admin Portal.</p>
            <button 
              onClick={() => {
                setLocalSearchQuery("");
                setSelectedTag(null);
              }}
              className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-800 font-bold text-xs uppercase tracking-wider rounded-sm transition cursor-pointer bg-slate-50"
            >
              Clear refinement settings
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
