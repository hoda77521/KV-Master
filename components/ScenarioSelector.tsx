
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { GenerationConfig, ScenarioItem } from '../types';
import { DEFAULT_SCENARIOS } from '../constants';
import { CheckCircle2, Circle, Plus, X, Trash2 } from 'lucide-react';

interface ScenarioSelectorProps {
  config: GenerationConfig;
  setConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ config, setConfig }) => {
  const [showModal, setShowModal] = useState(false);
  const [customSubject, setCustomSubject] = useState("");
  const [customDesc, setCustomDesc] = useState("");

  const toggleScenario = (scenario: ScenarioItem) => {
    setConfig(prev => {
        const exists = prev.selectedScenarios.find(s => s.id === scenario.id);
        let newScenarios;
        if (exists) {
            newScenarios = prev.selectedScenarios.filter(s => s.id !== scenario.id);
        } else {
            // Add to selection
            newScenarios = [...prev.selectedScenarios, scenario];
            // Sort: Default scenarios based on original index, then custom ones
            newScenarios.sort((a, b) => {
                const indexA = DEFAULT_SCENARIOS.findIndex(ds => ds.id === a.id);
                const indexB = DEFAULT_SCENARIOS.findIndex(ds => ds.id === b.id);
                
                if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Both default
                if (indexA !== -1) return -1; // A is default
                if (indexB !== -1) return 1; // B is default
                return 0; // Both custom
            });
        }
        return { ...prev, selectedScenarios: newScenarios };
    });
  };

  const selectAllDefaults = () => {
    setConfig(prev => {
        const custom = prev.selectedScenarios.filter(s => s.isCustom);
        return { ...prev, selectedScenarios: [...DEFAULT_SCENARIOS, ...custom] };
    });
  };

  const clearDefaults = () => {
    setConfig(prev => {
        const custom = prev.selectedScenarios.filter(s => s.isCustom);
        return { ...prev, selectedScenarios: custom };
    });
  };

  const addCustomScenario = () => {
    if (!customSubject.trim()) return;
    const newId = `custom_${Date.now()}`;
    const newItem: ScenarioItem = {
        id: newId,
        label: customSubject,
        desc: customDesc || "自定义画面描述",
        isCustom: true
    };
    
    // Add to config AND automatically select it
    setConfig(prev => ({ 
        ...prev, 
        selectedScenarios: [...prev.selectedScenarios, newItem] 
    }));
    
    setCustomSubject("");
    setCustomDesc("");
    setShowModal(false);
  };

  const removeCustomScenario = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setConfig(prev => ({
          ...prev,
          selectedScenarios: prev.selectedScenarios.filter(s => s.id !== id)
      }));
  };
  
  const customScenarios = config.selectedScenarios.filter(s => s.isCustom);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
         <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">场景选择</h4>
         
         <div className="flex items-center gap-2">
             <button 
                onClick={selectAllDefaults}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-1.5 py-0.5 rounded transition-colors"
             >
                全选
             </button>
             <div className="w-px h-3 bg-slate-200 dark:bg-slate-600"></div>
             <button 
                onClick={clearDefaults}
                className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-1.5 py-0.5 rounded transition-colors"
             >
                清空
             </button>
             <span className="text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full font-bold ml-1">
                 {config.selectedScenarios.length} 已选
             </span>
         </div>
      </div>
      
      {/* Default Scenarios Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
          {DEFAULT_SCENARIOS.map((scenario) => {
              const isSelected = config.selectedScenarios.some(s => s.id === scenario.id);
              return (
                  <div 
                      key={scenario.id}
                      onClick={() => toggleScenario(scenario)}
                      className={`
                          cursor-pointer px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 select-none group relative overflow-hidden h-full
                          ${isSelected 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' 
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }
                      `}
                  >
                      <div className="flex flex-col min-w-0 flex-1 relative z-10">
                          <div className="font-bold text-[11px] leading-tight flex flex-col items-start gap-0.5">
                             <span className={`text-[10px] font-mono opacity-80 ${isSelected ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-400'}`}>
                                {scenario.label.split(' ')[0]}
                             </span>
                             <span className="truncate w-full text-left">{scenario.label.split(' ').slice(1).join(' ')}</span>
                          </div>
                      </div>
                      <div className={`shrink-0 relative z-10`}>
                          {isSelected 
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> 
                            : <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-300 dark:group-hover:text-indigo-400" />
                          }
                      </div>
                  </div>
              );
          })}
      </div>

      {/* Custom Scenarios Header */}
      <div className="flex items-center justify-between mb-3 mt-6 border-t border-slate-100 dark:border-slate-700 pt-4">
         <span className="text-xs font-bold text-slate-400 dark:text-slate-500">自定义场景 / 补充描述 ({customScenarios.length})</span>
      </div>

      <div className="space-y-2">
          {customScenarios.map((scenario) => (
               <div 
                  key={scenario.id}
                  className="group px-3 py-3 rounded-lg border bg-white dark:bg-slate-800 border-indigo-100 dark:border-slate-600 shadow-sm flex items-start justify-between gap-2 hover:shadow-md transition-all"
              >
                  <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-indigo-900 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          {scenario.label}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 pl-3">{scenario.desc}</div>
                  </div>
                  <button 
                    onClick={(e) => removeCustomScenario(scenario.id, e)}
                    className="text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                  >
                      <Trash2 className="w-3.5 h-3.5" />
                  </button>
              </div>
          ))}

          <button 
            onClick={() => setShowModal(true)}
            className="w-full py-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all font-medium text-xs flex items-center justify-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> 添加新场景
          </button>
      </div>

      {/* Modal Portal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-[420px] rounded-xl shadow-2xl p-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">新建场景描述</h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-4 h-4"/></button>
                </div>
                
                <div className="space-y-4">
                     <div>
                        <input 
                            value={customSubject} 
                            onChange={e => setCustomSubject(e.target.value)}
                            placeholder="场景主题 (例如: 卖点特写)"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-white font-medium"
                            autoFocus
                        />
                     </div>
                     <div>
                        <textarea
                            value={customDesc}
                            onChange={e => setCustomDesc(e.target.value)}
                            placeholder="详细提示词/画面描述..."
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm h-32 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-white custom-scrollbar leading-relaxed"
                        />
                     </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={() => setShowModal(false)} 
                        className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={addCustomScenario} 
                        disabled={!customSubject.trim()}
                        className="flex-1 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> 确认添加
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};
