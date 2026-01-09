
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UploadSection } from './components/UploadSection';
import { AnalysisView } from './components/AnalysisView';
import { StyleConfig } from './components/StyleConfig';
import { ScenarioSelector } from './components/ScenarioSelector';
import { GenerationView } from './components/GenerationView';
import { DetailPageView } from './components/DetailPageView';
import { analyzeProductImage, generateCampaignPrompts, validateApiKey } from './services/geminiService';
import { AnalysisReport, GenerationConfig, VisualStyle, TypographyStyle, AdvancedSettings, ManualProductInfo, ParsedPoster } from './types';
import { DEFAULT_SCENARIOS } from './constants';
import { Command, Key, Settings, Zap, Loader2, Image as ImageIcon, Sparkles, LayoutDashboard, Settings2, Layers, ScanEye, FileText, ChevronRight, ChevronDown, RotateCcw, Moon, Sun, PanelLeftClose, PanelLeftOpen, AlertTriangle, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck, Globe } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'input' | 'config'>('input');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'generation' | 'analysis' | 'detail'>('generation');
  
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // API Key UI States
  const [showApiKey, setShowApiKey] = useState(false);
  const [keyValidationStatus, setKeyValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

  // Reset Key to force component re-mounts
  const [resetKey, setResetKey] = useState(0);

  // Data
  const [imagesBase64, setImagesBase64] = useState<string[]>([]);
  
  const [manualInfo, setManualInfo] = useState<ManualProductInfo>({
    name: '',
    description: '',
    logoBase64: null
  });

  // Settings & Config
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    apiKey: '',
    textModel: 'gemini-3-pro-preview', // Default strict
    imageModel: 'gemini-3-pro-image-preview', // Default strict
    imageSize: '2K',
    baseUrl: 'https://generativelanguage.googleapis.com'
  });

  const [config, setConfig] = useState<GenerationConfig>({
    visualStyle: VisualStyle.AUTO,
    typographyStyle: TypographyStyle.AUTO,
    aspectRatio: "9:16",
    includeModel: false,
    includeScene: true,
    mainLanguage: "Chinese",
    subLanguage: "Chinese", 
    selectedScenarios: DEFAULT_SCENARIOS
  });

  // Processing State
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'generating' | 'done'>('idle');
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [generatedPrompts, setGeneratedPrompts] = useState<string>("");
  const [parsedPosters, setParsedPosters] = useState<ParsedPoster[]>([]); 

  // Refs
  const topRef = useRef<HTMLDivElement>(null);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Parse Markdown when generatedPrompts changes
  useEffect(() => {
    if (!generatedPrompts) {
        setParsedPosters([]);
        return;
    }

    const posters: ParsedPoster[] = [];
    let idCounter = 0;
    // Split by "## " at start of line
    const sections = generatedPrompts.split(/(?=^#{2}\s)/gm);

    sections.forEach(section => {
      const trimmed = section.trim();
      if (!trimmed || !trimmed.startsWith('## ')) return;

      const titleMatch = trimmed.match(/^#{2}\s+(.+)$/m);
      let title = titleMatch ? titleMatch[1].trim() : 'Poster';
      
      // CLEANUP 1: Remove "海报01 |", "Poster 02 -", etc.
      title = title.replace(/^(海报|Poster)\s*\d+\s*[:|\-]?\s*/i, '').trim();
      
      // CLEANUP 2: Remove leading numbers (e.g., "01 ", "1.", "01_") because the UI adds its own numbering
      title = title.replace(/^[\d\s._-]+/, '').trim();

      // Ignore Analysis Reports
      if (/(报告|Report|Analysis)/i.test(title)) return;
      
      // 1. Creative Description (Chinese)
      const chineseDescMatch = trimmed.match(/\*\*创意描述 \(Chinese\)\*\*[:\s]*([\s\S]*?)(?=\*\*参考图索引)/i);
      const chineseDescription = chineseDescMatch ? chineseDescMatch[1].trim() : "";

      // 2. Reference Image Indices
      const refIndexMatch = trimmed.match(/\*\*参考图索引\*\*[:\s]*(\[?[\d,\s]+\]?)/i);
      let referenceImageIndices: number[] = [0]; 
      if (refIndexMatch && refIndexMatch[1]) {
        try {
            const rawIndices = refIndexMatch[1].replace(/[\[\]]/g, '').split(',');
            const indices = rawIndices.map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
            if (indices.length > 0) {
                referenceImageIndices = indices;
            }
        } catch (e) {
            console.warn("Failed to parse indices", refIndexMatch[1]);
        }
      }

      // 3. Layout Strategy (Chinese) - UPDATED KEY
      const layoutStrategyMatch = trimmed.match(/\*\*排版策略 \(Chinese\)\*\*[:\s]*([\s\S]*?)(?=\*\*Prompt \(English\))/i);
      const layoutStrategy = layoutStrategyMatch ? layoutStrategyMatch[1].trim() : "";

      // 4. Prompt (English) - ADVANCED CLEANUP
      const englishPromptMatch = trimmed.match(/\*\*Prompt \(English\)\*\*[:\s]*([\s\S]*?)(?=\*\*Negative Prompts)/i);
      let englishPrompt = englishPromptMatch 
        ? englishPromptMatch[1].replace(/\*\*/g, '').trim() 
        : "";
      
      // Remove Markdown Code Blocks (```text ... ```)
      englishPrompt = englishPrompt.replace(/```(text|markdown)?/gi, '').replace(/```/g, '').trim();
      
      // Remove Midjourney Parameters (--ar 3:4 --v 6.0 --q 2 etc.)
      englishPrompt = englishPrompt.replace(/--[a-zA-Z]+\s+[\w.:]+/g, '').trim();

      // 5. Negative Prompts
      const negativePromptMatch = trimmed.match(/\*\*Negative Prompts\*\*[:\s]*([\s\S]*?)(?=$|---)/i);
      const negativePrompt = negativePromptMatch 
        ? negativePromptMatch[1].trim() 
        : "";

      // Ensure we have enough content to call it a valid poster
      if (englishPrompt.length > 5) {
        posters.push({
          id: idCounter++,
          title,
          chineseDescription,
          englishPrompt,
          negativePrompt,
          layoutStrategy, // Captured correctly now
          generatedImage: undefined,
          referenceImageIndices 
        });
      }
    });

    setParsedPosters(posters);
  }, [generatedPrompts]);

  const handleVerifyKey = async () => {
      const keyToTest = advancedSettings.apiKey.trim();
      if (!keyToTest) {
          alert("请输入 API Key");
          return;
      }
      setKeyValidationStatus('validating');
      const isValid = await validateApiKey(keyToTest, advancedSettings.baseUrl);
      setKeyValidationStatus(isValid ? 'valid' : 'invalid');
  };

  const handleImageSelected = (base64List: string[]) => {
    setImagesBase64(base64List);
    
    if (base64List.length === 0) {
        setStatus('idle');
        setAnalysis(null);
        setGeneratedPrompts("");
    }
  };

  const performReset = () => {
    setImagesBase64([]);
    setManualInfo({ name: '', description: '', logoBase64: null });
    setAnalysis(null);
    setGeneratedPrompts("");
    setParsedPosters([]);
    setStatus('idle');

    setAdvancedSettings(prev => ({
        ...prev,
        textModel: 'gemini-3-pro-preview',
        imageModel: 'gemini-3-pro-image-preview',
        imageSize: '2K',
        baseUrl: 'https://generativelanguage.googleapis.com'
    }));
    
    setConfig({
        visualStyle: VisualStyle.AUTO,
        typographyStyle: TypographyStyle.AUTO,
        aspectRatio: "9:16",
        includeModel: false,
        includeScene: true,
        mainLanguage: "Chinese",
        subLanguage: "Chinese",
        selectedScenarios: DEFAULT_SCENARIOS
    });

    setActiveTab('input');
    setActiveWorkspaceTab('generation');
    if (topRef.current) topRef.current.scrollTop = 0;
    setResetKey(prev => prev + 1);
    setShowResetConfirm(false);
  };

  const handleStartProcess = async () => {
    if (imagesBase64.length === 0) {
        setActiveTab('input');
        alert("请先上传商品图片");
        return;
    }
    
    const userKey = advancedSettings.apiKey;
    if (!userKey || userKey.trim() === '') {
        setActiveTab('config');
        alert("请先配置 Gemini API Key");
        return;
    }

    setAnalysis(null);
    setGeneratedPrompts("");
    setParsedPosters([]);
    setStatus('analyzing');
    setActiveWorkspaceTab('analysis'); 
    
    if (topRef.current) topRef.current.scrollTop = 0;

    try {
        // Step 1: Analyze (returns image tags now)
        const analysisResult = await analyzeProductImage(
            advancedSettings.apiKey, 
            imagesBase64, 
            advancedSettings, 
            manualInfo
        );
        setAnalysis(analysisResult);
        
        // Step 2: Generate Prompts (uses tags to assign ref indices)
        setActiveWorkspaceTab('generation'); 
        setStatus('generating');
        const prompts = await generateCampaignPrompts(advancedSettings.apiKey, analysisResult, config, advancedSettings, manualInfo);
        setGeneratedPrompts(prompts);
        setStatus('done');

    } catch (error) {
        console.error(error);
        alert("生成过程中出错，请检查 API Key 是否有效或网络连接。");
        setStatus('idle');
    }
  };

  const hasManualKey = advancedSettings.apiKey && advancedSettings.apiKey.trim().length > 0;
  const isReadyToGenerate = imagesBase64.length > 0 && hasManualKey;

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex overflow-hidden font-sans transition-colors duration-300">
      
      {/* === LEFT SIDEBAR: CONTROLS === */}
      <aside className={`${isSidebarOpen ? 'w-[420px] translate-x-0' : 'w-0 -translate-x-full opacity-0'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-20 shadow-xl shrink-0 h-full transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap`}>
         
         {/* 1. Header */}
         <div className="h-16 px-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none shrink-0">
                  <Command className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">KV Master</h1>
                    <p className="text-[10px] text-slate-400 font-medium">视觉全案生成系统</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {(keyValidationStatus === 'valid') && <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-100 dark:border-emerald-800 flex items-center gap-1 animate-in fade-in zoom-in duration-300"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> API 已激活</span>}
                <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <PanelLeftClose className="w-4 h-4" />
                </button>
            </div>
         </div>

         {/* 2. Tabs */}
         <div className="px-5 pt-4 pb-2 shrink-0">
             <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                 <button 
                    onClick={() => setActiveTab('input')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'input' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                 >
                    <Layers className="w-3.5 h-3.5" /> 素材与输入
                 </button>
                 <button 
                    onClick={() => setActiveTab('config')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'config' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                 >
                    <Settings2 className="w-3.5 h-3.5" /> 参数配置
                 </button>
             </div>
         </div>

         {/* 3. Scrollable Content Area */}
         <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-2 space-y-6">
             
             {/* TAB: INPUT */}
             {activeTab === 'input' && (
                 <div className="space-y-6 animate-fade-in">
                     <UploadSection 
                        key={`upload-${resetKey}`}
                        onImageSelected={handleImageSelected} 
                        manualInfo={manualInfo}
                        setManualInfo={setManualInfo}
                        isAnalyzing={status === 'analyzing'}
                        existingImages={imagesBase64}
                    />
                    
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-normal">
                        <p className="font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500" /> 小贴士</p>
                        AI 将自动识别您上传的多张图片内容（如：主图、纹理、场景），并在生成时自动调用最匹配的那一张作为底图。
                    </div>
                 </div>
             )}

             {/* TAB: CONFIG */}
             {activeTab === 'config' && (
                 <div className="space-y-6 animate-fade-in pb-10">
                     
                     {/* Key & Advanced Settings Group */}
                     <div className="space-y-2">
                        {/* API Key */}
                        <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-2">
                                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Gemini API Key <span className="text-red-500">*</span></span>
                                
                                <button 
                                    onClick={handleVerifyKey}
                                    disabled={!advancedSettings.apiKey || keyValidationStatus === 'validating'}
                                    className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                >
                                    {keyValidationStatus === 'validating' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                                    验证有效性
                                </button>
                            </label>
                            
                            <div className="relative">
                                <input
                                    type={showApiKey ? "text" : "password"}
                                    value={advancedSettings.apiKey}
                                    onChange={(e) => {
                                        setAdvancedSettings(prev => ({ ...prev, apiKey: e.target.value }));
                                        setKeyValidationStatus('idle');
                                    }}
                                    placeholder="请输入您的 Gemini API Key (sk-...)"
                                    className={`w-full pl-8 pr-10 py-3 text-xs border rounded-xl bg-white dark:bg-slate-700 outline-none transition-all dark:text-white font-mono
                                        ${keyValidationStatus === 'invalid' 
                                            ? 'border-red-300 focus:ring-2 focus:ring-red-200' 
                                            : keyValidationStatus === 'valid'
                                                ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-200'
                                                : 'border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500'
                                        }
                                    `}
                                />
                                <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                
                                <button 
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            </div>

                            <div className="min-h-[16px] pt-1.5">
                                {keyValidationStatus === 'valid' && <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Key 有效</span>}
                                {keyValidationStatus === 'invalid' && <span className="text-[10px] text-red-500 font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Key 无效或过期</span>}
                                {keyValidationStatus === 'idle' && !advancedSettings.apiKey && <span className="text-[10px] text-slate-400">请输入您的私有 Key</span>}
                            </div>
                        </div>
                        
                        {/* Advanced Settings */}
                        <div className="border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 overflow-hidden">
                            <button 
                                onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
                                className="w-full flex items-center justify-between px-3 py-3 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                            >
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                                    <Settings2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                                    <span>高级配置选项</span>
                                </div>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isAdvancedSettingsOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isAdvancedSettingsOpen && (
                                <div className="px-3 pb-3 pt-0 space-y-3 bg-white dark:bg-slate-700 animate-in slide-in-from-top-2 duration-200">
                                    <div className="h-px bg-slate-100 dark:bg-slate-600 mb-3" />
                                    
                                    {/* Text Model */}
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 block mb-1.5">大语言模型</label>
                                        <div className="relative">
                                            <select 
                                                value={advancedSettings.textModel} 
                                                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, textModel: e.target.value }))} 
                                                className="w-full px-3 py-2.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 outline-none focus:border-indigo-500 appearance-none transition-all text-slate-700 dark:text-slate-200 font-medium"
                                            >
                                                <option value="gemini-3-pro-preview">gemini-3-pro-preview</option>
                                                <option value="gemini-3-flash-preview">gemini-3-flash-preview</option>
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Image Model */}
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 block mb-1.5">图像生成模型</label>
                                        <div className="relative">
                                            <select 
                                                value={advancedSettings.imageModel} 
                                                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, imageModel: e.target.value }))} 
                                                className="w-full px-3 py-2.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 outline-none focus:border-indigo-500 appearance-none transition-all text-slate-700 dark:text-slate-200 font-medium"
                                            >
                                                <option value="gemini-3-pro-image-preview">gemini-3-pro-image-preview</option>
                                                <option value="gemini-2.5-flash-image">gemini-2.5-flash-image</option>
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Output Size */}
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 block mb-1.5">输出质量尺寸</label>
                                        <div className="relative">
                                            <select 
                                                value={advancedSettings.imageSize} 
                                                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, imageSize: e.target.value }))} 
                                                className="w-full px-3 py-2.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 outline-none focus:border-indigo-500 appearance-none transition-all disabled:opacity-50 disabled:bg-slate-50 text-slate-700 dark:text-slate-200 font-medium"
                                                disabled={!advancedSettings.imageModel.includes('pro')}
                                            >
                                                <option value="1K">1K (标准)</option>
                                                <option value="2K">2K (高清)</option>
                                                <option value="4K">4K (超清)</option>
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                        </div>
                                        {!advancedSettings.imageModel.includes('pro') && (
                                            <p className="text-[10px] text-amber-500 mt-1 ml-1">* Flash 模型不支持自定义分辨率</p>
                                        )}
                                    </div>

                                    {/* Base URL */}
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 block mb-1.5 flex items-center gap-1"><Globe className="w-3 h-3"/> API Base URL (代理地址)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={advancedSettings.baseUrl}
                                                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                                                placeholder="https://generativelanguage.googleapis.com"
                                                className="w-full px-3 py-2.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 outline-none focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 font-mono"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-tight">* 用于国内网络环境反代，默认请保持官方地址</p>
                                    </div>

                                </div>
                            )}
                        </div>
                     </div>

                     <div className="h-px bg-slate-100 dark:bg-slate-700" />
                     
                     <ScenarioSelector 
                        key={`scenario-${resetKey}`}
                        config={config}
                        setConfig={setConfig}
                        onGenerate={() => {}}
                        isGenerating={false}
                     />

                     <div className="h-px bg-slate-100 dark:bg-slate-700" />

                     <StyleConfig 
                        key={`style-${resetKey}`} 
                        config={config} 
                        setConfig={setConfig} 
                     />
                 </div>
             )}
         </div>

         {/* 4. Footer Action Button */}
         <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 z-20 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)]">
             <button
                onClick={handleStartProcess}
                disabled={status === 'analyzing' || status === 'generating' || !isReadyToGenerate}
                className={`
                    w-full py-3.5 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center space-x-2 transition-all relative overflow-hidden
                    ${status === 'analyzing' || status === 'generating' || !isReadyToGenerate
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] hover:bg-[100%_0] transition-[background-position] duration-500 text-white shadow-indigo-200'
                    }
                `}
                title={!isReadyToGenerate ? "请先上传图片并输入 API Key" : "立即生成"}
             >
                {status === 'analyzing' ? (
                     <><Loader2 className="w-4 h-4 animate-spin text-indigo-300" /> <span>正在分析视觉基因...</span></>
                ) : status === 'generating' ? (
                     <><Loader2 className="w-4 h-4 animate-spin text-purple-300" /> <span>正在构建视觉方案...</span></>
                ) : (
                     <><Zap className={`w-4 h-4 ${!isReadyToGenerate ? 'fill-slate-400' : 'fill-white'}`} /> <span>立即生成视觉全案</span></>
                )}
             </button>
             {!isReadyToGenerate && (
                 <div className="text-[10px] text-center mt-2 text-red-400 font-medium">
                     {!imagesBase64.length ? "* 请先上传商品图片" : "* 请先在配置中输入 API Key"}
                 </div>
             )}
         </div>
      </aside>


      {/* === CENTER: WORKSPACE === */}
      <main className="flex-1 bg-slate-50/50 dark:bg-slate-900 relative flex flex-col min-w-0 transition-colors">
          
           {/* Header Tabs & Actions */}
           <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-8 flex items-center justify-between sticky top-0 z-10 transition-colors">
                <div className="flex items-center gap-8 h-full">
                    {!isSidebarOpen && (
                        <button 
                           onClick={() => setIsSidebarOpen(true)}
                           className="text-slate-400 hover:text-indigo-600 transition-colors -mr-4 animate-in fade-in zoom-in duration-200"
                           title="展开侧边栏"
                        >
                            <PanelLeftOpen className="w-5 h-5" />
                        </button>
                    )}
                    <button 
                       onClick={() => setActiveWorkspaceTab('generation')}
                       className={`h-full border-b-[3px] py-1 text-sm font-bold flex items-center gap-2 transition-all ${
                           activeWorkspaceTab === 'generation' 
                           ? 'border-indigo-600 text-indigo-800 dark:text-indigo-400' 
                           : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                       }`}
                    >
                       <Layers className="w-4 h-4" /> KV 视觉系统
                    </button>
                    <button 
                       onClick={() => setActiveWorkspaceTab('analysis')}
                       className={`h-full border-b-[3px] py-1 text-sm font-bold flex items-center gap-2 transition-all ${
                           activeWorkspaceTab === 'analysis' 
                           ? 'border-indigo-600 text-indigo-800 dark:text-indigo-400' 
                           : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                       }`}
                    >
                       <ScanEye className="w-4 h-4" /> 识别报告
                    </button>
                    <button 
                       onClick={() => setActiveWorkspaceTab('detail')}
                       className={`h-full border-b-[3px] py-1 text-sm font-bold flex items-center gap-2 transition-all ${
                           activeWorkspaceTab === 'detail' 
                           ? 'border-indigo-600 text-indigo-800 dark:text-indigo-400' 
                           : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                       }`}
                    >
                       <ImageIcon className="w-4 h-4" /> 详情页拼图
                    </button>
                </div>

                {/* --- RIGHT: ACTIONS (Reset & Dark Mode) --- */}
                <div className="flex items-center gap-3">
                    <button 
                       onClick={() => setShowResetConfirm(true)}
                       className="group flex items-center gap-2 px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-full transition-all active:scale-95 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40"
                    >
                        <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500" />
                        <span className="text-xs font-bold">重置系统</span>
                    </button>
                    <button 
                       onClick={() => setDarkMode(!darkMode)}
                       className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-all dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
                    >
                        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>
           </div>

           {/* Content */}
           <div className="flex-1 overflow-y-auto custom-scrollbar p-8 scroll-smooth" ref={topRef}>
                <div className={`mx-auto min-h-[calc(100vh-8rem)] ${activeWorkspaceTab === 'detail' ? 'w-full' : 'max-w-7xl'}`}>
                    
                    {/* --- TAB: GENERATION --- */}
                    {activeWorkspaceTab === 'generation' && (
                        <div className="animate-fade-in">
                            {!generatedPrompts && status !== 'generating' ? (
                                <div className="flex flex-col items-center justify-center h-[600px] text-center">
                                    <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl shadow-indigo-100 dark:shadow-none border border-white dark:border-slate-700 flex items-center justify-center mb-8 relative">
                                        <Sparkles className="w-12 h-12 text-indigo-500 relative z-10" />
                                        <div className="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] transform rotate-6 z-0"></div>
                                        <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">AI</div>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">一键电商视觉 KV 系统</h2>
                                    <p className="text-base text-slate-500 dark:text-slate-400 mb-12">上传产品图片，AI 将自动分析品牌基因并生成全套视觉方案</p>
                                    
                                    <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 font-bold">1</div>
                                            <span>上传</span>
                                        </div>
                                        <div className="w-16 h-px bg-slate-200 dark:bg-slate-700"></div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 font-bold">2</div>
                                            <span>分析</span>
                                        </div>
                                        <div className="w-16 h-px bg-slate-200 dark:bg-slate-700"></div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 font-bold">3</div>
                                            <span>生成</span>
                                        </div>
                                    </div>

                                    <button onClick={() => setActiveTab('input')} className="mt-12 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold text-sm flex items-center gap-1">
                                         <ChevronRight className="w-4 h-4" /> 请在左侧开始配置
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {status === 'generating' && (
                                        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                                            <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">正在构建视觉方案...</h3>
                                            <p className="text-slate-400">AI 正在基于分析报告生成 KV 视觉系统 (10 张)</p>
                                        </div>
                                    )}
                                    {generatedPrompts && (
                                        <GenerationView 
                                            key={`gen-view-${resetKey}`}
                                            markdown={generatedPrompts} 
                                            apiKey={advancedSettings.apiKey}
                                            settings={advancedSettings}
                                            config={config}
                                            images={imagesBase64}
                                            manualInfo={manualInfo}
                                            onBack={() => {}}
                                            parsedPosters={parsedPosters}
                                            setParsedPosters={setParsedPosters}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* --- TAB: ANALYSIS --- */}
                    {activeWorkspaceTab === 'analysis' && (
                        <div className="animate-fade-in">
                            {!analysis && status !== 'analyzing' ? (
                                <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
                                    <ScanEye className="w-12 h-12 mb-4 text-slate-200 dark:text-slate-700" />
                                    <p>暂无识别报告</p>
                                    <p className="text-xs text-slate-300 dark:text-slate-500 mt-2">请先点击“生成”按钮开始分析</p>
                                </div>
                            ) : (
                                <>
                                    {status === 'analyzing' && (
                                        <div className="flex flex-col items-center justify-center h-[500px]">
                                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-6" />
                                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">正在分析视觉基因...</h3>
                                            <p className="text-slate-400 max-w-sm text-center">AI 正在识别产品的品类、材质、卖点以及适合的设计风格</p>
                                        </div>
                                    )}
                                    {analysis && (
                                         <AnalysisView data={analysis} />
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* --- TAB: DETAIL PAGE --- */}
                    {activeWorkspaceTab === 'detail' && (
                        <div className="animate-fade-in">
                             <DetailPageView 
                                key={`detail-${resetKey}`}
                                posters={parsedPosters} 
                             />
                        </div>
                    )}

                </div>
           </div>
      </main>

      {/* --- RESET CONFIRMATION MODAL --- */}
      {showResetConfirm && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 border border-slate-200 dark:border-slate-700">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">确认重置系统？</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                                此操作将清空当前工作区的所有内容且<span className="font-bold text-red-500">无法撤销</span>。
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button 
                                    onClick={() => setShowResetConfirm(false)}
                                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    取消
                                </button>
                                <button 
                                    onClick={performReset}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-none"
                                >
                                    确认重置
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )}

    </div>
  );
};

export default App;
