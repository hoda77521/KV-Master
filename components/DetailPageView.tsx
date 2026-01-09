
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ParsedPoster } from '../types';
import { Download, X, ArrowUp, ArrowDown, Plus, Image as ImageIcon, Trash2, GripVertical, AlertCircle, Layout, CheckCheck, Maximize, Upload, HardDrive, Sparkles, CloudUpload } from 'lucide-react';

interface DetailPageViewProps {
  posters: ParsedPoster[];
}

// Unified Asset Interface
interface AssetItem {
  id: string;
  src: string;
  title: string;
  type: 'generated' | 'local';
  originalId?: number; // Keep track of original ID for generated items if needed
}

export const DetailPageView: React.FC<DetailPageViewProps> = ({ posters }) => {
  
  // State for Local Assets
  const [localAssets, setLocalAssets] = useState<AssetItem[]>([]);
  
  // State for Selection (Using String IDs now to handle mixed types)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  
  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Separate Lists for Rendering
  const generatedItems: AssetItem[] = useMemo(() => posters
    .filter(p => p.generatedImage)
    .map(p => ({
        id: `gen_${p.id}`,
        src: p.generatedImage!,
        title: p.title,
        type: 'generated',
        originalId: p.id
    })), [posters]);

  // 2. Merge for Logic (Selection, Export order)
  const allAssets = useMemo(() => {
    return [...generatedItems, ...localAssets];
  }, [generatedItems, localAssets]);

  // Auto-select generated images on first load if empty
  useEffect(() => {
    if (generatedItems.length > 0 && selectedIds.length === 0 && localAssets.length === 0) {
      setSelectedIds(generatedItems.map(i => i.id));
    }
  }, []); 

  // --- Handlers ---

  const processFiles = (files: FileList | null) => {
      if (!files || files.length === 0) return;

      Array.from(files).forEach((file: File) => {
          if (!file.type.startsWith('image/')) return;
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setLocalAssets(prev => [
                      ...prev,
                      {
                          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                          src: event.target!.result as string,
                          title: file.name,
                          type: 'local'
                      }
                  ]);
              }
          };
          reader.readAsDataURL(file);
      });
  };

  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOverFile = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(true);
  };

  const handleDragLeaveFile = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);
  };

  const handleDropFile = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);
      processFiles(e.dataTransfer.files);
  };

  const handleDeleteLocal = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setLocalAssets(prev => prev.filter(a => a.id !== id));
      setSelectedIds(prev => prev.filter(sid => sid !== id));
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
        setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
        setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(allAssets.map(a => a.id));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIds = [...selectedIds];
    if (direction === 'up' && index > 0) {
        [newIds[index], newIds[index - 1]] = [newIds[index - 1], newIds[index]];
    } else if (direction === 'down' && index < newIds.length - 1) {
        [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    }
    setSelectedIds(newIds);
  };

  const removeItem = (index: number) => {
    const newIds = [...selectedIds];
    newIds.splice(index, 1);
    setSelectedIds(newIds);
  };

  // --- Drag and Drop Logic (Reordering in Preview) ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault(); 
      if (draggedIndex === null) return;
      if (draggedIndex === index) return;

      const newIds = [...selectedIds];
      const draggedItem = newIds[draggedIndex];
      
      newIds.splice(draggedIndex, 1);
      newIds.splice(index, 0, draggedItem);
      
      setSelectedIds(newIds);
      setDraggedIndex(index);
  };

  const handleDragEnd = () => {
      setDraggedIndex(null);
  };

  const handleExport = async () => {
    if (selectedIds.length === 0) return;
    setIsExporting(true);

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Load images
        const loadedImages = await Promise.all(
            selectedIds.map(id => {
                const asset = allAssets.find(a => a.id === id);
                if (!asset) return null;
                return new Promise<{img: HTMLImageElement}>((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.onload = () => resolve({img});
                    img.onerror = reject;
                    img.src = asset.src;
                });
            })
        );

        const validImages = loadedImages.filter((item): item is {img: HTMLImageElement} => item !== null);
        if (validImages.length === 0) return;

        // Calculate Size
        const targetWidth = validImages[0].img.width;
        let totalHeight = 0;
        
        validImages.forEach(({img}) => {
             const scale = targetWidth / img.width;
             totalHeight += img.height * scale;
        });

        canvas.width = targetWidth;
        canvas.height = totalHeight;

        // Draw
        let currentY = 0;
        validImages.forEach(({img}) => {
            const scale = targetWidth / img.width;
            const drawHeight = img.height * scale;
            ctx.drawImage(img, 0, currentY, targetWidth, drawHeight);
            currentY += drawHeight;
        });

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const link = document.createElement('a');
        link.download = `KV_Detail_Page_${Date.now()}.jpg`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (e) {
        console.error("Export failed", e);
        alert("导出长图失败，请重试");
    } finally {
        setIsExporting(false);
    }
  };

  const selectedAssetsInOrder = selectedIds
    .map(id => allAssets.find(a => a.id === id))
    .filter((a): a is AssetItem => !!a);

  // --- Render Helper for Asset Card ---
  const renderAssetCard = (asset: AssetItem, isSquare: boolean) => {
      const isSelected = selectedIds.includes(asset.id);
      const selectionIndex = selectedIds.indexOf(asset.id);

      return (
        <div 
            key={asset.id} 
            onClick={() => toggleSelection(asset.id)}
            className={`
                relative cursor-pointer group rounded-lg overflow-hidden border-2 transition-all duration-200 bg-slate-100 dark:bg-slate-700
                ${isSquare ? 'aspect-square' : ''} 
                ${isSelected 
                    ? 'border-indigo-600 ring-2 ring-indigo-100 dark:ring-indigo-900/50' 
                    : 'border-transparent hover:border-indigo-300 dark:hover:border-indigo-600'
                }
            `}
        >
            <img 
                src={asset.src} 
                className={`w-full block ${isSquare ? 'h-full object-cover' : 'h-auto object-contain'}`} 
                alt={asset.title} 
            />
            
            {/* Overlay Icon */}
            <div className={`absolute inset-0 bg-indigo-900/40 flex items-center justify-center transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {isSelected ? <X className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
            </div>
            
            {/* Label & Type */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-4">
                <div className="flex items-center justify-between">
                    <p className="text-[9px] text-white truncate max-w-[70%]">{asset.title}</p>
                    {asset.type === 'local' && (
                        <HardDrive className="w-3 h-3 text-emerald-400" />
                    )}
                </div>
            </div>

            {/* Selection Badge */}
            {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs border border-white shadow-sm z-10">
                    {selectionIndex + 1}
                </div>
            )}

            {/* Delete Local Button */}
            {asset.type === 'local' && (
                <button 
                    onClick={(e) => handleDeleteLocal(asset.id, e)}
                    className="absolute top-2 left-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-20"
                    title="删除本地素材"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            )}
        </div>
      );
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
       
       {/* LEFT: Asset Library */}
       <div className="w-1/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
          
          {/* Header */}
          <div className="h-14 px-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-2">
                 <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    素材库 ({allAssets.length})
                 </h3>
             </div>

             <div className="flex items-center gap-2">
                 <button 
                    onClick={handleSelectAll}
                    disabled={allAssets.length === 0}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500 text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
                 >
                    <CheckCheck className="w-3 h-3" /> 全选
                 </button>
                 <button 
                    onClick={handleClearAll}
                    disabled={selectedIds.length === 0}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
                 >
                    <Trash2 className="w-3 h-3" /> 清空
                 </button>
             </div>
          </div>

          {/* Asset Grid Container */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
             
             {/* SECTION 1: UPLOADED ASSETS (Square) */}
             <div>
                 <div className="flex items-center justify-between mb-3 px-1">
                     <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5" /> 本地素材 ({localAssets.length})
                     </h4>
                     
                     <input 
                         type="file" 
                         ref={fileInputRef} 
                         onChange={handleLocalUpload} 
                         className="hidden" 
                         multiple 
                         accept="image/*"
                     />
                 </div>
                 
                 {localAssets.length === 0 ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOverFile}
                        onDragLeave={handleDragLeaveFile}
                        onDrop={handleDropFile}
                        className={`
                            border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 cursor-pointer transition-all
                            ${isDraggingFile 
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }
                        `}
                    >
                        <CloudUpload className="w-8 h-8 mb-2 opacity-50 text-indigo-400" />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">点击或拖拽上传图片</span>
                        <span className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">支持 JPG/PNG</span>
                    </div>
                 ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {localAssets.map(asset => renderAssetCard(asset, true))}
                        
                        {/* Add Button Tile */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOverFile}
                            onDragLeave={handleDragLeaveFile}
                            onDrop={handleDropFile}
                            className={`
                                aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
                                ${isDraggingFile 
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }
                            `}
                        >
                            <Plus className="w-6 h-6 text-slate-400 mb-1" />
                            <span className="text-[10px] text-slate-400 font-bold">添加素材</span>
                        </div>
                    </div>
                 )}
             </div>

             {/* SECTION 2: GENERATED ASSETS (Natural Height) */}
             <div>
                 <div className="flex items-center justify-between mb-3 px-1">
                     <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" /> 生成素材 ({generatedItems.length})
                     </h4>
                 </div>

                 {generatedItems.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="w-6 h-6 mb-2 opacity-50" />
                        <span className="text-[10px]">暂无生成海报</span>
                    </div>
                 ) : (
                    <div className="grid grid-cols-2 gap-3 items-start">
                        {generatedItems.map(asset => renderAssetCard(asset, false))}
                    </div>
                 )}
             </div>

          </div>
       </div>

       {/* RIGHT: Canvas Preview */}
       <div className="flex-1 flex flex-col bg-slate-200/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden relative transition-colors">
          <div className="absolute inset-0 pointer-events-none z-0 opacity-10 dark:opacity-20" 
               style={{backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
          </div>

          {/* Header */}
          <div className="h-14 px-4 flex items-center justify-between shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10 relative transition-colors">
               <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                   <Layout className="w-4 h-4" />
                   长图预览 ({selectedIds.length} 张)
               </h3>
               
               <div className="flex items-center gap-3">
                   {/* Fullscreen Button */}
                   <button 
                      onClick={() => setShowFullscreen(true)}
                      disabled={selectedIds.length === 0}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="全屏预览"
                   >
                       <Maximize className="w-5 h-5" />
                   </button>
                   
                   {/* Export Button */}
                   <button 
                      onClick={handleExport}
                      disabled={selectedIds.length === 0 || isExporting}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:shadow-none"
                   >
                       {isExporting ? "处理中..." : "导出长图 (JPG)"}
                       <Download className="w-3.5 h-3.5" />
                   </button>
               </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar flex justify-center z-10">
               {selectedAssetsInOrder.length === 0 ? (
                   <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                       <div className="w-16 h-16 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex items-center justify-center mb-3">
                           <Layout className="w-6 h-6" />
                       </div>
                       <p className="text-sm font-medium">请从左侧选择素材</p>
                       <p className="text-xs text-slate-300 mt-1">支持生成海报与本地上传图片拼接</p>
                   </div>
               ) : (
                   <div className="w-full max-w-[400px] shadow-2xl bg-white dark:bg-slate-800 h-fit transition-colors">
                       {selectedAssetsInOrder.map((asset, index) => (
                           <div 
                               key={asset.id} 
                               draggable={true}
                               onDragStart={(e) => handleDragStart(e, index)}
                               onDragOver={(e) => handleDragOver(e, index)}
                               onDragEnd={handleDragEnd}
                               className={`
                                   relative group cursor-move transition-all duration-200
                                   ${draggedIndex === index ? 'opacity-40 scale-[0.98] ring-4 ring-indigo-500/50 z-50' : 'hover:z-10'}
                               `}
                           >
                               {/* Drag Handle Indicator */}
                               <div className="absolute top-1/2 left-4 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-20 pointer-events-none">
                                  <GripVertical className="w-5 h-5" />
                               </div>

                               <img src={asset.src} className="w-full block select-none pointer-events-none" alt="slice" />
                               
                               {/* Hover Controls - ENLARGED */}
                               <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-2 rounded-xl backdrop-blur-md z-20 shadow-xl border border-white/10 scale-105 origin-right">
                                   <button 
                                      onClick={() => moveItem(index, 'up')}
                                      disabled={index === 0}
                                      className="p-2.5 text-white hover:bg-white/20 rounded-lg disabled:opacity-30 transition-colors"
                                      title="上移"
                                    >
                                       <ArrowUp className="w-5 h-5" />
                                   </button>
                                   <button 
                                      onClick={() => moveItem(index, 'down')}
                                      disabled={index === selectedAssetsInOrder.length - 1}
                                      className="p-2.5 text-white hover:bg-white/20 rounded-lg disabled:opacity-30 transition-colors"
                                      title="下移"
                                    >
                                       <ArrowDown className="w-5 h-5" />
                                   </button>
                                   <div className="h-px bg-white/20 my-1 w-full"></div>
                                   <button 
                                      onClick={() => removeItem(index)}
                                      className="p-2.5 text-red-400 hover:bg-red-500/20 rounded-lg hover:text-red-300 transition-colors"
                                      title="移除"
                                    >
                                       <Trash2 className="w-5 h-5" />
                                   </button>
                               </div>

                               {/* Index Indicator */}
                               <div className="absolute left-2 top-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                   #{index + 1}
                               </div>
                           </div>
                       ))}
                   </div>
               )}
          </div>
       </div>

       {/* Fullscreen Preview Modal */}
       {showFullscreen && createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col animate-in fade-in duration-200 backdrop-blur-sm">
             {/* Modal Header */}
             <div className="h-16 flex items-center justify-between px-6 bg-white/5 border-b border-white/10 shrink-0">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Layout className="w-5 h-5 text-indigo-400" />
                    长图全屏预览
                  </h3>
                  <button onClick={() => setShowFullscreen(false)} className="p-2 bg-white/10 hover:bg-white/20 hover:text-red-400 text-white rounded-full transition-all">
                    <X className="w-6 h-6" />
                  </button>
             </div>
             
             {/* Modal Content - Centered & Scrollable */}
             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar flex justify-center">
                 {/* Long Image Container - Max Width suitable for viewing */}
                 <div className="w-full max-w-2xl bg-white shadow-2xl min-h-min">
                     {selectedAssetsInOrder.map((asset, index) => (
                         <img key={index} src={asset.src} className="w-full block" alt={`slice-${index}`} />
                     ))}
                 </div>
             </div>
          </div>,
          document.body
       )}

    </div>
  );
};
