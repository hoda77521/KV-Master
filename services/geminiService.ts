
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport, GenerationConfig, AdvancedSettings, VisualStyle, TypographyStyle, ManualProductInfo } from "../types";

/**
 * Helper to initialize AI with custom settings
 * SECURITY NOTE: This function explicitly requires a user-provided API key.
 * It will NOT fallback to process.env or any other source to prevent leaks in shared environments.
 */
const initAI = (apiKey: string, baseUrl: string) => {
  const key = apiKey ? apiKey.trim() : "";
  if (!key) throw new Error("API Key 未配置。请在左侧“参数配置”面板中输入您的 Gemini API Key。");
  
  return new GoogleGenAI({ 
    apiKey: key, 
    baseUrl: baseUrl || "https://generativelanguage.googleapis.com" 
  });
};

/**
 * Validate API Key validity
 */
export const validateApiKey = async (apiKey: string, baseUrl: string): Promise<boolean> => {
  if (!apiKey || apiKey.trim() === '') return false;
  try {
    const ai = new GoogleGenAI({ 
        apiKey: apiKey, 
        baseUrl: baseUrl || "https://generativelanguage.googleapis.com" 
    });
    await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: { parts: [{ text: 'ping' }] },
        config: { maxOutputTokens: 1 }
    });
    return true;
  } catch (error) {
    console.error("API Key Validation Error:", error);
    return false;
  }
};

/**
 * Step 1: Analyze the product image(s) using Vision model
 */
export const analyzeProductImage = async (
  apiKey: string, 
  base64Images: string[], 
  settings: AdvancedSettings,
  manualInfo?: ManualProductInfo
): Promise<AnalysisReport> => {
  const ai = initAI(apiKey, settings.baseUrl);

  // Prepare image parts
  const imageParts: any[] = base64Images.map((img) => {
    const mimeMatch = img.match(/^data:(image\/[a-zA-Z+.-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const cleanBase64 = img.includes("base64,") ? img.split("base64,")[1] : img;
    return { inlineData: { mimeType, data: cleanBase64 } };
  });

  if (manualInfo?.logoBase64) {
    const img = manualInfo.logoBase64;
    const mimeMatch = img.match(/^data:(image\/[a-zA-Z+.-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const cleanBase64 = img.includes("base64,") ? img.split("base64,")[1] : img;
    imageParts.push({ inlineData: { mimeType, data: cleanBase64 } });
  }

  // --- META PROMPT STEP 1: INTELLIGENT EXTRACTION & INVENTORY BUILDING ---
  const prompt = `
    你是一位专业的品牌策略专家。请仔细分析上传的 ${base64Images.length} 张产品图片，自动提取信息。

    重要任务：你需要建立一个精准的“图片素材索引库”。
    不仅仅是描述内容，你需要判断每一张图在电商设计中的**角色 (Role)**。

    ## 自动识别项目：
    1. **图片素材索引 (Image Inventory)**：
       请按顺序分析每一张图（Index 0, 1...），并返回格式如："[角色] 内容描述"。
       **角色分类 (Role Categories)**:
       - [PRODUCT]: 产品包装、瓶身、主体 (用于主视觉)
       - [TEXTURE]: 质地、膏体、粉末、液体特写 (用于展示材质)
       - [PROCESS]: 原料、熬制过程、工厂场景、自然环境 (用于展示工艺)
       - [AUTHORITY]: 证书、奖牌、牌匾、红头文件 (用于背书)
       - [DETAIL]: 局部特写 (用于细节展示)
       
       *示例*: "Image 0: [PRODUCT] 黑色膏药罐子正面", "Image 1: [PROCESS] 正在熬制的草药锅", "Image 2: [AUTHORITY] 金色获奖牌匾"

    2. **常规品牌分析**:
       - 品牌名 (Brand Name)
       - 产品类型 (Product Type)
       - 卖点 (Selling Points)
       - 配色 (Colors)
       - 风格 (Style)

    ## 输出要求：
    **请将分析结果翻译成中文返回（JSON格式）。**
    确保用户阅读报告时是流畅的中文。
  `;

  try {
    const response = await ai.models.generateContent({
      model: settings.textModel,
      contents: {
        parts: [...imageParts, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            imageTags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Formatted inventory: '[ROLE] Description' for each image index." },
            brandName: {
              type: Type.OBJECT,
              properties: {
                chinese: { type: Type.STRING },
                english: { type: Type.STRING },
                logoStyle: { type: Type.STRING }
              }
            },
            productType: { type: Type.STRING },
            productName: { type: Type.STRING },
            productSpecs: { type: Type.STRING },
            marketingCopy: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Selling points in Chinese" },
            colors: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.ARRAY, items: { type: Type.STRING } },
                secondary: { type: Type.ARRAY, items: { type: Type.STRING } },
                styleDescription: { type: Type.STRING }
              }
            },
            designStyle: { type: Type.STRING },
            fontStyle: { type: Type.STRING },
            visualElements: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            targetAudienceAge: { type: Type.STRING },
            consumptionLevel: { type: Type.STRING },
            productMaterials: { type: Type.STRING },
            packagingMaterial: { type: Type.STRING },
            packagingStructure: { type: Type.STRING },
            packagingDesign: { type: Type.STRING },
            productCertifications: { type: Type.ARRAY, items: { type: Type.STRING } },
            visualFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
            dataMetrics: { type: Type.ARRAY, items: { type: Type.STRING } },
            usageScenario: { type: Type.STRING },
            shelfLife: { type: Type.STRING },
            brandTone: { type: Type.STRING }
          },
          required: ["brandName", "productType", "colors", "designStyle", "marketingCopy", "imageTags"]
        }
      }
    });

    if (!response.text) throw new Error("No response from AI");
    
    const rawData = JSON.parse(response.text);
    const ensureArray = (arr: any) => Array.isArray(arr) && arr.length > 0 ? arr : [];
    
    return {
        ...rawData,
        imageTags: ensureArray(rawData.imageTags),
        marketingCopy: ensureArray(rawData.marketingCopy),
        productCertifications: ensureArray(rawData.productCertifications),
        visualFeatures: ensureArray(rawData.visualFeatures),
        dataMetrics: ensureArray(rawData.dataMetrics),
        sellingPoints: ensureArray(rawData.marketingCopy)
    } as AnalysisReport;

  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Step 2: Generate the Campaign Prompts (KV Master Logic)
 * UPDATED: "Intelligent Selection" logic.
 */
export const generateCampaignPrompts = async (
  apiKey: string,
  analysis: AnalysisReport,
  config: GenerationConfig,
  settings: AdvancedSettings,
  manualInfo?: ManualProductInfo
): Promise<string> => {
  const ai = initAI(apiKey, settings.baseUrl);

  const brandName = manualInfo?.name || analysis.brandName.chinese || analysis.brandName.english || "BRAND";
  const sellingPoints = analysis.marketingCopy.join(' | ');
  
  // Construct detailed image inventory string
  const imageInventory = analysis.imageTags && analysis.imageTags.length > 0 
    ? analysis.imageTags.map((tag, idx) => `Image Index [${idx}]: ${tag}`).join('\n')
    : "Image Index [0]: [PRODUCT] Main Product Image";

  // --- STRICT SCENARIO EXECUTION LIST ---
  const scenarioExecutionList = config.selectedScenarios.map((s, i) => 
      `${i + 1}. [${s.label}]
         - 任务/模板: ${s.desc}`
  ).join('\n    ');

  // --- VISUAL & TYPO LISTS ---
  const visualStylesList = `
  □ 杂志编辑风格 (Magazine Editorial)
  □ 水彩艺术风格 (Watercolor Art)
  □ 科技未来风格 (Tech Future)
  □ 复古胶片风格 (Retro Film)
  □ 极简北欧风格 (Nordic Minimalist)
  □ 霓虹赛博风格 (Neon Cyberpunk)
  □ 自然有机风格 (Natural Organic)
  `;

  const typoStylesList = `
  □ 粗衬线大标题 + 细线装饰 + 网格对齐 (Magazine)
  □ 玻璃拟态卡片 + 半透明背景 + 柔和圆角 (Modern)
  □ 3D浮雕文字 + 金属质感 + 光影效果 (Luxury)
  □ 手写体标注 + 水彩笔触 + 不规则布局 (Artistic)
  □ 无衬线粗体 + 霓虹描边 + 发光效果 (Cyber)
  □ 极细线条字 + 大量留白 + 精确对齐 (Minimal)
  `;

  // --- LOGIC FOR STYLE SELECTION ---
  const styleInstruction = config.visualStyle === VisualStyle.AUTO
    ? `请从以下列表中智能选择一种作为全案基调: ${visualStylesList}`
    : `指定风格: ${config.visualStyle}`;

  const typoInstruction = config.typographyStyle === TypographyStyle.AUTO
    ? `请从以下列表中智能选择一种排版风格: ${typoStylesList}`
    : `指定排版: ${config.typographyStyle}`;

  // --- LANGUAGE RULES ---
  const subLanguageRule = config.subLanguage === 'none' 
    ? "Do NOT generate secondary text or slogans."
    : `生成一句简短有力的副文案 (Language: ${config.subLanguage})，必须在 Prompt 中使用 text '...' 指令渲染。`;

  const mainLanguageRule = config.mainLanguage === 'Chinese'
    ? "主标题必须是中文。在 Prompt 中使用 text '中文标题'。"
    : `Main Title MUST be in ${config.mainLanguage}.`;

  const systemInstruction = `
    你是一位世界级的电商视觉策划大师 (KV Master)。你的任务是严格执行用户的“场景拍摄清单”，生成对应的提示词。

    🔴 **Step 1: 理解素材与选图 (INTELLIGENT SELECTION)**:
    这是你目前拥有的图片素材库：
    ${imageInventory}
    
    **选图铁律 (SELECTION RULES)**:
    你必须根据海报的主题，选择**最合适**的图片索引 (Index)。
    - 如果主题是 **"工艺/Process"** -> 必须优先选择标记为 **[PROCESS]** 或 **[TEXTURE]** 的图片。**严禁**强行塞入 [PRODUCT] 包装图，除非画面需要。
    - 如果主题是 **"背书/Authority"** -> 必须选择 **[AUTHORITY]** 证书类图片。
    - 如果主题是 **"主视觉/Hero"** -> 必须选择 **[PRODUCT]** 包装图。
    *错误示范*: 在讲“古法熬制”的画面里，放了一个产品包装盒，这不合逻辑。应该放熬制的锅或膏体特写。

    🔴 **Step 2: 场景清单强制执行**:
    用户勾选了 ${config.selectedScenarios.length} 个特定场景。你必须**逐一**为它们生成提示词。
    **执行清单**:
    ${scenarioExecutionList}

    🔴 **Step 3: 风格定义**:
    ${styleInstruction}
    ${typoInstruction}

    🔴 **Step 4: 产品一致性 (CONSISTENCY)**:
    在编写 "Prompt (English)" 时，**绝对禁止**重新描述参考图的外观（如颜色、形状）。
    直接使用 "The object shown in [Image X]..." 引用它。
    让生图模型去负责还原素材，你只负责描述光影、背景和文字。

    🔴 **Step 5: 语言与排版**:
    1. ${mainLanguageRule}
    2. ${subLanguageRule}
    3. **排版字体显示**: 如果选择了中文，Prompt中的 \`text '...'\` 内容必须是中文汉字。

    🔴 **PROMPT FORMATTING RULES**:
    - **Do NOT** wrap the "Prompt (English)" content in markdown code blocks. Just output pure text.
    - **Do NOT** include aspect ratio parameters (like --ar 3:4).
    - **Do NOT** include json structure in the prompt text.

    🔴 **输出结构规范 (Markdown)**:
    请严格按照以下格式输出 ${config.selectedScenarios.length} 个模块。
    
    ## 海报[编号] | [此处填入场景清单中的Label名称]
    **创意描述 (Chinese)**: [详细描述画面、选用的素材及其理由]
    **参考图索引**: [数字, 数字] (JSON数组格式，只列出该海报真正需要的素材ID)
    **排版策略 (Chinese)**: 
    - **构图思路**: [用通俗白话描述]
    - **主标题**: [在此处写出你设计的主标题文案]
    - **副文案**: [在此处写出你设计的副文案]
    **Prompt (English)**: [用于生图的完整英文 Prompt。包含: 
      - 参考图引用: "The object shown in [Image X]..." (这里的X必须对应参考图索引)
      - 场景描述 (Background, Lighting, Mood ONLY)
      - text '主标题' ... text '副文案'
    ]
    **Negative Prompts**: [Keywords]
    ---
  `;

  const userContent = `
    开始执行任务。
    请仔细阅读我的素材库，不要乱选图。
    如果是“工艺”场景，请用原料或过程图；如果是“产品”场景，请用包装图。
    不要每一张图都把包装放进去！
  `;

  try {
    const response = await ai.models.generateContent({
      model: settings.textModel,
      contents: userContent,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, 
        maxOutputTokens: 8192,
      }
    });

    return response.text || "Failed to generate prompts.";
  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
};

/**
 * Step 3: Generate actual image
 * UPDATED: Dynamic Asset Handling (No more hardcoded [IMAGE 1])
 */
export const generatePosterImage = async (
  apiKey: string, 
  prompt: string, 
  settings: AdvancedSettings,
  aspectRatio: string = "9:16",
  referenceImageBase64s: string[] = [], 
  logoImageBase64?: string | null,
  modelRefImageBase64?: string | null
): Promise<string> => {
  const ai = initAI(apiKey, settings.baseUrl);

  const modelName = settings.imageModel.includes('flash') ? settings.imageModel : 'gemini-3-pro-image-preview';
  
  // ASPECT RATIO FALLBACK
  const supportedRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
  let targetRatio = aspectRatio;

  if (!supportedRatios.includes(aspectRatio)) {
      if (aspectRatio === "2:3" || aspectRatio === "4:5") targetRatio = "3:4";
      else if (aspectRatio === "3:2") targetRatio = "4:3";
      else if (aspectRatio === "21:9") targetRatio = "16:9";
      else targetRatio = "1:1"; 
  }

  const imageConfig: any = { aspectRatio: targetRatio };
  if (modelName === 'gemini-3-pro-image-preview') {
    imageConfig.imageSize = settings.imageSize; 
  }

  const parts: any[] = [];
  const getInlineData = (b64: string) => {
    const mimeMatch = b64.match(/^data:(image\/[a-zA-Z+.-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const cleanBase64 = b64.includes("base64,") ? b64.split("base64,")[1] : b64;
    return { mimeType, data: cleanBase64 };
  };

  // 1. Add all product reference images
  referenceImageBase64s.forEach((b64) => {
      parts.push({ inlineData: getInlineData(b64) });
  });

  // 2. Add logo if exists
  if (logoImageBase64) {
      parts.push({ inlineData: getInlineData(logoImageBase64) });
  }

  // 3. Add model ref if exists
  let modelRefIndex = -1;
  if (modelRefImageBase64) {
      parts.push({ inlineData: getInlineData(modelRefImageBase64) });
      // Calculate index: refs + logo(if any) + 1 (since indices are 1-based in prompt)
      modelRefIndex = referenceImageBase64s.length + (logoImageBase64 ? 1 : 0) + 1;
  }

  // Construct Final Prompt with DYNAMIC SUBJECT LOCKING
  let finalPrompt = prompt;
  
  // Instructions for Reference Images
  if (referenceImageBase64s.length > 0) {
      let refDesc = "";
      referenceImageBase64s.forEach((_, idx) => {
          // IMPORTANT: We tell the model that THESE images are the specific assets for THIS generation
          refDesc += `[IMAGE ${idx + 1}] is a Reference Asset for this composition.\n`;
      });
      
      const logoIndex = referenceImageBase64s.length + 1;

      // --- DYNAMIC CONSISTENCY PROMPT ---
      finalPrompt = `
      ${refDesc}
      ${logoImageBase64 ? `[IMAGE ${logoIndex}] is the BRAND LOGO.` : ''}
      
      🔴 **MANDATORY INSTRUCTION: ASSET FIDELITY**
      The images provided above are the ACTUAL ASSETS you must use.
      - If the prompt refers to "The object shown in [Image 1]", use [Image 1] EXACTLY as it appears.
      - Do NOT redesign the reference objects.
      - Do NOT hallucinate new packaging if a reference image is provided.
      
      SCENE DESCRIPTION:
      ${prompt}

      ${logoImageBase64 ? `Composite LOGO from [IMAGE ${logoIndex}] in a suitable position.` : ''}
      `;
  }

  // Instructions for Model Consistency
  if (modelRefImageBase64 && modelRefIndex > -1) {
      finalPrompt += `
      
      🔴 **MANDATORY INSTRUCTION: HUMAN IDENTITY CONSISTENCY**
      [IMAGE ${modelRefIndex}] is the REFERENCE FACE for the human model.
      - Any human figures generated in this image MUST share the SAME facial features, age, ethnicity, and general appearance as the person in [IMAGE ${modelRefIndex}].
      - Prioritize facial resemblance to [IMAGE ${modelRefIndex}] above all other character descriptions.
      `;
  }

  parts.push({ text: finalPrompt });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: { imageConfig: imageConfig }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};
