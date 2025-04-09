import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { fetchArticles, saveArticle, summarizeArticle, AVAILABLE_CATEGORIES, type Article as NewsArticle } from '../services/newsService';

interface Article extends NewsArticle {
  sentiment?: 'positive' | 'negative' | 'neutral';
  is_read: boolean;
  is_saved: boolean;
  summary?: string;
  isSummarizing?: boolean;
}

const NewsFeed = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadArticles(selectedCategory);
  }, [selectedCategory]);

  const loadArticles = async (category?: string) => {
    try {
      setIsLoading(true);
      const fetchedArticles = await fetchArticles({
        category: category || undefined
      });
      
      // Transform the articles to match our UI needs
      const processedArticles = fetchedArticles.map((article) => ({
        ...article,
        sentiment: getSentimentFromContent(article.description || article.content || ''),
        is_read: false,
        is_saved: false,
        summary: '',
        isSummarizing: false,
      }));
      
      setArticles(processedArticles);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error('Failed to fetch articles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
  };

  // Simple sentiment analysis based on content
  const getSentimentFromContent = (content: string): 'positive' | 'negative' | 'neutral' => {
    const positiveWords = ['surge', 'gain', 'rise', 'improve', 'positive', 'up', 'growth'];
    const negativeWords = ['plunge', 'dive', 'meltdown', 'fall', 'negative', 'down', 'nosedive', 'backlash'];
    
    content = content.toLowerCase();
    
    const positiveCount = positiveWords.filter(word => content.includes(word)).length;
    const negativeCount = negativeWords.filter(word => content.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  const handleMarkAsRead = (articleId: string) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === articleId ? { ...article, is_read: !article.is_read } : article
      )
    );
    toast.success('Article marked as read');
  };

  const handleSaveArticle = async (articleId: string) => {
    try {
      // Find the article to save
      const articleToSave = articles.find(article => article.id === articleId);
      if (!articleToSave) {
        toast.error('Article not found');
        return;
      }

      // Show loading toast
      const toastId = toast.loading('Saving article...');

      // Call the backend API to save the article
      await saveArticle(articleToSave);
      
      // Update UI state
      setArticles(prev =>
        prev.map(article =>
          article.id === articleId ? { ...article, is_saved: true } : article
        )
      );
      
      toast.success('Article saved successfully', { id: toastId });
    } catch (error) {
      console.error('Failed to save article:', error);
      toast.error(`Failed to save article: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSummarizeArticle = async (articleId: string) => {
    try {
      // Find the article to summarize
      const articleToSummarize = articles.find(article => article.id === articleId);
      if (!articleToSummarize) {
        toast.error('Article not found');
        return;
      }

      // Set summarizing state to true
      setArticles(prev => 
        prev.map(article => 
          article.id === articleId ? { ...article, isSummarizing: true } : article
        )
      );

      // Call the summarize API
      const toastId = toast.loading('Generating summary...');
      console.log('Summarizing article:', articleToSummarize.title);
      
      const summary = await summarizeArticle(articleToSummarize);
      console.log('Summary received:', summary);

      if (!summary || summary === 'No summary available') {
        toast.error('Could not generate summary for this article', { id: toastId });
        setArticles(prev => 
          prev.map(article => 
            article.id === articleId ? { ...article, isSummarizing: false } : article
          )
        );
        return;
      }

      // Update the article with the summary
      setArticles(prev => 
        prev.map(article => 
          article.id === articleId ? { ...article, summary, isSummarizing: false } : article
        )
      );

      toast.success('Article summarized successfully', { id: toastId });
    } catch (error) {
      console.error('Error summarizing article:', error);
      toast.error(`Failed to summarize article: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Reset the summarizing state
      setArticles(prev => 
        prev.map(article => 
          article.id === articleId ? { ...article, isSummarizing: false } : article
        )
      );
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your News Feed</h1>
        
        {/* Category Filter */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-2">Filter by Category</h2>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <span className="capitalize">{category}</span>
              </button>
            ))}
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory('')}
                className="px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-600">
            {selectedCategory 
              ? `No articles found in the "${selectedCategory}" category. Try another category or clear the filter.` 
              : 'No articles found. Check back later for news updates.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {articles.map((article) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{article.title}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(
                    article.sentiment
                  )}`}
                >
                  {article.sentiment}
                </span>
              </div>
              
              {article.image && (
                <div className="mb-4 overflow-hidden rounded-lg">
                  <img 
                    src={article.image} 
                    alt={article.title} 
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <p className="text-gray-600 mb-4">
                {article.description || article.content?.substring(0, 300)}
                {(article.description?.length > 300 || (article.content && article.content.length > 300)) && '...'}
              </p>
              
              {article.summary && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="text-md font-semibold text-blue-800 mb-2">Summary</h3>
                  <p className="text-sm text-blue-800">{article.summary}</p>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {article.author && (
                    <span className="font-medium mr-2">{article.author}</span>
                  )}
                  <span className="font-medium">{article.source}</span>
                  {article.published_at && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{formatDate(article.published_at)}</span>
                    </>
                  )}
                  {article.category && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="capitalize">{article.category}</span>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMarkAsRead(article.id!)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      article.is_read
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-primary-100 text-primary-800'
                    }`}
                  >
                    {article.is_read ? 'Read' : 'Mark as Read'}
                  </button>
                  <button
                    onClick={() => handleSummarizeArticle(article.id!)}
                    disabled={article.isSummarizing}
                    className={`px-4 py-2 rounded-md text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {article.isSummarizing ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Summarizing...
                      </span>
                    ) : (
                      'Summarize'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsFeed; 