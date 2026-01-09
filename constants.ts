
import { VisualStyle, TypographyStyle } from './types';

export const VISUAL_STYLES = [
  {
    id: VisualStyle.AUTO,
    label: "智能匹配 (AI自动推荐)",
    desc: "AI根据产品属性自动匹配最佳风格",
    color: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent shadow-md",
    icon: "✨"
  },
  {
    id: "Magazine Editorial",
    label: "杂志编辑风格",
    desc: "高级、专业、大片感、粗衬线标题、极简留白",
    color: "bg-slate-800 text-white",
    icon: "📰"
  },
  {
    id: "Watercolor Art",
    label: "水彩艺术风格",
    desc: "温暖、柔和、晕染效果、手绘质感",
    color: "bg-orange-100 text-orange-900",
    icon: "🎨"
  },
  {
    id: "Tech Future",
    label: "科技未来风格",
    desc: "冷色调、几何图形、数据可视化、蓝光效果",
    color: "bg-blue-900 text-cyan-400",
    icon: "🪐"
  },
  {
    id: "Retro Film",
    label: "复古胶片风格",
    desc: "颗粒质感、暖色调、怀旧氛围、宝丽来边框",
    color: "bg-amber-700 text-amber-100",
    icon: "🎞️"
  },
  {
    id: "Nordic Minimalist",
    label: "极简北欧风格",
    desc: "性冷淡、大留白、几何线条、黑白灰",
    color: "bg-gray-200 text-gray-800",
    icon: "🧊"
  },
  {
    id: "Neon Cyberpunk",
    label: "霓虹赛博风格",
    desc: "荧光色、描边发光、未来都市、暗色背景",
    color: "bg-purple-900 text-fuchsia-400",
    icon: "⚡"
  },
  {
    id: "Natural Organic",
    label: "自然有机风格",
    desc: "植物元素、大地色系、手工质感、环保理念",
    color: "bg-green-100 text-green-800",
    icon: "🌿"
  }
];

export const TYPO_STYLES = [
  { 
    id: TypographyStyle.AUTO, 
    label: "智能匹配", 
    desc: "AI根据画面风格自动匹配最佳排版",
    icon: "🪄" 
  },
  { 
    id: "Magazine Grid", 
    label: "杂志风 (Magazine)", 
    desc: "粗衬线大标题 + 细线装饰 + 网格对齐",
    icon: "📰" 
  },
  { 
    id: "Modern Glass", 
    label: "现代风 (Modern)", 
    desc: "玻璃拟态卡片 + 半透明背景 + 柔和圆角",
    icon: "🪟" 
  },
  { 
    id: "Luxury 3D", 
    label: "奢华风 (Luxury)", 
    desc: "3D浮雕文字 + 金属质感 + 光影效果",
    icon: "💎" 
  },
  { 
    id: "Artistic Handwritten", 
    label: "艺术风 (Artistic)", 
    desc: "手写体标注 + 水彩笔触 + 不规则布局",
    icon: "✒️" 
  },
  { 
    id: "Cyber Neon", 
    label: "赛博风 (Cyber)", 
    desc: "无衬线粗体 + 霓虹描边 + 发光效果",
    icon: "🔮" 
  },
  { 
    id: "Minimal Clean", 
    label: "极简风 (Minimal)", 
    desc: "极细线条字 + 大量留白 + 精确对齐",
    icon: "➖" 
  }
];

export const ASPECT_RATIOS = [
  { id: "9:16", label: "9:16 竖版", width: 24, height: 42, icon: "📱" },
  { id: "2:3", label: "2:3 竖版", width: 26, height: 39, icon: "📸" },
  { id: "3:4", label: "3:4 竖版", width: 30, height: 40, icon: "🖼️" },
  { id: "4:5", label: "4:5 竖版", width: 32, height: 40, icon: "📕" },
  { id: "1:1", label: "1:1 方形", width: 32, height: 32, icon: "🟦" },
  { id: "4:3", label: "4:3 横版", width: 40, height: 30, icon: "📺" },
  { id: "3:2", label: "3:2 横版", width: 42, height: 28, icon: "📷" },
  { id: "16:9", label: "16:9 横版", width: 42, height: 24, icon: "💻" },
  { id: "21:9", label: "21:9 横版", width: 44, height: 18, icon: "🎞️" },
];

export const LANGUAGES = [
  { id: "Chinese", label: "中文", icon: "🇨🇳" },
  { id: "English", label: "English", icon: "🇺🇸" },
  { id: "Japanese", label: "日本語", icon: "🇯🇵" },
  { id: "Korean", label: "한국어", icon: "🇰🇷" },
  { id: "French", label: "Français", icon: "🇫🇷" },
  { id: "German", label: "Deutsch", icon: "🇩🇪" },
  { id: "Spanish", label: "Español", icon: "🇪🇸" },
];

export const DEFAULT_SCENARIOS = [
  { id: "01_hero", label: "01 主KV视觉 (Hero Shot)", desc: "严格还原产品，极致展现品牌调性" },
  { id: "02_lifestyle", label: "02 生活/使用场景 (Lifestyle)", desc: "展示产品在实际生活中的使用状态" },
  { id: "03_process", label: "03 工艺/技术/概念 (Process)", desc: "可视化展示成分、工艺或技术核心" },
  { id: "04_detail1", label: "04 细节特写01 (Detail)", desc: "放大产品局部细节" },
  { id: "05_detail2", label: "05 细节特写02 (Material)", desc: "材质与质感特写" },
  { id: "06_detail3", label: "06 细节特写03 (Function)", desc: "功能细节展示" },
  { id: "07_review", label: "07 细节04/用户评价 (Review)", desc: "好评展示或更多细节" },
  { id: "08_story", label: "08 品牌故事/配色 (Story)", desc: "Moodboard 与品牌配色灵感" },
  { id: "09_specs", label: "09 产品参数/规格表 (Specs)", desc: "规格表与数据化卖点展示" },
  { id: "10_guide", label: "10 使用指南/注意事项 (Guide)", desc: "步骤图或使用说明" }
];
