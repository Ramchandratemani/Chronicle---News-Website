/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Bookmark, Share2, Sparkles, MessageSquare, 
  Send, Eye, Heart, List, HelpCircle, ChevronRight, Check, AlertTriangle
} from "lucide-react";
import { Article, Comment, User, AdBanner } from "../types";

interface ArticleDetailViewProps {
  article: Article;
  relatedArticles: Article[];
  comments: Comment[];
  currentUser: User | null;
  onNavigate: (view: string, params?: any) => void;
  onPostComment: (content: string) => Promise<boolean>;
  onToggleBookmark: (slug: string) => void;
  isBookmarked: boolean;
  activeAd?: AdBanner;
  onTrackAd: (id: string, action: "view" | "click") => void;
}

export default function ArticleDetailView({
  article,
  relatedArticles,
  comments,
  currentUser,
  onNavigate,
  onPostComment,
  onToggleBookmark,
  isBookmarked,
  activeAd,
  onTrackAd
}: ArticleDetailViewProps) {
  const [copied, setCopied] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiIsMockFallback, setAiIsMockFallback] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likes);

  // Parse Table of Contents dynamically from markdown headers
  const getTableOfContents = (content: string) => {
    const lines = content.split("\n");
    const headers: { text: string; id: string; level: number }[] = [];
    lines.forEach(line => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[#*`>]/g, "").trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        headers.push({ text, id, level });
      }
    });
    return headers;
  };

  const toc = getTableOfContents(article.content);

  // Ad triggers
  useEffect(() => {
    if (activeAd) {
      onTrackAd(activeAd.id, "view");
    }
  }, [activeAd]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLikeToggle = () => {
    if (liked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    setLiked(!liked);
  };

  // Call our Express endpoint utilizing Gemini
  const fetchAiSummary = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/gemini/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: article.content })
      });
      const data = await res.json();
      setAiSummary(data.summary);
      setAiIsMockFallback(!!data.isFallback);
    } catch (e) {
      console.error(e);
      setAiSummary("• Local Error: Failed to resolve the AI summary pipeline.\n• Setup: Ensure you verify Gemini API secrets in the dashboard panel.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const success = await onPostComment(newCommentText);
    if (success) {
      setNewCommentText("");
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3000);
    }
  };

  // Custom high-performance markdown structured text formatter
  const renderFormattedMarkdown = (text: string) => {
    const blocks = text.split("\n\n");
    return blocks.map((block, idx) => {
      const trimmed = block.trim();
      
      // H1 Header check
      if (trimmed.startsWith("# ")) {
        const content = trimmed.substring(2);
        const id = content.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return (
          <h2 key={idx} id={id} className="font-serif text-2xl md:text-3xl font-extrabold text-slate-900 mt-8 mb-4 tracking-tight leading-snug scroll-mt-20">
            {content}
          </h2>
        );
      }

      // H2 Header check
      if (trimmed.startsWith("## ")) {
        const content = trimmed.substring(3);
        const id = content.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return (
          <h3 key={idx} id={id} className="font-serif text-xl md:text-2xl font-bold text-slate-800 mt-6 mb-3 tracking-tight scroll-mt-20">
            {content}
          </h3>
        );
      }

      // H3 Header check
      if (trimmed.startsWith("### ")) {
        const content = trimmed.substring(4);
        const id = content.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return (
          <h4 key={idx} id={id} className="font-sans text-lg font-bold text-slate-800 mt-5 mb-2.5 scroll-mt-20">
            {content}
          </h4>
        );
      }

      // Blockquotes check
      if (trimmed.startsWith("> ")) {
        const content = trimmed.replace(/^>\s*/gm, "");
        return (
          <blockquote key={idx} className="border-l-4 border-amber-500 bg-slate-50 rounded-r-lg px-5 py-4 my-6 font-serif italic text-slate-700 text-sm md:text-base leading-relaxed leading-normal">
            {content}
          </blockquote>
        );
      }

          {/* List blocks check */}
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const items = trimmed.split(/\n[-*]\s+/);
        return (
          <ul key={idx} className="list-disc pl-6 space-y-2 text-slate-700 leading-relaxed text-sm md:text-base my-4 text-left font-serif">
            {items.map((item, itemIdx) => (
              <li key={itemIdx}>{item.replace(/^[-*]\s+/, "")}</li>
            ))}
          </ul>
        );
      }

      // Monospace block quotes check
      if (trimmed.startsWith("```")) {
        const rawCode = trimmed.replace(/```[a-z]*\n?/g, "").trim();
        return (
          <pre key={idx} className="bg-slate-950 text-emerald-400 p-4 rounded-sm font-mono text-xs overflow-x-auto leading-relaxed my-5">
            <code>{rawCode}</code>
          </pre>
        );
      }

      // Standard paragraphs with bold parsing support
      return (
        <p key={idx} className="font-serif text-slate-800 text-sm md:text-base leading-relaxed mb-4 text-left">
          {trimmed.split("**").map((section, sectionIdx) => (
            sectionIdx % 2 === 1 ? <strong key={sectionIdx} className="font-sans font-extrabold text-slate-950">{section}</strong> : section
          ))}
        </p>
      );
    });
  };

  // Filter approved comments
  const approvedComments = comments.filter(c => c.status === "Approved" && c.articleId === article.id);

  return (
    <article className="pb-24 bg-white">
      
      {/* Header Breadcrumbs Bar */}
      <div className="bg-slate-50 border-b border-slate-100 py-3 px-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <button 
            onClick={() => onNavigate("home")}
            className="flex items-center space-x-1.5 hover:text-black transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to columns</span>
          </button>
          
          <div className="flex items-center space-x-1 font-sans">
            <span className="hover:underline cursor-pointer text-slate-500" onClick={() => onNavigate("home")}>Chronicle</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="hover:underline cursor-pointer font-bold text-slate-650" onClick={() => onNavigate("category", { id: article.category })}>{article.category}</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-800 truncate max-w-[120px] md:max-w-xs">{article.title}</span>
          </div>
        </div>
      </div>

      {/* Hero Header Canvas: Center Aligned */}
      <div className="mx-auto max-w-4xl px-6 pt-10 text-center space-y-6">
        <div className="inline-flex items-center space-x-2">
          {article.isBreaking && (
            <span className="bg-red-600 text-white font-extrabold uppercase px-2 py-0.5 text-[8px] tracking-widest rounded-xs select-none">
              BREAKING
            </span>
          )}
          <span className="bg-black text-white font-extrabold uppercase px-2 py-0.5 text-[8px] tracking-widest rounded-xs select-none">
            {article.category.toUpperCase()}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {article.readingTime} Min read depth
          </span>
        </div>

        <h1 className="font-serif text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
          {article.title}
        </h1>

        <p className="text-slate-650 text-sm md:text-lg max-w-2xl mx-auto font-serif leading-relaxed">
          {article.subtitle}
        </p>

        {/* Reporter Meta & Interactivity Row */}
        <div className="pt-4 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-y border-slate-100 max-w-4xl mx-auto">
          
          {/* Reporter details */}
          <div className="flex items-center space-x-3 text-left">
            <img 
              src={article.authorAvatar} 
              alt={article.authorName} 
              className="h-9 w-9 rounded-sm object-cover border border-slate-200"
            />
            <div className="leading-tight">
              <span className="block text-xs font-bold text-slate-850 lowercase tracking-tight">{article.authorName.replace(/\s+/g, "").toLowerCase()}</span>
              <span className="text-[9px] text-slate-400 font-medium">Journalist Staff &bull; {new Date(article.publishDate).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Share/Bookmark toolbar */}
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <button 
              onClick={handleLikeToggle}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-sm border cursor-pointer transition ${liked ? "bg-red-50 text-red-650 border-red-200" : "bg-white border-slate-200 hover:text-black hover:border-slate-300"}`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked && "fill-current"}`} />
              <span>{likeCount}</span>
            </button>

            <button 
              onClick={() => onToggleBookmark(article.slug)}
              className={`p-2 rounded-sm border cursor-pointer transition ${isBookmarked ? "bg-slate-100 text-black border-slate-300" : "bg-white border-slate-200 hover:text-black hover:border-slate-300"}`}
              title={isBookmarked ? "Remove bookmark" : "Add to reading list"}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isBookmarked && "fill-current"}`} />
            </button>

            <button 
              onClick={handleCopyLink}
              className="p-2 rounded-sm border border-slate-200 bg-white hover:text-black hover:border-slate-300 cursor-pointer transition relative"
              title="Copy link to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied && (
                <span className="absolute -top-8 right-1/2 translate-x-1/2 bg-slate-950 text-white text-[8px] px-2 py-0.5 rounded-xs tracking-wider uppercase">
                  Copied
                </span>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Main Wide Featured Banner Image */}
      <div className="mx-auto max-w-5xl px-6 mt-8">
        <div className="rounded-sm overflow-hidden aspect-video max-h-[420px] bg-slate-50 border border-slate-100">
          <img 
            src={article.featuredImage} 
            alt={article.title} 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Core Reading Area: Double column with dynamic Table of Contents and Gemini Summarizer */}
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-4 gap-12 mt-12">
        
        {/* Sidebar panels: TOC (sticky) */}
        <div className="lg:col-span-1 hidden lg:block space-y-8 animate-fade-in">
          
          {toc.length > 0 && (
            <div className="sticky top-28 border border-slate-150 rounded-sm p-6 bg-slate-50 space-y-4 text-left select-none">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] pb-2 border-b border-black text-slate-900 font-sans">
                In this Column
              </h4>
              <nav className="space-y-2.5">
                {toc.map((header, idx) => (
                  <a 
                    key={idx}
                    href={`#${header.id}`}
                    className={`block text-xs font-semibold hover:underline hover:text-black transition truncate ${header.level === 3 ? "pl-3 text-slate-400 font-medium" : "text-slate-600"}`}
                  >
                    {header.text}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* Advertisement banner Sidebar */}
          {activeAd && activeAd.placement === "sidebar" && (
            <div className="border border-slate-150 rounded-sm p-4 bg-white space-y-3 sticky top-[300px]">
              <span className="text-[8px] uppercase font-bold tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-xs">ADVERTISEMENT</span>
              <a 
                href={activeAd.linkUrl} 
                target="_blank" 
                rel="noreferrer"
                onClick={() => onTrackAd(activeAd.id, "click")}
                className="block space-y-2 text-left"
              >
                <img 
                  src={activeAd.imageUrl} 
                  alt={activeAd.name} 
                  className="w-full h-28 object-cover rounded-sm"
                />
                <h5 className="font-bold text-xs text-slate-900 leading-tight hover:underline">{activeAd.name}</h5>
                <span className="text-[10px] font-bold text-blue-600 hover:underline inline-block">&rarr; Learn More</span>
              </a>
            </div>
          )}

        </div>

        {/* Content & AI Summarizer Panel */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Gemini AI Summarizer Widget */}
          <div className="bg-slate-900 rounded-sm p-6 text-white border border-slate-800 space-y-4 shadow-none">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-indigo-400 fill-indigo-400 animate-pulse" />
                <div className="text-left leading-tight">
                  <span className="block text-[8px] font-bold text-amber-400 uppercase tracking-widest">AI INTELLIGENCE</span>
                  <h4 className="font-serif text-sm font-bold text-white">Gemini Editorial Summarizer</h4>
                </div>
              </div>
              <button 
                onClick={fetchAiSummary}
                disabled={aiLoading}
                className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-xs transition cursor-pointer"
              >
                {aiLoading ? "Synthesizing..." : aiSummary ? "Re-Generate" : "Generate Summary"}
              </button>
            </div>

            {aiLoading ? (
              <div className="py-4 space-y-3">
                <div className="flex items-center space-x-2 text-slate-400 text-xs text-left animate-pulse">
                  <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" />
                  <span>Parsing structural article graphs...</span>
                </div>
                <div className="h-3 bg-slate-800 rounded w-5/6 animate-pulse" />
                <div className="h-3 bg-slate-800 rounded w-4/5 animate-pulse" />
                <div className="h-3 bg-slate-800 rounded w-3/4 animate-pulse" />
              </div>
            ) : aiSummary ? (
              <div className="space-y-4 text-left">
                <div className="text-xs text-slate-300 font-serif leading-relaxed whitespace-pre-line bg-slate-950 p-4 rounded-xs border border-slate-850">
                  {aiSummary}
                </div>
                {aiIsMockFallback && (
                  <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-600/30 text-amber-400 rounded-xs p-2.5 text-[9px] leading-relaxed select-none">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span>Operating in localized schema mode. Provide a <strong>GEMINI_API_KEY</strong> inside <strong>Secrets</strong> panel to access live Gemini generations!</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-350 font-serif leading-relaxed text-left">
                Tired of the scroll loop? Trigger the Gemini summary card to extract crucial findings, core statistics, and micro-bullet insights instantly from our database of articles.
              </p>
            )}
          </div>

          {/* Formatted Article Body details */}
          <div className="prose max-w-full leading-relaxed mx-auto">
            {renderFormattedMarkdown(article.content)}
          </div>

          {/* Social share widget and Tags */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-2 text-left">
            {article.tags.map(tag => (
              <span 
                key={tag}
                onClick={() => onNavigate("home", { search: tag })}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-xs cursor-pointer transition select-none"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Immersive Comments Section */}
          <section className="pt-10 border-t border-slate-100 text-left">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] pb-2 border-b border-black text-slate-900 font-sans">
              Commentary Feed ({approvedComments.length})
            </h4>

            {/* Posting input */}
            <form onSubmit={handleCommentSubmit} className="mt-6 border border-slate-150 rounded-sm p-5 bg-slate-50 space-y-4">
              <div className="flex items-center justify-between font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                <span>Add an insight</span>
                {currentUser ? (
                  <div className="flex items-center space-x-1.5">
                    <span>Acting as</span>
                    <span className="font-bold text-slate-800 lowercase tracking-tight">{currentUser.name.replace(/\s+/g, "").toLowerCase()} ({currentUser.role})</span>
                  </div>
                ) : (
                  <span className="text-amber-600 font-bold tracking-widest uppercase">Use persona switch to command commentary control</span>
                )}
              </div>

              <div className="relative">
                <textarea 
                  rows={3}
                  placeholder={currentUser ? "Write a highly professional insight or question on this piece..." : "Please log in/simulate a role to comment."}
                  disabled={!currentUser}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full text-xs text-slate-800 p-3 bg-white border border-slate-200 rounded-xs outline-hidden focus:border-slate-450 focus:ring-1 focus:ring-slate-450 placeholder-slate-400 disabled:opacity-50"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400 max-w-xs leading-normal">All comments default to pending state, vetted under CMS moderator supervision to prevent spam vectors.</span>
                <button
                  type="submit"
                  disabled={!currentUser || !newCommentText.trim()}
                  className="px-4 py-2 bg-black hover:bg-slate-850 text-white font-bold text-xs rounded-xs flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50 uppercase tracking-widest shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Transmit Insight</span>
                </button>
              </div>
            </form>

            {commentSuccess && (
              <div className="mt-3 bg-emerald-50 border border-emerald-205 border-emerald-200 text-emerald-800 p-2.5 rounded-sm text-xs font-semibold flex items-center space-x-1 animate-fade-in">
                <span>✓ Commentary post transmitted successfully. It has been queued inside the Moderation Pipeline for review!</span>
              </div>
            )}

            {/* Comments Lists Feed */}
            <div className="mt-8 space-y-4">
              {approvedComments.map(c => (
                <div key={c.id} className="flex gap-4 items-start select-none group/comment">
                  <img 
                    src={c.userAvatar} 
                    alt={c.userName} 
                    className="h-8 w-8 rounded-sm object-cover border border-slate-200 shrink-0"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-baseline justify-between gap-2 uppercase font-bold text-[9px] tracking-wider text-slate-400">
                      <span className="text-slate-850 lowercase text-xs tracking-normal">{c.userName.replace(/\s+/g, "").toLowerCase()}</span>
                      <span>{new Date(c.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white border border-slate-100 p-3.5 rounded-sm font-serif">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}

              {approvedComments.length === 0 && (
                <p className="text-center py-6 text-xs text-slate-400 italic font-serif bg-slate-50 border border-slate-100 rounded-sm">No published commentary found on this dispatch. Be the first to start the dialog!</p>
              )}
            </div>

          </section>

        </div>

      </div>

      {/* Related dispatch entries */}
      {relatedArticles.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 border-t border-slate-100 pt-16 mt-16 text-left">
          <h3 className="font-serif text-lg font-bold text-slate-900 pb-2 border-b border-slate-150 mb-8">Related Column Dispatches</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map(art => (
              <div 
                key={art.id}
                onClick={() => onNavigate("article", { slug: art.slug })}
                className="group cursor-pointer space-y-3 bg-white border border-slate-100 rounded-sm p-4 hover:border-slate-350 transition"
              >
                <div className="aspect-video w-full rounded-sm overflow-hidden bg-slate-50 border border-slate-100">
                  <img src={art.featuredImage} alt={art.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[8px] uppercase font-bold tracking-widest text-slate-450">[{art.category}]</span>
                  <h4 className="font-serif font-bold text-sm text-slate-900 leading-snug group-hover:underline transition line-clamp-1">
                    {art.title}
                  </h4>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">{art.readingTime} min read</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </article>
  );
}
