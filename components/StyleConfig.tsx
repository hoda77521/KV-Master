
import React, { useState, useEffect } from 'react';
import { GenerationConfig, TypographyStyle } from '../types';
import { VISUAL_STYLES, TYPO_STYLES, ASPECT_RATIOS, LANGUAGES } from '../constants';
import { ChevronDown, PenLine, Settings2, Check } from 'lucide-react';

interface StyleConfigProps {
  config: GenerationConfig;
  setConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
}

export const StyleConfig: React.FC<StyleConfigProps> = ({ config, setConfig }) => {
  const [isCustomVisual, setIsCustomVisual] = useState(false);
  const [isCustomTypo, setIsCustomTypo] = useState(false);
  const [isCustomRatio, setIsCustomRatio] = useState(false);

  useEffect(() => {
    const isPresetVisual = VISUAL_STYLES.some(s => s.id === config.visualStyle);
    if (!isPresetVisual && config.visualStyle) setIsCustomVisual(true);

    const isPresetTypo = TYPO_STYLES.some(t => t.id === config.typographyStyle);
    if (!isPresetTypo && config.typographyStyle) setIsCustomTypo(true);

    const isPresetRatio = ASPECT_RATIOS.some(r => r.id === config.aspectRatio);
    if (!isPresetRatio && config.aspectRatio) setIsCustomRatio(true);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* 1. Visual Style */}
      <section>
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">视觉风格</h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {VISUAL_STYLES.map((style) => {
             const isSelected = !isCustomVisual && config.visualStyle === style.id;
             return (
                <button
                  key={style.id}
                  onClick={() => { setIsCustomVisual(false); setConfig(prev => ({ ...prev, visualStyle: style.id })); }}
                  className={`relative text-left px-3 py-2.5 rounded-lg border transition-all flex flex-col gap-1 group w-full ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/30 shadow-sm ring-1 ring-indigo-600'
                      : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-lg transition-all shrink-0 ${isSelected ? 'grayscale-0 scale-110' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                              {style.icon}
                          </span>
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                              {style.label.split(' ')[0]}
                          </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight block truncate w-full">
                      {style.desc}
                  </span>
                </button>
             );
          })}
        </div>
        
        <button onClick={() => { setIsCustomVisual(true); if (VISUAL_STYLES.some(s => s.id === config.visualStyle)) setConfig(prev => ({ ...prev, visualStyle: "" })); }}
             className={`w-full px-3 py-2.5 rounded-lg border border-dashed flex items-center justify-center gap-2 transition-all ${
                 isCustomVisual 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                    : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'
             }`}>
              <PenLine className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">自定义风格</span>
        </button>
        
        {isCustomVisual && (
             <input type="text" value={config.visualStyle} onChange={(e) => setConfig(prev => ({ ...prev, visualStyle: e.target.value }))} className="mt-2 w-full text-xs p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400" placeholder="描述你想要的风格..." />
        )}
      </section>

      {/* 2. Typo */}
      <section>
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">排版风格</h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {TYPO_STYLES.map((typo) => {
             const isSelected = !isCustomTypo && config.typographyStyle === typo.id;
             return (
                <button
                  key={typo.id}
                  onClick={() => { setIsCustomTypo(false); setConfig(prev => ({ ...prev, typographyStyle: typo.id })); }}
                  className={`relative text-left px-3 py-2.5 rounded-lg border transition-all flex flex-col gap-1 group w-full ${
                    isSelected 
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/30 shadow-sm ring-1 ring-indigo-600' 
                        : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-lg transition-all shrink-0 ${isSelected ? 'grayscale-0 scale-110' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                              {typo.icon}
                          </span>
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                              {typo.label}
                          </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight block truncate w-full">
                      {(typo as any).desc}
                  </span>
                </button>
             );
          })}
        </div>

        <button onClick={() => { setIsCustomTypo(true); if (TYPO_STYLES.some(s => s.id === config.typographyStyle)) setConfig(prev => ({ ...prev, typographyStyle: "" })); }}
             className={`w-full px-3 py-2.5 rounded-lg border border-dashed flex items-center justify-center gap-2 transition-all ${
                 isCustomTypo 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                    : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'
             }`}>
              <PenLine className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">自定义排版</span>
        </button>
        
        {isCustomTypo && (
             <input type="text" value={config.typographyStyle} onChange={(e) => setConfig(prev => ({ ...prev, typographyStyle: e.target.value }))} className="mt-2 w-full text-xs p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400" placeholder="描述你想要的排版..." />
        )}
      </section>

      {/* 3. Ratio */}
      <section>
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">画面比例</h4>
        <div className="grid grid-cols-3 gap-2 mb-2">
            {ASPECT_RATIOS.map(r => {
                 const isSelected = !isCustomRatio && config.aspectRatio === r.id;
                 return (
                     <button key={r.id} onClick={() => { setIsCustomRatio(false); setConfig(prev => ({...prev, aspectRatio: r.id})) }} 
                        className={`relative h-11 border rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all group px-1 ${
                            isSelected 
                                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/30 shadow-sm ring-1 ring-indigo-600 text-indigo-700 dark:text-indigo-300' 
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 border-slate-200 dark:border-slate-600'
                        }`}>
                        <span className="text-base shrink-0">{r.icon}</span>
                        <span className="truncate text-[10px]">{r.label}</span>
                        {isSelected && (
                            <div className="absolute top-1 right-1">
                                <Check className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        )}
                     </button>
                 );
            })}
        </div>
        
        <button onClick={() => { setIsCustomRatio(true); if (ASPECT_RATIOS.some(r => r.id === config.aspectRatio)) setConfig(prev => ({ ...prev, aspectRatio: "" })); }}
             className={`w-full px-3 py-2.5 rounded-lg border border-dashed flex items-center justify-center gap-2 transition-all ${
                 isCustomRatio 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500' 
                    : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'
             }`}>
              <PenLine className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">自定义尺寸</span>
        </button>
        
        {isCustomRatio && (
             <input type="text" value={config.aspectRatio} onChange={(e) => setConfig(prev => ({ ...prev, aspectRatio: e.target.value }))} className="mt-2 w-full text-xs p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400" placeholder="输入比例 (如 32:9) ..." />
        )}
      </section>

      {/* 4. Language & Content */}
      <section>
         <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">语言与内容</h4>
         <div className="space-y-3">
             <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="text-[10px] text-slate-400 dark:text-slate-500 mb-1.5 block">主标题语言</label>
                    <div className="relative">
                        <select value={config.mainLanguage} onChange={(e) => setConfig(prev => ({...prev, mainLanguage: e.target.value}))} className="w-full text-xs p-2 pl-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 appearance-none focus:ring-1 focus:ring-indigo-500 outline-none transition-all hover:border-indigo-200 dark:hover:border-indigo-500">
                            {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] text-slate-400 dark:text-slate-500 mb-1.5 block">副文案语言</label>
                    <div className="relative">
                        <select value={config.subLanguage} onChange={(e) => setConfig(prev => ({...prev, subLanguage: e.target.value}))} className="w-full text-xs p-2 pl-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 appearance-none focus:ring-1 focus:ring-indigo-500 outline-none transition-all hover:border-indigo-200 dark:hover:border-indigo-500">
                            <option value="none">🚫 不使用</option>
                            {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                 </div>
             </div>
         </div>
      </section>

    </div>
  );
};
