
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Image as ImageIcon, Download, Sparkles, Loader2, Copy, Zap, FileText, PenLine, Send, Maximize2, RotateCw, X, ChevronLeft, Check, ChevronDown, ChevronUp, ZoomIn, ZoomOut, Settings2 } from 'lucide-react';
import { ParsedPoster, AdvancedSettings, GenerationConfig, ManualProductInfo } from '../types';
import { generatePosterImage } from '../services/geminiService';

interface GenerationViewProps {
  markdown: string;
  apiKey: string;
  settings: AdvancedSettings;
  config: GenerationConfig;
  images: string[];
  manualInfo?: ManualProductInfo; 
  onBack: () => void;
  parsedPosters: ParsedPoster[];
  setParsedPosters: React.Dispatch<React.SetStateAction<ParsedPoster[]>>;
}

export const GenerationView: React.FC<GenerationViewProps> = ({ 
    markdown, 
    apiKey, 
    settings, 
    config, 
    images, 
    manualInfo,
    parsedPosters,
    setParsedPosters,
}) => {
  const [generatingIds, setGeneratingIds] = useState<Set<number>>(new Set());
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [selectedPosterIds, setSelectedPosterIds] = useState<Set<number>>(new Set());

  // Card UI State
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [modificationInputs, setModificationInputs] = useState<Record<number, string>>({});
  
  // Reference Selector State
  const [activeRefSelector, setActiveRefSelector] = useState<number | null>(null);

  // Fullscreen Viewer State
  const [fullscreenPosterId, setFullscreenPosterId] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Keyboard Navigation for Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (fullscreenPosterId === null) return;
        if (e.key === 'Escape') closeFullscreen();
        if (e.key === 'ArrowLeft') navigateImage('prev');
        if (e.key === 'ArrowRight') navigateImage('next');
        if (e.key === '+' || e.key === '=') setZoomLevel(z => Math.min(3, z + 0.25));
        if (e.key === '-') setZoomLevel(z => Math.max(0.5, z - 0.25));
        if (e.key === '0') setZoomLevel(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenPosterId, parsedPosters]);

  const toggleExpand = (id: number) => {
    setExpandedCards(prev => ({...prev, [id]: !prev[id]}));
  };

  const toggleSelection = (id: number) => {
    setSelectedPosterIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        return next;
    });
  };

  const toggleRefIndex = (posterId: number, imgIndex: number) => {
      setParsedPosters(prev => prev.map(p => {
          if (p.id !== posterId) return p;
          const currentIndices = p.referenceImageIndices || [0];
          let newIndices;
          if (currentIndices.includes(imgIndex)) {
              newIndices = currentIndices.filter(i => i !== imgIndex);
          } else {
              newIndices = [...currentIndices, imgIndex].sort((a,b) => a - b);
          }
          return { ...p, referenceImageIndices: newIndices };
      }));
  };

  const handleModificationSubmit = (id: number) => {
     const input = modificationInputs[id];
     if (!input || !input.trim()) return;

     const currentPoster = parsedPosters.find(p => p.id === id);
     if (!currentPoster) return;
     
     // 1. Update the prompt logic: append new input
     const updatedPrompt = `${currentPoster.englishPrompt}, ${input}`;
     const updatedPoster = { ...currentPoster, englishPrompt: updatedPrompt };

     // 2. Update state locally
     setParsedPosters(prev => prev.map(p => p.id === id ? updatedPoster : p));
     setModificationInputs(prev => ({...prev, [id]: ''}));

     // 3. Trigger generation immediately with the updated poster object
     handleGenerateImage(updatedPoster);
  };

  const generateSingleImage = async (poster: ParsedPoster) => {
      if (!poster.englishPrompt) return;
      
      setGeneratingIds(prev => new Set(prev).add(poster.id));
      try {
        // --- SMART MULTI-REFERENCE IMAGE SELECTION ---
        // Collect all images based on indices
        const indices = poster.referenceImageIndices && poster.referenceImageIndices.length > 0 
            ? poster.referenceImageIndices 
            : [0];
            
        const refImages: string[] = [];
        indices.forEach(idx => {
            const safeIdx = Math.min(Math.max(0, idx), images.length - 1);
            if (images[safeIdx]) refImages.push(images[safeIdx]);
        });
        
        // Fallback
        if (refImages.length === 0 && images.length > 0) {
            refImages.push(images[0]);
        }

        // --- DYNAMIC PROMPT ADJUSTMENT (Bug Fix) ---
        // The prompt refers to [Image X] based on original indices.
        // We must map these to [IMAGE 1], [IMAGE 2]... based on the selected subset (refImages).
        let adjustedPrompt = poster.englishPrompt;
        adjustedPrompt = adjustedPrompt.replace(/\[Image\s*(\d+)\]/gi, (match, capturedDigit) => {
            const originalIdx = parseInt(capturedDigit, 10);
            const newPos = indices.indexOf(originalIdx);
            // Map to 1-based index (Gemini Vision usually expects [IMAGE 1], [IMAGE 2] for the provided parts)
            // If the original index isn't in our selection, default to [IMAGE 1] to ensure we use *some* asset.
            const mappedIndex = newPos !== -1 ? newPos + 1 : 1;
            return `[IMAGE ${mappedIndex}]`;
        });

        // Determine if model consistency is active and image exists
        const modelRef = manualInfo?.isModelConsistent ? manualInfo?.modelRefImage : null;

        const base64Image = await generatePosterImage(
            apiKey, 
            adjustedPrompt, // Use adjusted prompt
            settings, 
            config.aspectRatio,
            refImages, 
            manualInfo?.logoBase64,
            modelRef
        );

        setParsedPosters(prev => prev.map(p => 
            p.id === poster.id ? { ...p, generatedImage: base64Image } : p
        ));
      } catch (error) {
         console.error(`Generation failed for ${poster.id}`, error);
      } finally {
        setGeneratingIds(prev => {
            const next = new Set(prev);
            next.delete(poster.id);
            return next;
        });
      }
  };

  const handleGenerateImage = (poster: ParsedPoster) => {
    generateSingleImage(poster).catch(() => alert("生成失败，请重试"));
  };

  const handleGenerateAll = async () => {
    // If specific cards are selected, only generate those
    let targets = parsedPosters.filter(p => !generatingIds.has(p.id));
    
    // If selection exists, filter by selection, otherwise filter by "not generated yet"
    if (selectedPosterIds.size > 0) {
        targets = targets.filter(p => selectedPosterIds.has(p.id));
    } else {
        targets = targets.filter(p => !p.generatedImage);
    }

    if (targets.length === 0) {
        // If nothing selected and all generated, ask to regen all
        const confirmRegen = confirm("是否重新生成所有海报？这将消耗较多时间。");
        if (!confirmRegen) return;
        targets = parsedPosters;
    }

    setIsGeneratingAll(true);
    for (const poster of targets) {
        await generateSingleImage(poster);
    }
    setIsGeneratingAll(false);
  };

  const handleDownloadImage = (base64: string, title: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `${title.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    const generatedPosters = parsedPosters.filter(p => p.generatedImage);
    if (generatedPosters.length === 0) return;

    for (const poster of generatedPosters) {
        if (poster.generatedImage) {
            const link = document.createElement('a');
            link.href = poster.generatedImage;
            link.download = `${String(poster.id + 1).padStart(2, '0')}_${poster.title.replace(/[\\/:*?"<>|]/g, '_')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // Small delay to prevent browser from blocking multiple downloads
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
  };

  // --- Fullscreen Logic ---
  const openFullscreen = (id: number) => {
      setFullscreenPosterId(id);
      setZoomLevel(1);
      document.body.style.overflow = 'hidden'; 
  };

  const closeFullscreen = () => {
      setFullscreenPosterId(null);
      setZoomLevel(1);
      document.body.style.overflow = '';
  };

  const navigateImage = (direction: 'prev' | 'next') => {
      if (fullscreenPosterId === null) return;
      const generatedPosters = parsedPosters.filter(p => p.generatedImage);
      if (generatedPosters.length === 0) return;

      const currentIndex = generatedPosters.findIndex(p => p.id === fullscreenPosterId);
      if (currentIndex === -1) return;

      let newIndex;
      if (direction === 'prev') {
          newIndex = currentIndex > 0 ? currentIndex - 1 : generatedPosters.length - 1; 
      } else {
          newIndex = currentIndex < generatedPosters.length - 1 ? currentIndex + 1 : 0; 
      }

      setFullscreenPosterId(generatedPosters[newIndex].id);
      setZoomLevel(1); 
  };

  const viewingPoster = parsedPosters.find(p => p.id === fullscreenPosterId);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 sticky top-0 z-30 backdrop-blur-md bg-white/90 dark:bg-slate-800/90 transition-colors">
         <div className="flex items-center gap-4">
             <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <ImageIcon className="w-4 h-4" />
                </div>
                <span>KV 视觉系统生成结果 ({parsedPosters.length})</span>
             </h2>
             {selectedPosterIds.size > 0 && (
                 <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-1 rounded-md">
                     已选 {selectedPosterIds.size} 张
                 </span>
             )}
         </div>

         <div className="flex items-center gap-3">
             <button 
                onClick={handleDownloadAll}
                disabled={!parsedPosters.some(p => p.generatedImage)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-200 dark:hover:border-indigo-500 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Download className="w-4 h-4" />
                <span>全部下载</span>
             </button>

            <button 
                onClick={handleGenerateAll}
                disabled={isGeneratingAll}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all
                    ${isGeneratingAll 
                        ? 'bg-slate-800 text-white cursor-not-allowed shadow-none opacity-80' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300 dark:shadow-none'
                    }`}
            >
                {isGeneratingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                <span>{isGeneratingAll ? "正在批量生成..." : selectedPosterIds.size > 0 ? "生成选中项" : "一键生成全部"}</span>
            </button>
         </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {parsedPosters.length === 0 ? (
           <div className="col-span-full h-96 flex flex-col items-center justify-center text-slate-400 bg-white/50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-400" />
              <p className="text-sm font-medium">正在解析 AI 方案...</p>
           </div>
        ) : (
            parsedPosters.map((poster) => {
              // Calculate valid ref indices for display
              const indices = poster.referenceImageIndices && poster.referenceImageIndices.length > 0
                  ? poster.referenceImageIndices 
                  : [0];

              return (
              <div key={poster.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-3.5 shadow-sm border transition-all duration-300 group flex flex-col ${selectedPosterIds.has(poster.id) ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-indigo-100 dark:shadow-none' : 'border-slate-100 dark:border-slate-700 hover:shadow-xl hover:dark:border-slate-600'}`}>
                  
                  {/* Card Header - Improved Alignment */}
                  <div className="flex justify-between items-center mb-2.5 px-1 shrink-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 italic font-mono shrink-0">
                            {String(poster.id + 1).padStart(2, '0')}
                          </span>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-none pt-0.5 truncate">
                              {poster.title}
                          </h3>
                      </div>
                      <button 
                          onClick={() => toggleSelection(poster.id)}
                          className={`w-5 h-5 rounded-md border transition-all shrink-0 flex items-center justify-center ${selectedPosterIds.has(poster.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'}`}
                      >
                          {selectedPosterIds.has(poster.id) && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                  </div>

                  {/* Visual Content Area - Tighter Spacing & Cleaner Look */}
                  <div className={`rounded-xl p-1.5 relative flex flex-col transition-all ${poster.generatedImage ? 'bg-transparent' : 'bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700'}`}>
                      
                      {poster.generatedImage ? (
                          // STATE: GENERATED - Natural Aspect Ratio & No Border/Background
                          <div className="relative w-full rounded-lg overflow-hidden group/image bg-slate-100 dark:bg-slate-800">
                              <img 
                                src={poster.generatedImage} 
                                alt={poster.title} 
                                className="w-full h-auto block object-cover transition-transform duration-700 group-hover/image:scale-105"
                              />
                              
                              {/* Overlay & Buttons - Centered, Large, Semi-transparent Black Bg */}
                              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/image:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px] z-10">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); openFullscreen(poster.id); }} 
                                    className="p-3 bg-white/10 hover:bg-white text-white hover:text-indigo-600 rounded-full backdrop-blur-md transition-all duration-300 transform hover:scale-110 shadow-lg border border-white/20 group/btn"
                                    title="全屏查看"
                                  >
                                    <Maximize2 className="w-6 h-6"/>
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDownloadImage(poster.generatedImage!, poster.title); }} 
                                    className="p-3 bg-white/10 hover:bg-white text-white hover:text-indigo-600 rounded-full backdrop-blur-md transition-all duration-300 transform hover:scale-110 shadow-lg border border-white/20 group/btn"
                                    title="下载图片"
                                  >
                                    <Download className="w-6 h-6"/>
                                  </button>
                              </div>
                              
                              {/* Loading Overlay if regenerating this specific card while it has an image */}
                              {generatingIds.has(poster.id) && (
                                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center">
                                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                  </div>
                              )}
                          </div>
                      ) : (
                          // STATE: CREATIVE DESCRIPTION (Placeholder) - Fixed Height 220px
                          <div className="h-[220px] flex flex-col items-center justify-center text-center px-4 py-2">
                              <div className="flex flex-col items-center justify-center shrink-0 mb-3">
                                  <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-1.5 shadow-sm ring-2 ring-white dark:ring-indigo-900">
                                      <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                  </div>
                                  <div className="text-[10px] font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-widest">AI 创意构思</div>
                              </div>
                              
                              {/* Description Box - Fill remaining height */}
                              <div className="w-full flex-1 overflow-hidden flex items-start justify-center">
                                   <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed text-justify line-clamp-[6] opacity-90">
                                       {poster.chineseDescription || "正在生成创意描述..."}
                                   </p>
                              </div>
                          </div>
                      )}

                      {/* Main Render Button - Only shown if no image exists */}
                      {!poster.generatedImage && (
                          <div className="mt-2 pt-0 shrink-0">
                               <button 
                                  onClick={() => handleGenerateImage(poster)}
                                  disabled={generatingIds.has(poster.id)}
                                  className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all
                                    ${generatingIds.has(poster.id) 
                                        ? 'bg-slate-800 text-white cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300 hover:brightness-110'
                                    }
                                  `}
                               >
                                  {generatingIds.has(poster.id) ? (
                                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 正在渲染...</>
                                  ) : (
                                      <><Zap className="w-3.5 h-3.5 fill-white" /> 立即渲染图像</>
                                  )}
                               </button>
                          </div>
                      )}
                  </div>

                  {/* Edit & Settings Section */}
                  <div className="mt-3 space-y-2.5 px-1 shrink-0 border-t border-slate-100 dark:border-slate-700 pt-3 relative">
                      
                      {/* Reference Image Selector (Popup) */}
                      {activeRefSelector === poster.id && (
                          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-600 p-3 z-50 animate-in slide-in-from-bottom-2 duration-200">
                               <div className="flex justify-between items-center mb-2">
                                   <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">选择参考底图</h4>
                                   <button onClick={() => setActiveRefSelector(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-3.5 h-3.5 text-slate-500" /></button>
                               </div>
                               <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar p-1">
                                    {images.map((img, idx) => {
                                        const isSelected = indices.includes(idx);
                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => toggleRefIndex(poster.id, idx)}
                                                className={`relative aspect-square rounded-lg border-2 cursor-pointer overflow-hidden group ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300'}`}
                                            >
                                                <img src={img} className="w-full h-full object-cover" alt={`ref-${idx}`} />
                                                <div className="absolute top-0.5 left-0.5 bg-black/60 text-white text-[9px] px-1 rounded backdrop-blur-sm font-mono">{idx + 1}</div>
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                                                        <div className="bg-indigo-500 rounded-full p-0.5"><Check className="w-3 h-3 text-white" /></div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                               </div>
                               <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-400 text-center">
                                   点击图片切换/多选，完成后点击“重新生成”
                               </div>
                          </div>
                      )}

                      {/* Edit Header & Regenerate */}
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              <PenLine className="w-3.5 h-3.5" />
                              <span>编辑修改建议</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                                {/* Reference Image Indicators (Clickable) */}
                                <button 
                                    onClick={() => setActiveRefSelector(activeRefSelector === poster.id ? null : poster.id)}
                                    className="flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-700 p-1 rounded-lg transition-colors group/ref"
                                    title="点击调整参考图"
                                >
                                    <div className="flex -space-x-1.5">
                                        {indices.map(idx => {
                                            const safeIdx = Math.min(Math.max(0, idx), images.length - 1);
                                            const imgSrc = images[safeIdx];
                                            if (!imgSrc) return null;
                                            return (
                                                <div key={idx} className="w-5 h-5 rounded-full border border-white dark:border-slate-700 overflow-hidden relative z-0 group-hover/ref:z-10 transition-all">
                                                    <img src={imgSrc} alt="ref" className="w-full h-full object-cover" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <Settings2 className="w-3 h-3 text-slate-400 group-hover/ref:text-indigo-500" />
                                </button>

                                {/* Regenerate / Reroll Button (Only if image exists) */}
                                {poster.generatedImage && (
                                    <button 
                                        onClick={() => handleGenerateImage(poster)}
                                        disabled={generatingIds.has(poster.id)}
                                        className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-indigo-200 dark:hover:border-indigo-500 px-2 py-1 rounded-md shadow-sm"
                                    >
                                        <RotateCw className={`w-3 h-3 ${generatingIds.has(poster.id) ? 'animate-spin' : ''}`} />
                                        <span>{generatingIds.has(poster.id) ? "生成中" : "重新生成"}</span>
                                    </button>
                                )}
                          </div>
                      </div>

                      {/* Modification Input */}
                      <div className="relative group/input">
                          <textarea 
                              placeholder="输入修改建议，如：光线更暖一些..."
                              value={modificationInputs[poster.id] || ''}
                              onChange={(e) => setModificationInputs(prev => ({...prev, [poster.id]: e.target.value}))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleModificationSubmit(poster.id);
                                }
                              }}
                              className="w-full h-14 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg py-2 pl-3 pr-10 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 dark:text-slate-200 resize-none leading-relaxed"
                          />
                          <button 
                            onClick={() => handleModificationSubmit(poster.id)}
                            disabled={!modificationInputs[poster.id]}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              <Send className="w-3.5 h-3.5" />
                          </button>
                      </div>

                      {/* Collapsible Prompt Params */}
                      <div className={`border rounded-lg overflow-hidden transition-all ${expandedCards[poster.id] ? 'border-indigo-100 dark:border-indigo-900 ring-1 ring-indigo-50 dark:ring-indigo-900/30' : 'border-slate-100 dark:border-slate-700'}`}>
                          <button 
                              onClick={() => toggleExpand(poster.id)}
                              className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                          >
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>提示词工程参数</span>
                              </div>
                              {expandedCards[poster.id] ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                          </button>
                          
                          {expandedCards[poster.id] && (
                              <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 text-[10px] space-y-4 animate-in slide-in-from-top-1 duration-200 max-h-[220px] overflow-y-auto custom-scrollbar">
                                  
                                  {/* 1. Chinese Description */}
                                  <div>
                                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5 flex items-center gap-1.5">
                                          <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
                                          创意描述 (Chinese)
                                      </span>
                                      <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
                                          {poster.chineseDescription || "暂无描述"}
                                      </div>
                                  </div>

                                  {/* 2. Layout Strategy */}
                                  {poster.layoutStrategy && (
                                    <div>
                                         <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5 flex items-center gap-1.5">
                                            <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
                                            排版策略 (Layout)
                                         </span>
                                         <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-justify whitespace-pre-wrap">
                                             {poster.layoutStrategy}
                                         </div>
                                    </div>
                                  )}

                                  {/* 3. Prompt (English) */}
                                  <div>
                                      <div className="flex justify-between items-center mb-1.5">
                                         <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                            <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
                                            Prompt (English)
                                         </span>
                                         <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(poster.englishPrompt);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1"
                                         >
                                             <Copy className="w-3 h-3"/> <span className="font-bold">复制</span>
                                         </button>
                                      </div>
                                      <textarea 
                                          value={poster.englishPrompt}
                                          onChange={(e) => setParsedPosters(prev => prev.map(p => p.id === poster.id ? {...p, englishPrompt: e.target.value} : p))}
                                          className="w-full h-24 bg-slate-50 dark:bg-slate-900 border-transparent rounded-lg p-2 text-slate-600 dark:text-slate-400 font-mono resize-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none leading-relaxed text-[10px] transition-all"
                                      />
                                  </div>
                                  
                                  {/* 4. Negative Prompt */}
                                  {poster.negativePrompt && (
                                    <div>
                                         <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5 flex items-center gap-1.5">
                                            <span className="w-1 h-3 bg-red-400 rounded-full"></span>
                                            Negative Prompt
                                         </span>
                                         <div className="text-slate-500 dark:text-slate-500 font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                                             {poster.negativePrompt}
                                         </div>
                                    </div>
                                  )}
                              </div>
                          )}
                      </div>
                  </div>

              </div>
              );
            })
        )}
      </div>

      {/* Fullscreen Modal */}
      {fullscreenPosterId !== null && viewingPoster && viewingPoster.generatedImage && createPortal(
         <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
             {/* Toolbar */}
             <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent h-24 pointer-events-none">
                 <div className="text-white pointer-events-auto">
                     <h3 className="text-lg font-bold flex items-center gap-2">
                         <span className="opacity-50 font-mono">#{String(viewingPoster.id + 1).padStart(2, '0')}</span>
                         {viewingPoster.title}
                     </h3>
                     <p className="text-xs text-white/60 mt-1 max-w-xl truncate">{viewingPoster.chineseDescription}</p>
                 </div>
                 <div className="flex items-center gap-4 pointer-events-auto">
                     {/* ZOOM CONTROLS */}
                     <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 backdrop-blur-sm">
                        <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} className="p-2 text-white/70 hover:text-white transition-colors" title="Zoom Out (-)">
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-white/80 w-10 text-center font-mono select-none">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))} className="p-2 text-white/70 hover:text-white transition-colors" title="Zoom In (+)">
                            <ZoomIn className="w-4 h-4" />
                        </button>
                     </div>

                     <button onClick={() => handleDownloadImage(viewingPoster.generatedImage!, viewingPoster.title)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm">
                         <Download className="w-5 h-5" />
                     </button>
                     <button onClick={closeFullscreen} className="p-3 bg-white/10 hover:bg-red-500/80 rounded-full text-white transition-all backdrop-blur-sm">
                         <X className="w-5 h-5" />
                     </button>
                 </div>
             </div>

             {/* Navigation - Left */}
             <button onClick={() => navigateImage('prev')} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-20 hidden md:block">
                 <ChevronLeft className="w-8 h-8" />
             </button>

             {/* Image Area */}
             <div 
                 className="flex-1 overflow-hidden flex items-center justify-center p-4 relative z-10"
                 onClick={closeFullscreen}
             >
                 <img 
                    src={viewingPoster.generatedImage} 
                    alt={viewingPoster.title} 
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-lg transition-transform duration-200"
                    style={{ transform: `scale(${zoomLevel})` }}
                    onClick={(e) => e.stopPropagation()}
                 />
             </div>
          </div>,
          document.body
       )}

    </div>
  );
};
