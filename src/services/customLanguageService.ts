interface CustomLanguage {
  name: string;
  extension: string;
  keywords: Record<string, string>;
}

class CustomLanguageService {
  private static readonly STORAGE_KEY = 'pyzun_custom_languages';

  static saveLanguage(language: CustomLanguage): void {
    const languages = this.getLanguages();
    const languageId = `custom_${language.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    languages[languageId] = language;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(languages));
  }

  static getLanguages(): Record<string, CustomLanguage> {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  static deleteLanguage(languageId: string): void {
    if (typeof window === 'undefined') return;
    
    const languages = this.getLanguages();
    delete languages[languageId];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(languages));
  }

  static translateCode(code: string, language: CustomLanguage): string {
    let translatedCode = code;
    
    // Only translate if there are keywords defined
    if (Object.keys(language.keywords).length > 0) {
      // Sort keywords by length (longest first) to avoid partial replacements
      const sortedKeywords = Object.entries(language.keywords)
        .sort(([a], [b]) => b.length - a.length);

      for (const [customKeyword, pythonKeyword] of sortedKeywords) {
        // Use word boundaries to ensure we only replace whole words
        const regex = new RegExp(`\\b${this.escapeRegExp(customKeyword)}\\b`, 'g');
        translatedCode = translatedCode.replace(regex, pythonKeyword);
      }
    }

    return translatedCode;
  }

  static getDefaultCode(language: CustomLanguage): string {
    // Create a simple hello world program using the custom language
    const printKeyword = Object.entries(language.keywords)
      .find(([, pythonKeyword]) => pythonKeyword === 'print')?.[0] || 'print';
    
    return `${printKeyword}("Hello, World!")
${printKeyword}("Welcome to ${language.name}!")`;
  }

  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static isCustomLanguage(languageId: string): boolean {
    return languageId.startsWith('custom_');
  }

  static getCustomLanguage(languageId: string): CustomLanguage | null {
    const languages = this.getLanguages();
    return languages[languageId] || null;
  }
}

export default CustomLanguageService;
export type { CustomLanguage };