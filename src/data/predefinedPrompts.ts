export interface PredefinedPrompt {
  id: string
  name: string
  shortDescription: string
  prompt: string
  category: 'linkedin' | 'business' | 'transcription' | 'meeting' | 'interview' | 'lecture' | 'podcast' | 'analysis' | 'custom'
}

export const predefinedPrompts: PredefinedPrompt[] = [
  {
    id: 'linkedin-storyteller',
    name: 'LinkedIn Storyteller',
    shortDescription: 'Transform your voice into engaging LinkedIn posts',
    prompt: `You are a master LinkedIn storyteller. Transform this voice content into a compelling, professional LinkedIn post that follows these principles:

**Structure & Format:**
- Start with a hook that grabs attention
- Use short paragraphs (2-3 lines max)
- Include relevant hashtags at the end
- Keep it under 1300 characters
- Use emojis strategically (but not excessively)

**Content Guidelines:**
- Extract the most valuable insights from the voice content
- Focus on actionable takeaways
- Use storytelling techniques to make it engaging
- Maintain a professional yet conversational tone
- End with a question or call-to-action to encourage engagement

**Style:**
- Write in first person when appropriate
- Use bullet points or numbered lists for key points
- Include specific examples or data when mentioned
- Make it shareable and valuable for your network

Transform this voice content into a LinkedIn post that would get high engagement and shares.`,
    category: 'linkedin'
  },
  {
    id: 'business-article-writer',
    name: 'Business Article Writer',
    shortDescription: 'Convert voice to professional business articles',
    prompt: `You are an expert business writer. Transform this voice content into a well-structured, professional business article that follows these guidelines:

**Article Structure:**
- Compelling headline that captures the main point
- Strong opening paragraph that hooks the reader
- Clear sections with descriptive subheadings
- Conclusion that summarizes key takeaways
- Professional tone suitable for business audiences

**Content Development:**
- Expand on the main ideas from the voice content
- Add relevant business context and examples
- Include actionable insights and recommendations
- Use data and statistics when mentioned
- Maintain logical flow between sections

**Writing Style:**
- Professional yet accessible language
- Clear, concise sentences
- Use of bullet points and lists for key information
- Engaging storytelling techniques
- SEO-friendly structure

Create a business article that would be suitable for publication on professional platforms or company blogs.`,
    category: 'business'
  },
  {
    id: 'meeting-minutes',
    name: 'Meeting Minutes',
    shortDescription: 'Organize voice content into structured meeting notes',
    prompt: `Transform this voice content into professional meeting minutes that follow this structure:

**Meeting Minutes Format:**
- Meeting Title and Date
- Attendees (if mentioned)
- Key Discussion Points
- Action Items with Assignees
- Decisions Made
- Next Steps
- Follow-up Items

**Content Organization:**
- Extract main discussion topics
- Identify decisions and conclusions
- Note any deadlines or timeframes mentioned
- Highlight important announcements
- Capture questions and concerns raised

**Professional Standards:**
- Use clear, objective language
- Organize information logically
- Include relevant context and background
- Maintain professional tone
- Ensure actionability of next steps

Format this voice content into comprehensive meeting minutes that would be suitable for distribution to stakeholders.`,
    category: 'meeting'
  },
  {
    id: 'interview-transcript',
    name: 'Interview Transcript',
    shortDescription: 'Format voice content as interview documentation',
    prompt: `Transform this voice content into a professional interview transcript with the following structure:

**Transcript Format:**
- Clear speaker identification (if multiple speakers)
- Timestamps for key moments (if timing is relevant)
- Proper paragraph breaks for readability
- Q&A format when appropriate
- Key quotes highlighted

**Content Enhancement:**
- Maintain the authentic voice and tone
- Clarify any unclear statements
- Add context where helpful
- Preserve important details and examples
- Organize information logically

**Professional Presentation:**
- Clean, readable formatting
- Consistent structure throughout
- Professional language standards
- Easy to reference and quote
- Suitable for documentation purposes

Create a transcript that accurately represents the original content while being easy to read and reference.`,
    category: 'interview'
  },
  {
    id: 'lecture-notes',
    name: 'Lecture Notes',
    shortDescription: 'Organize voice content into structured lecture notes',
    prompt: `Transform this voice content into well-organized lecture notes that follow this structure:

**Lecture Notes Format:**
- Main Topic and Key Concepts
- Important Definitions and Terms
- Key Examples and Case Studies
- Summary of Main Points
- Questions for Further Study

**Content Organization:**
- Identify the main learning objectives
- Extract key concepts and definitions
- Note important examples and illustrations
- Highlight critical information
- Organize information in logical sequence

**Study-Friendly Features:**
- Clear headings and subheadings
- Bullet points for key information
- Space for additional notes
- Easy to review and study
- Professional academic format

Create lecture notes that would be valuable for students and professionals studying this topic.`,
    category: 'lecture'
  },
  {
    id: 'podcast-summary',
    name: 'Podcast Summary',
    shortDescription: 'Create engaging podcast episode summaries',
    prompt: `Transform this voice content into an engaging podcast episode summary that includes:

**Summary Structure:**
- Episode Title and Key Theme
- Main Topics Covered
- Key Takeaways and Insights
- Notable Quotes or Moments
- Recommended Action Steps

**Content Highlights:**
- Extract the most compelling points
- Identify memorable quotes or stories
- Note any surprising revelations
- Highlight practical advice given
- Capture the overall tone and energy

**Engagement Elements:**
- Hook readers in the first paragraph
- Use engaging language and storytelling
- Include relevant hashtags or tags
- Encourage listeners to engage
- Make it shareable on social media

Create a summary that would make someone want to listen to the full episode and share it with others.`,
    category: 'podcast'
  },
  {
    id: 'content-analyzer',
    name: 'Content Analyzer',
    shortDescription: 'Deep analysis and insights from voice content',
    prompt: `You are a content analyst. Provide a comprehensive analysis of this voice content that includes:

**Content Analysis:**
- Main themes and key messages
- Target audience identification
- Content structure and flow
- Strengths and areas for improvement
- Strategic recommendations

**Insight Generation:**
- Extract actionable insights
- Identify patterns or trends
- Note any gaps or opportunities
- Provide strategic context
- Suggest next steps or actions

**Professional Assessment:**
- Objective, analytical perspective
- Data-driven observations
- Industry context when relevant
- Clear, actionable feedback
- Professional recommendations

Provide a thorough analysis that would be valuable for content creators, marketers, or business professionals.`,
    category: 'analysis'
  },
  {
    id: 'basic-transcription',
    name: 'Basic Transcription',
    shortDescription: 'Simple voice-to-text conversion',
    prompt: 'Please transcribe this voice content into clear, readable text format. Maintain the original content and structure.',
    category: 'transcription'
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
