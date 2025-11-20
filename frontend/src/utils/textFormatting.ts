export interface FormattedSection {
  id: string;
  type: 'title' | 'subtitle' | 'content' | 'bullet-list' | 'highlight';
  content: string;
  level?: number; // For hierarchical titles
  items?: string[]; // For bullet lists
}

export interface FormattedSummary {
  sections: FormattedSection[];
  metadata: {
    totalSections: number;
    hasBulletPoints: boolean;
    hasTitles: boolean;
    wordCount: number;
  };
}

/**
 * Parse and format summary text for enhanced display
 */
export function formatSummaryText(summaryText: string): FormattedSummary {
  if (!summaryText || typeof summaryText !== 'string') {
    return {
      sections: [{ id: 'default', type: 'content', content: summaryText || 'No summary available' }],
      metadata: { totalSections: 1, hasBulletPoints: false, hasTitles: false, wordCount: 0 }
    };
  }

  const lines = summaryText.split('\n').filter(line => line.trim());
  const sections: FormattedSection[] = [];
  let currentSection: FormattedSection | null = null;
  let bulletPoints: string[] = [];

  // Process each line
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) return;

    // Detect headings and titles
    if (isHeading(trimmedLine)) {
      // Save any accumulated bullet points before starting new section
      if (bulletPoints.length > 0) {
        sections.push({
          id: `bullets-${index}`,
          type: 'bullet-list',
          content: '',
          items: [...bulletPoints]
        });
        bulletPoints = [];
      }

      const titleLevel = getHeadingLevel(trimmedLine);
      const sectionType = titleLevel <= 2 ? 'title' : 'subtitle';

      currentSection = {
        id: `heading-${index}`,
        type: sectionType,
        content: cleanHeading(trimmedLine),
        level: titleLevel
      };
      sections.push(currentSection);
    }
    // Detect bullet points
    else if (isBulletPoint(trimmedLine)) {
      const bulletContent = extractBulletContent(trimmedLine);
      bulletPoints.push(bulletContent);
    }
    // Regular content
    else {
      // Save any accumulated bullet points
      if (bulletPoints.length > 0) {
        sections.push({
          id: `bullets-${index}`,
          type: 'bullet-list',
          content: '',
          items: [...bulletPoints]
        });
        bulletPoints = [];
      }

      const cleanContent = trimmedLine;

      // Check for important terms to highlight
      const highlightedContent = highlightImportantTerms(cleanContent);

      if (highlightedContent.includes('<mark>')) {
        sections.push({
          id: `highlight-${index}`,
          type: 'highlight',
          content: highlightedContent
        });
      } else {
        sections.push({
          id: `content-${index}`,
          type: 'content',
          content: cleanContent
        });
      }
    }
  });

  // Don't forget the last set of bullet points
  if (bulletPoints.length > 0) {
    sections.push({
      id: `bullets-final`,
      type: 'bullet-list',
      content: '',
      items: bulletPoints
    });
  }

  // Generate smart titles if none exist
  if (!sections.some(s => s.type === 'title')) {
    sections.unshift(...generateSmartTitles(summaryText));
  }

  const metadata = {
    totalSections: sections.length,
    hasBulletPoints: sections.some(s => s.type === 'bullet-list'),
    hasTitles: sections.some(s => s.type === 'title' || s.type === 'subtitle'),
    wordCount: countWords(summaryText)
  };

  return { sections, metadata };
}

/**
 * Check if a line is a heading
 */
function isHeading(line: string): boolean {
  const trimmed = line.trim();

  // All caps lines
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !isBulletPoint(trimmed)) {
    return true;
  }

  // Lines ending with colon
  if (trimmed.endsWith(':')) {
    return true;
  }

  // Lines with common section patterns
  const headingPatterns = [
    /^(introduction|summary|conclusion|background|overview|findings|recommendations)/i,
    /^(chapter|section|part)\s+\d+/i,
    /^\d+\./,
    /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s*:$/
  ];

  return headingPatterns.some(pattern => pattern.test(trimmed));
}

/**
 * Determine heading level (1-6, where 1 is most important)
 */
function getHeadingLevel(line: string): number {
  const trimmed = line.trim();

  // All caps or single word + colon = level 1
  if (trimmed === trimmed.toUpperCase() && trimmed.length < 50) {
    return 1;
  }

  // Ends with colon = level 2
  if (trimmed.endsWith(':')) {
    return 2;
  }

  // Numbered headings = level 3
  if (/^\d+\./.test(trimmed)) {
    return 3;
  }

  // Common section words = level 4
  if (/^(introduction|summary|conclusion|background|overview)/i.test(trimmed)) {
    return 4;
  }

  return 5; // Default level
}

/**
 * Clean heading text
 */
function cleanHeading(heading: string): string {
  return heading.replace(/[:\s]+$/, '').trim();
}

/**
 * Check if a line is a bullet point
 */
function isBulletPoint(line: string): boolean {
  const trimmed = line.trim();
  const bulletPatterns = [
    /^[•\-\*]\s/, // Bullet characters
    /^\d+[\.\)]\s/, // Numbered lists
    /^[a-zA-Z][\.\)]\s/, // Lettered lists
    /^\s*►\s/, // Triangle bullets
    /^\s*▸\s/ // Filled triangle bullets
  ];

  return bulletPatterns.some(pattern => pattern.test(trimmed));
}

/**
 * Extract content from bullet point
 */
function extractBulletContent(bullet: string): string {
  return bullet.replace(/^[•\-\*\d\.\)►▸a-zA-Z][\.\)]?\s*/, '').trim();
}

/**
 * Highlight important terms in text
 */
function highlightImportantTerms(text: string): string {
  // Pattern for dates, numbers, money, percentages, years
  const importantPatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // Dates
    /\$\d+(?:,\d{3})*(?:\.\d{2})?/g, // Money
    /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:billion|million|thousand|trillion)\b/gi, // Large numbers
    /\b\d{1,3}%\b/g, // Percentages
    /\b(19|20)\d{2}\b/g, // Years
    /\b[A-Z]{2,}\b/g, // Acronyms
  ];

  let highlightedText = text;

  importantPatterns.forEach(pattern => {
    highlightedText = highlightedText.replace(pattern, '<mark>$&</mark>');
  });

  return highlightedText;
}

/**
 * Generate smart titles for content without explicit headings
 */
function generateSmartTitles(content: string): FormattedSection[] {
  const sections: FormattedSection[] = [];
  const wordCount = countWords(content);

  // Generate a main title based on content analysis
  const mainTitle = generateMainTitle(content);
  if (mainTitle) {
    sections.push({
      id: 'generated-title',
      type: 'title',
      content: mainTitle,
      level: 1
    });
  }

  // If content is long, generate subsections
  if (wordCount > 100) {
    const subsections = generateSubsections(content);
    sections.push(...subsections);
  }

  return sections;
}

/**
 * Generate a main title based on content analysis
 */
function generateMainTitle(content: string): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());

  if (sentences.length === 0) return 'Summary';

  // Look for key themes or topics
  const firstSentence = sentences[0].trim();

  // If first sentence is short and descriptive, use it as title
  if (firstSentence.length < 80 && !isBulletPoint(firstSentence)) {
    return firstSentence;
  }

  // Default titles based on content characteristics
  if (content.toLowerCase().includes('conclusion')) {
    return 'Key Conclusions';
  } else if (content.toLowerCase().includes('recommendation')) {
    return 'Recommendations';
  } else if (content.toLowerCase().includes('finding')) {
    return 'Key Findings';
  } else if (content.toLowerCase().includes('summary')) {
    return 'Summary Overview';
  }

  return 'Document Summary';
}

/**
 * Generate subsections based on content themes
 */
function generateSubsections(content: string): FormattedSection[] {
  const sections: FormattedSection[] = [];

  // Simple heuristic: look for topic shifts
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  if (paragraphs.length > 2) {
    sections.push({
      id: 'generated-subtitle-1',
      type: 'subtitle',
      content: 'Main Points',
      level: 2
    });

    sections.push({
      id: 'generated-subtitle-2',
      type: 'subtitle',
      content: 'Additional Details',
      level: 2
    });
  }

  return sections;
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Get typography variant based on section type and level
 */
export function getTypographyVariant(type: string, level?: number): 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'overline' {
  switch (type) {
    case 'title':
      switch (level) {
        case 1: return 'h4';
        case 2: return 'h5';
        default: return 'h6';
      }
    case 'subtitle':
      return level && level <= 2 ? 'h6' : 'subtitle1';
    case 'content':
      return 'body1';
    case 'highlight':
      return 'body1';
    case 'bullet-list':
      return 'body1';
    default:
      return 'body1';
  }
}

/**
 * Get styling properties for a section
 */
export function getSectionStyles(type: string, level?: number) {
  const baseStyles = {
    mb: 1,
    lineHeight: 1.6
  };

  switch (type) {
    case 'title':
      return {
        ...baseStyles,
        fontWeight: 'bold',
        fontSize: level === 1 ? '20px' : '18px',
        mb: 2,
        mt: level === 1 ? 0 : 3
      };
    case 'subtitle':
      return {
        ...baseStyles,
        fontWeight: 'bold',
        fontSize: '16px',
        mb: 1.5,
        mt: 2
      };
    case 'content':
      return {
        ...baseStyles,
        mb: 1.5
      };
    case 'bullet-list':
      return {
        ...baseStyles,
        ml: 2,
        mb: 1
      };
    case 'highlight':
      return {
        ...baseStyles,
        mb: 1.5
      };
    default:
      return baseStyles;
  }
}