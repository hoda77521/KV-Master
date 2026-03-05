
export interface AnalysisReport {
  brandName: {
    chinese: string;
    english: string;
    logoStyle?: string;
  };
  // Product Info
  productType: string; 
  productName: string; 
  productSpecs: string; 

  // Colors
  colors: {
    primary: string[];
    secondary: string[];
    styleDescription?: string;
  };

  // Design & Style
  designStyleDescription?: string; // Legacy support
  designStyle: string; 
  fontStyle?: string; 
  visualElements?: string; 

  // Audience
  targetAudience: string; 
  targetAudienceAge: string; 
  consumptionLevel: string; 

  // Detailed Selling Points (New Structure)
  marketingCopy: string[]; // Text-based selling points
  productCertifications: string[]; // Icons/Certifications
  visualFeatures: string[]; // Visual-based features (color, material)
  dataMetrics: string[]; // Numerical data points
  sellingPoints: string[]; // Fallback

  // Parameters
  productMaterials: string; // Ingredients/Material
  usageScenario: string; 
  shelfLife: string; // Storage/Shelf life

  // Packaging Details
  packagingMaterial?: string; 
  packagingStructure?: string;
  packagingDesign?: string;
  packagingHighlights?: string; // Legacy

  brandTone: string;

  // NEW: Per-image analysis inventory
  imageTags: string[]; // Array of descriptions corresponding to uploaded images index (e.g. ["Front View", "Texture Detail"])
}

export enum VisualStyle {
  AUTO = "AUTO_MATCH",
  MAGAZINE = "杂志编辑风格 (Magazine Editorial)",
  WATERCOLOR = "水彩艺术风格 (Watercolor Art)",
  TECH = "科技未来风格 (Tech/Future)",
  RETRO = "复古胶片风格 (Retro Film)",
  MINIMALIST = "极简北欧风格 (Nordic Minimalist)",
  CYBERPUNK = "霓虹赛博风格 (Neon Cyberpunk)",
  ORGANIC = "自然有机风格 (Natural Organic)"
}

export enum TypographyStyle {
  AUTO = "AUTO_MATCH",
  MAGAZINE = "杂志风 (Magazine)",
  MODERN = "现代风 (Modern)",
  LUXURY = "奢华风 (Luxury)",
  ARTISTIC = "艺术风 (Artistic)",
  CYBER = "赛博风 (Cyber)",
  MINIMAL = "极简风 (Minimal)"
}

export interface ScenarioItem {
  id: string;
  label: string;
  desc: string;
  isCustom?: boolean;
}

export interface GenerationConfig {
  visualStyle: string;
  typographyStyle: string;
  aspectRatio: string;
  includeModel: boolean;
  includeScene: boolean;
  mainLanguage: string;
  subLanguage: string;
  selectedScenarios: ScenarioItem[];
}

export interface ManualProductInfo {
  name: string;
  description: string;
  logoBase64: string | null;
  isModelConsistent?: boolean;
  modelRefImage?: string | null;
}

export interface LayoutData {
  title_cn: string;
  title_en: string;
  slogan: string;
  cta: string;
  tags?: string[];
  layout_format: "A" | "B" | "C";
  position: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "center";
  text_color: "dark" | "light";
}

export interface ParsedPoster {
  id: number;
  title: string;
  chineseDescription: string;
  englishPrompt: string;
  negativePrompt: string;
  layoutStrategy: string;
  layoutData?: LayoutData;
  generatedImage?: string;
  referenceImageIndices?: number[]; // NEW: Support multiple reference images explicitly mapped
}

export interface AdvancedSettings {
  apiKey: string;
  textModel: string;
  imageModel: string;
  imageSize: string;
  baseUrl: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
