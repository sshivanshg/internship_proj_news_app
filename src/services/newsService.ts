interface Article {
  id?: string;
  title: string;
  url: string | null;
  description: string;
  content?: string;
  source: string;
  author: string | null;
  image: string | null;
  category: string;
  language: string;
  country: string;
  published_at: string | null;
}

interface ApiResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: Article[];
}

interface FetchArticlesOptions {
  category?: string;
  limit?: number;
  offset?: number;
}

export async function fetchArticles(options: FetchArticlesOptions = {}): Promise<Article[]> {
  try {
    // Build query parameters based on provided options
    const queryParams = new URLSearchParams();
    
    if (options.category) {
      queryParams.append('category', options.category);
    }
    
    if (options.limit) {
      queryParams.append('limit', options.limit.toString());
    }
    
    if (options.offset) {
      queryParams.append('offset', options.offset.toString());
    }
    
    // Construct the URL with query parameters if any exist
    const queryString = queryParams.toString();
    const url = `https://n8n-dev.subspace.money/webhook/article${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching news: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle the new API response format
    if (data.data && Array.isArray(data.data)) {
      // Add unique IDs if not provided by the API
      return data.data.map((article: any, index: number) => ({
        ...article,
        id: article.id || `${index}-${Date.now()}`,
        content: article.description // Map description to content for backward compatibility
      }));
    } 
    
    // Handle the old response format or single article case
    if (Array.isArray(data)) {
      return data;
    }
    
    // If it's a single article with the new format
    if (data.data && !Array.isArray(data.data)) {
      const article = {
        ...data.data,
        id: data.data.id || `single-${Date.now()}`,
        content: data.data.description
      };
      return [article];
    }
    
    // If it's a single article with the old format
    return [data];
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    throw error;
  }
}

export async function fetchArticleById(id: string): Promise<Article> {
  try {
    const response = await fetch(`https://n8n-dev.subspace.money/webhook/article?id=${id}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching article: ${response.status}`);
    }
    
    const data = await response.json();
    
    // If the response is in the new format
    if (data.data) {
      const article = {
        ...data.data,
        id: data.data.id || id,
        content: data.data.description
      };
      return article;
    }
    
    // Old format
    return data;
  } catch (error) {
    console.error(`Failed to fetch article with id ${id}:`, error);
    throw error;
  }
}

export async function summarizeArticle(article: Article): Promise<string> {
  try {
    // Change endpoint from webhook-test to webhook to match other API calls
    const response = await fetch('https://n8n-dev.subspace.money/webhook/summarise', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Send the entire article object to ensure all necessary data is available
        article: {
          content: article.description || article.content || '',
          title: article.title,
          url: article.url,
          source: article.source,
          category: article.category
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Error summarizing article: ${response.status}`);
    }

    const data = await response.json();
    // Check for summary in different possible response formats
    return data.content || data.summary || data.result || 'No summary available';
  } catch (error) {
    console.error('Failed to summarize article:', error);
    throw error;
  }
}

export const AVAILABLE_CATEGORIES = [
  'general', 
  'business', 
  'entertainment', 
  'health', 
  'science', 
  'sports', 
  'technology'
];

export { type Article, type ApiResponse, type FetchArticlesOptions }; 