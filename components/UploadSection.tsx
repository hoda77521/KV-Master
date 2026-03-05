
import React, { useRef, useState } from 'react';
import { ImageIcon, CloudUpload, ImagePlus, Trash2, PackagePlus, Star, Crown, GripHorizontal, UserCheck, User } from 'lucide-react';
import { ManualProductInfo } from '../types';

interface UploadSectionProps {
  onImageSelected: (base64Images: string[]) => void;
  isAnalyzing: boolean;
  manualInfo: ManualProductInfo;
  setManualInfo: React.Dispatch<React.SetStateAction<ManualProductInfo>>;
  existingImages: string[];
}

export const UploadSection: React.FC<UploadSectionProps> = ({ 
  onImageSelected, 
  isAnalyzing,
  manualInfo,
  setManualInfo,
  existingImages,
}) => {
  const [previews, setPreviews] = useState<string[]>(existingImages || []);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null); // Track internal reordering
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputId = "logo-upload-input-unique-id";
  const modelInputId = "model-upload-input-unique-id";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList) as File[];
    
    if (previews.length + files.length > 10) {
      alert(`最多支持上传 10 张图片。您已上传 ${previews.length} 张。`);
      if (e.target) e.target.value = '';
      return;
    }
    processFiles(files);
    if (e.target) e.target.value = '';
  };

  const processFiles = (files: File[]) => {
    const newPreviews: string[] = [];
    let processedCount = 0;
    if (files.length === 0) return;
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`文件 ${file.name} 过大。最大支持 5MB。`);
        processedCount++;
        checkDone(files.length, newPreviews, processedCount);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        processedCount++;
        checkDone(files.length, newPreviews, processedCount);
      };
      reader.readAsDataURL(file);
    });
  };

  const checkDone = (total: number, newPreviews: string[], currentCount: number) => {
     if (currentCount === total) {
         setPreviews(prev => {
             const updated = [...prev, ...newPreviews];
             onImageSelected(updated);
             return updated;
         });
     }
  };

  const clearImages = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setPreviews([]);
      onImageSelected([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (indexToRemove: number) => {
    setPreviews(prev => {
        const updated = prev.filter((_, idx) => idx !== indexToRemove);
        onImageSelected(updated);
        return updated;
    });
  };

  // --- Outer Container Drop (File Upload) ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null) {
        setIsDraggingFile(true);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    // If we are reordering internally, do nothing here (handled by handleItemDragOver)
    if (draggedIndex !== null) return;

    const files = Array.from(e.dataTransfer.files) as File[];
    if (previews.length + files.length > 10) {
        alert(`最多支持 10 张`);
        return;
    }
    if (files.length > 0) processFiles(files);
  };

  // --- Inner Item Drag (Reordering) ---
  const handleItemDragStart = (e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      // e.dataTransfer.setDragImage(e.currentTarget as Element, 20, 20); // Optional custom drag image
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent bubbling to file upload zone
      
      if (draggedIndex === null) return;
      if (draggedIndex === index) return;

      // Swap items
      const newPreviews = [...previews];
      const draggedItem = newPreviews[draggedIndex];
      
      // Remove from old
      newPreviews.splice(draggedIndex, 1);
      // Insert at new
      newPreviews.splice(index, 0, draggedItem);

      setPreviews(newPreviews);
      onImageSelected(newPreviews);
      setDraggedIndex(index); // Update dragged index to match new position
  };

  const handleItemDragEnd = () => {
      setDraggedIndex(null);
  };

  // --- Logo Handlers ---
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
        alert("Logo 文件过大，Max 5MB");
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            setManualInfo(prev => ({ ...prev, logoBase64: event.target!.result as string }));
        }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setManualInfo(prev => ({ ...prev, logoBase64: null }));
  };

  // --- Model Ref Handlers ---
  const handleModelRefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
        alert("图片文件过大，Max 5MB");
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            setManualInfo(prev => ({ ...prev, modelRefImage: event.target!.result as string }));
        }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeModelRef = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setManualInfo(prev => ({ ...prev, modelRefImage: null }));
  };

  const toggleModelConsistency = () => {
      setManualInfo(prev => ({ ...prev, isModelConsistent: !prev.isModelConsistent }));
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Product Images */}
      <div>
        <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">商品图片 ({previews.length}/10)</span>
            <div className="flex items-center gap-3">
                {previews.length > 1 && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <GripHorizontal className="w-3 h-3" /> 拖拽可调整顺序
                    </span>
                )}
                {previews.length > 0 && (
                    <button onClick={clearImages} className="text-[10px] text-red-500 hover:underline">清空</button>
                )}
            </div>
        </div>
        
        <div 
            className={`relative rounded-xl border-2 border-dashed transition-all min-h-[160px] flex flex-col items-center justify-center p-2
            ${isDraggingFile ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/50'}
            ${previews.length > 0 ? 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-900' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                accept="image/*"
                multiple
                className={`absolute inset-0 w-full h-full opacity-0 z-10 ${previews.length > 0 ? 'hidden' : 'cursor-pointer'}`}
                disabled={isAnalyzing}
            />
            
            {previews.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 w-full">
                    {previews.map((src, idx) => {
                        return (
                            <div 
                                key={idx} // Using index is acceptable here for simple reordering of base64 strings
                                draggable={!isAnalyzing}
                                onDragStart={(e) => handleItemDragStart(e, idx)}
                                onDragOver={(e) => handleItemDragOver(e, idx)}
                                onDragEnd={handleItemDragEnd}
                                className={`
                                    relative aspect-square rounded-lg overflow-hidden border-2 bg-white dark:bg-slate-700 group shadow-sm z-20 transition-all cursor-move
                                    ${draggedIndex === idx ? 'opacity-40 scale-95 border-indigo-500' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'}
                                    ${isAnalyzing ? 'cursor-not-allowed opacity-80' : ''}
                                `}
                            >
                                <img src={src} alt={`product-${idx}`} className="w-full h-full object-cover pointer-events-none" />
                                
                                {/* Index Badge */}
                                <div className="absolute top-1 left-1 bg-black/50 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded pointer-events-none">
                                    #{idx + 1}
                                </div>

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5">
                                    <div className="flex justify-end items-center">
                                         <button 
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeImage(idx); }} 
                                            className="p-1 hover:text-red-400 text-white"
                                            disabled={isAnalyzing}
                                         >
                                             <Trash2 className="w-3.5 h-3.5" />
                                         </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {previews.length < 10 && (
                        <div className="relative aspect-square rounded-lg border border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-400 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors z-20"
                             onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }}>
                            <ImagePlus className="w-5 h-5" />
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                    <CloudUpload className="w-8 h-8 text-indigo-200 dark:text-indigo-400 mb-2" />
                    <span className="text-xs font-medium text-slate-400">拖拽或点击上传</span>
                    <span className="text-[10px] text-slate-300 dark:text-slate-500 mt-1">支持多图上传</span>
                </div>
            )}
        </div>
      </div>

      {/* NEW: Model Consistency Toggle */}
      <div className="space-y-3">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                   <UserCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                   <span className="text-xs font-bold text-slate-700 dark:text-slate-200">是否固定模特样貌</span>
              </div>
              
              <button 
                  onClick={toggleModelConsistency}
                  className={`w-9 h-5 rounded-full p-1 transition-colors duration-300 relative ${manualInfo.isModelConsistent ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                  <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ${manualInfo.isModelConsistent ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
          </div>

          {manualInfo.isModelConsistent && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="relative h-16 group">
                      <input 
                          id={modelInputId}
                          type="file" 
                          onChange={handleModelRefChange}
                          accept="image/*"
                          className="hidden" 
                      />
                      <label 
                          htmlFor={modelInputId}
                          className={`w-full h-full border border-dashed rounded-lg flex items-center justify-center transition-all cursor-pointer overflow-hidden relative
                              ${manualInfo.modelRefImage 
                                  ? 'border-indigo-500 bg-white dark:bg-slate-800' 
                                  : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800'
                              }
                          `}
                      >
                          {manualInfo.modelRefImage ? (
                              <div className="relative w-full h-full p-2 flex items-center justify-center">
                                      {/* Checkerboard */}
                                      <div className="absolute inset-1 rounded bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#fff_0%_50%)] dark:bg-[repeating-conic-gradient(#334155_0%_25%,#1e293b_0%_50%)] [background-size:8px_8px] opacity-30 z-0"></div>
                                      <img src={manualInfo.modelRefImage} alt="Model Ref" className="relative z-10 max-w-full max-h-full object-contain rounded" />
                                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 rounded-lg">
                                          <button onClick={removeModelRef} className="text-white hover:text-red-400 p-1 bg-slate-800/50 rounded-full"><Trash2 className="w-4 h-4" /></button>
                                      </div>
                              </div>
                          ) : (
                              <div className="flex items-center gap-2 text-slate-400">
                                  <User className="w-4 h-4" />
                                  <div className="flex flex-col text-left">
                                     <span className="text-xs font-medium">上传人物样貌参考图</span>
                                     <span className="text-[9px] opacity-70">生成结果将复刻此外貌五官</span>
                                  </div>
                              </div>
                          )}
                      </label>
                  </div>
              </div>
          )}
      </div>

      {/* 2. Supplementary Info (Manual Info + Logo) */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
         <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
            <PackagePlus className="w-3.5 h-3.5" />
            <span className="text-xs font-bold uppercase tracking-wider">补充信息 (选填)</span>
         </div>
         
         <input 
            type="text"
            value={manualInfo.name}
            onChange={(e) => setManualInfo(prev => ({...prev, name: e.target.value}))}
            placeholder="商品名称..."
            className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 dark:text-slate-200"
         />

         {/* Logo Upload - Moved Here */}
         <div className="relative h-16 group">
            <input 
                id={logoInputId}
                type="file" 
                onChange={handleLogoChange}
                accept="image/*"
                className="hidden" 
            />
            <label 
                htmlFor={logoInputId}
                className={`w-full h-full border border-dashed rounded-lg flex items-center justify-center transition-all cursor-pointer overflow-hidden relative
                    ${manualInfo.logoBase64 
                        ? 'border-indigo-500 bg-white dark:bg-slate-800' 
                        : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800'
                    }
                `}
            >
                {manualInfo.logoBase64 ? (
                    <div className="relative w-full h-full p-2 flex items-center justify-center">
                            {/* Checkerboard */}
                            <div className="absolute inset-1 rounded bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#fff_0%_50%)] dark:bg-[repeating-conic-gradient(#334155_0%_25%,#1e293b_0%_50%)] [background-size:8px_8px] opacity-30 z-0"></div>
                            <img src={manualInfo.logoBase64} alt="Logo" className="relative z-10 max-w-full max-h-full object-contain" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 rounded-lg">
                                <button onClick={removeLogo} className="text-white hover:text-red-400 p-1 bg-slate-800/50 rounded-full"><Trash2 className="w-4 h-4" /></button>
                            </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                        <ImagePlus className="w-4 h-4" />
                        <span className="text-xs font-medium">上传品牌 Logo (PNG)</span>
                    </div>
                )}
            </label>
        </div>

         <textarea 
            value={manualInfo.description}
            onChange={(e) => setManualInfo(prev => ({...prev, description: e.target.value}))}
            placeholder="核心卖点描述..."
            className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none h-20 resize-none transition-all placeholder:text-slate-400 text-slate-700 dark:text-slate-200"
         />
      </div>

    </div>
  );
};
