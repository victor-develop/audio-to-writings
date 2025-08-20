export interface PredefinedPrompt {
  id: string
  name: string
  shortDescription: string
  prompt: string
  category: 'transcription' | 'summary' | 'analysis' | 'custom'
}

export const predefinedPrompts: PredefinedPrompt[] = [
  {
    id: 'basic-transcription',
    name: 'Basic Transcription',
    shortDescription: 'Simple audio to text conversion',
    prompt: 'Please transcribe this audio recording into text format. Maintain the original content and structure.',
    category: 'transcription'
  },
  {
    id: 'meeting-minutes',
    name: 'Meeting Minutes',
    shortDescription: 'Convert meeting audio to structured minutes',
    prompt: `Please transcribe this meeting recording and format it as meeting minutes with:
- Key discussion points
- Action items
- Decisions made
- Attendees mentioned (if any)`,
    category: 'summary'
  },
  {
    id: 'interview-transcript',
    name: 'Interview Transcript',
    shortDescription: 'Professional interview transcription with speaker identification',
    prompt: `Please transcribe this interview recording with:
- Speaker identification (Interviewer/Interviewee)
- Timestamps for key moments
- Clear formatting for easy reading
- Maintain the conversational flow`,
    category: 'transcription'
  },
  {
    id: 'lecture-notes',
    name: 'Lecture Notes',
    shortDescription: 'Academic lecture to structured notes',
    prompt: `Please transcribe this lecture and organize it as:
- Main topics and subtopics
- Key concepts and definitions
- Important examples mentioned
- Questions raised during the lecture`,
    category: 'analysis'
  },
  {
    id: 'podcast-summary',
    name: 'Podcast Summary',
    shortDescription: 'Podcast episode to summary with key points',
    prompt: `Please transcribe this podcast and provide:
- A brief summary (2-3 sentences)
- Key topics discussed
- Notable quotes or insights
- Main takeaways`,
    category: 'summary'
  },
  {
    id: 'linkedin-storyteller',
    name: 'LinkedIn Corporate Storyteller',
    shortDescription: 'Transform interviews into 5 professional LinkedIn posts for employer branding',
    prompt: `### 角色

你是一位资深的**企业故事讲述者（Corporate Storyteller）** 和 **领英（LinkedIn）雇主品牌专家**。你深知如何将员工的个人经历和深刻见解，转化为符合 LinkedIn 平台调性的、能够引发专业人士共鸣并提升公司雇主品牌形象的高质量内容。

### 核心任务

你的核心任务是根据下面提供的【访谈对话内容】，创作出 **5篇** 风格各异、角度不同的 LinkedIn 帖子。

### **‼️ 内容真实性最高准则 (CRITICAL RULE: Factual Grounding) ‼️**

**所有帖子的核心内容、故事、观点、引言和数据，都必须严格、真实地来源于下方【访谈对话内容】。严禁虚构、编造或在原文基础上进行不符事实的过度引申。你的任务是"提炼、重组和包装"访谈中的客观事实，而不是"创作"新内容。**

### 输入

【访谈对话内容】：[请在此处粘贴你和优秀同事的访谈对话文字记录]
【分享者信息】：

- 姓名：[例如：Jane]
- 职位：[例如：PMO]

### 输出要求

1. **数量与方向**: 严格生成 **5篇** 独立的帖子，每篇聚焦于以下一个不同的方向：
    - **方向一：职业生涯反思 (Career Journey Reflection)**: **从访谈中提炼**出分享者职业生涯的关键阶段和经验清单。
    - **方向二：深刻洞见 (Deep Insight / "What I Wish I Knew")**: **挖掘访谈中提到的**、分享者在实践中学到的深刻行业或职业教训。
    - **方向三：方法论与框架 (Actionable Framework)**: **从访谈描述的解决问题过程中，归纳并提炼出**一个可供他人借鉴的、结构化的方法或思维框架。
    - **方向四：情感故事与人性化时刻 (Emotional Story)**: **从访谈中选取**一个具体的、能展现工作中的人性化一面或关键转折点的真实故事。
    - **方向五：价值观与公司文化 (Why Our Company?)**: **根据访谈内容**，将分享者的个人价值观与公司文化相结合，阐述访谈中提到的、为什么这里是实现职业抱负的理想之地的具体原因。
2. **语言与翻译流程**:
    - **第一步：用中文创作**。首先，基于中文访谈内容，用中文构思并写出最贴合原意的帖子草稿。
    - **第二步：翻译并优化为地道英文**。将中文草稿翻译成专业、地道的英文。
3. **格式**: 每篇英文帖子都必须包含三个部分：
    - **【Hook (挂钩)】**: 开头 1-2 句。
    - **【Body (正文)】**: 结构清晰，多使用短段落、数字/符号列表。
    - **【Call to Action & Hashtags (号召与标签)】**: 结尾部分。
4. **字符数**: 正文部分控制在 **2500 字符**以内。`,
    category: 'analysis'
  },
  {
    id: 'custom-prompt',
    name: 'Custom Prompt',
    shortDescription: 'Use your own custom prompt',
    prompt: '',
    category: 'custom'
  }
]

export const getPromptById = (id: string): PredefinedPrompt | undefined => {
  return predefinedPrompts.find(prompt => prompt.id === id)
}

export const getPromptsByCategory = (category: PredefinedPrompt['category']): PredefinedPrompt[] => {
  return predefinedPrompts.filter(prompt => prompt.category === category)
}
