
import React from 'react';
import { AnalysisReport } from '../types';
import { Sparkles, Trophy, BarChart3, ScanFace } from 'lucide-react';

interface AnalysisViewProps {
  data: AnalysisReport;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ data }) => {
  return (
    <div className="space-y-6 pb-10">
      
      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Card 01: Brand Identity */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col min-h-[220px]">
          <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
             <span className="opacity-50">01.</span> 品牌识别
          </h3>
          <div className="space-y-5 flex-1">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">标志/品牌文字</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{data.brandName.chinese} ({data.brandName.english || '-'})</p>
            </div>
             <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">设计风格描述</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{data.designStyleDescription || data.designStyle}</p>
            </div>
             {data.brandName.logoStyle && (
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">Logo 风格</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{data.brandName.logoStyle}</p>
                 </div>
             )}
          </div>
        </div>

        {/* Card 02: Product Analysis */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col min-h-[220px]">
          <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
             <span className="opacity-50">02.</span> 产品分析
          </h3>
          <div className="space-y-5 flex-1">
             <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">所属品类</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.productType}</p>
            </div>
             <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">产品核心称呼</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">{data.productName || data.productType}</p>
            </div>
             <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">规格型号</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.productSpecs || '标准规格'}</p>
            </div>
          </div>
        </div>

        {/* Card 03: Visual Colors */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col min-h-[220px]">
          <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
             <span className="opacity-50">03.</span> 视觉色系
          </h3>
          <div className="space-y-5 flex-1">
             <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2">主色调</p>
              <div className="flex flex-wrap gap-3">
                 {data.colors.primary.map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-10 h-10 rounded-lg shadow-sm border border-slate-100 dark:border-slate-600 ring-2 ring-transparent group-hover:ring-slate-100 transition-all" style={{backgroundColor: c}}></div>
                    </div>
                 ))}
              </div>
            </div>
            {data.colors.secondary.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2">辅助色</p>
                  <div className="flex flex-wrap gap-3">
                    {data.colors.secondary.map((c, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-lg shadow-sm border border-slate-100 dark:border-slate-600" style={{backgroundColor: c}}></div>
                        </div>
                    ))}
                  </div>
                </div>
            )}
             {data.colors.styleDescription && (
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">配色风格</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.colors.styleDescription}</p>
                 </div>
             )}
          </div>
        </div>

        {/* Card 04: Design Style */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col min-h-[220px]">
          <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
             <span className="opacity-50">04.</span> 设计风格
          </h3>
          <div className="space-y-5 flex-1">
             <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">整体视觉定位</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{data.designStyle}</p>
             </div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">建议字体风格</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{data.fontStyle || "现代无衬线字体"}</p>
             </div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">建议装饰元素</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{data.visualElements || "极简线条"}</p>
             </div>
          </div>
        </div>

        {/* Card 05: Target Audience */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col min-h-[220px]">
          <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
             <span className="opacity-50">05.</span> 核心受众
          </h3>
          <div className="space-y-5 flex-1">
              <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">典型用户画像</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{data.targetAudience}</p>
              </div>
              <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">核心受众年龄</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.targetAudienceAge || "20-40岁"}</p>
              </div>
              <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">消费能力/层级</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.consumptionLevel || "中高端"}</p>
              </div>
          </div>
        </div>

        {/* Card 06: Key Selling Points */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col min-h-[220px]">
          <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
             <span className="opacity-50">06.</span> 核心卖点
          </h3>
          <div className="space-y-4 flex-1">
             <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2">营销核心文案</p>
                <div className="flex flex-wrap gap-2">
                    {data.marketingCopy.map((point, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[11px] text-slate-700 dark:text-slate-200 font-bold leading-relaxed">
                            {point}
                        </span>
                    ))}
                </div>
             </div>
             {data.productCertifications && data.productCertifications.length > 0 && (
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1"><Trophy className="w-3 h-3"/> 品质背书/认证</p>
                    <div className="flex flex-wrap gap-2">
                        {data.productCertifications.map((point, i) => (
                            <span key={i} className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded text-[11px] text-amber-700 dark:text-amber-200 font-bold leading-relaxed">
                                {point}
                            </span>
                        ))}
                    </div>
                 </div>
             )}
             {data.visualFeatures && data.visualFeatures.length > 0 && (
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1"><ScanFace className="w-3 h-3"/> 视觉核心特征</p>
                    <div className="flex flex-wrap gap-2">
                        {data.visualFeatures.map((point, i) => (
                            <span key={i} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded text-[11px] text-indigo-700 dark:text-indigo-200 font-bold leading-relaxed">
                                {point}
                            </span>
                        ))}
                    </div>
                 </div>
             )}
              {data.dataMetrics && data.dataMetrics.length > 0 && (
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1"><BarChart3 className="w-3 h-3"/> 核心数据指标</p>
                    <div className="flex flex-wrap gap-2">
                        {data.dataMetrics.map((point, i) => (
                            <span key={i} className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded text-[11px] text-emerald-700 dark:text-emerald-200 font-bold leading-relaxed">
                                {point}
                            </span>
                        ))}
                    </div>
                 </div>
             )}
          </div>
        </div>
        
         {/* Card 07: Specs */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col min-h-[220px]">
          <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
             <span className="opacity-50">07.</span> 物理规格
          </h3>
          <div className="space-y-5 flex-1">
             <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">物理规格参数</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.productSpecs || '常规规格'}</p>
             </div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">核心成分/材质</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.productMaterials || data.productType}</p>
             </div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">建议使用场景</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.usageScenario || "全场景适用"}</p>
             </div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">保质/有效期</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.shelfLife || "长期有效"}</p>
             </div>
          </div>
        </div>

        {/* Card 08: Packaging */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col min-h-[220px]">
          <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
             <span className="opacity-50">08.</span> 包装工艺
          </h3>
          <div className="space-y-5 flex-1">
              <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">产品材质质感</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{data.packagingMaterial || data.packagingHighlights || "高质感材质"}</p>
              </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">包装结构形式</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{data.packagingStructure || "标准包装"}</p>
              </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">包装设计亮点</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{data.packagingDesign || "简约设计"}</p>
              </div>
          </div>
        </div>

      </div>

      {/* Special Card: Brand Tone (Full Width) */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none text-white relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-30 transition-opacity transform group-hover:scale-110 duration-700">
            <Sparkles className="w-32 h-32" />
         </div>
         <div className="relative z-10">
             <h3 className="text-[10px] font-black text-indigo-200 mb-3 uppercase tracking-widest flex items-center gap-2">
                AI 品牌调性推演
             </h3>
             <div className="text-xl md:text-2xl font-bold leading-relaxed max-w-4xl italic tracking-wide">
                "{data.brandTone}"
             </div>
         </div>
         <div className="absolute bottom-4 right-4 text-indigo-300">
            <Sparkles className="w-6 h-6 animate-pulse" />
         </div>
      </div>

    </div>
  );
};
