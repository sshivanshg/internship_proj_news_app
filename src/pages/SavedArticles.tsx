import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { fetchArticles, summarizeArticle, type Article as NewsArticle } from '../services/newsService';

interface Article extends NewsArticle {
  sentiment?: 'positive' | 'negative' | 'neutral';
  is_read: boolean;
  is_saved: boolean;
  summary?: string;
  isSummarizing?: boolean;
}

const SavedArticles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSavedArticles();
  }, []);

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

  const fetchSavedArticles = async () => {
    try {
      setIsLoading(true);
      // In a real app, you would fetch only saved articles from the backend
      // For now, we'll fetch all and filter client-side
      const fetchedArticles = await fetchArticles();
      
      // Transform and mark all as saved for demo purposes
      // In a real app, you would have this information from the backend
      const processedArticles = fetchedArticles.map((article) => ({
        ...article,
        sentiment: getSentimentFromContent(article.description || article.content || ''),
        is_read: false,
        is_saved: true,
        summary: '',
        isSummarizing: false,
      }));
      
      setArticles(processedArticles);
    } catch (error) {
      console.error('Failed to fetch saved articles:', error);
      toast.error('Failed to fetch saved articles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromSaved = (articleId: string) => {
    setArticles((prev) => prev.filter((article) => article.id !== articleId));
    toast.success('Article removed from saved items');
  };

  const handleSummarizeArticle = async (articleId: string) => {
    try {
      // Find the article to summarize
      const articleToSummarize = articles.find(article => article.id === articleId);
      if (!articleToSummarize) return;

      // Set summarizing state to true
      setArticles(prev => 
        prev.map(article => 
          article.id === articleId ? { ...article, isSummarizing: true } : article
        )
      );

      // Call the summarize API
      const summary = await summarizeArticle(articleToSummarize);

      // Update the article with the summary
      setArticles(prev => 
        prev.map(article => 
          article.id === articleId ? { ...article, summary, isSummarizing: false } : article
        )
      );

      toast.success('Article summarized successfully');
    } catch (error) {
      console.error('Error summarizing article:', error);
      toast.error('Failed to summarize article');
      
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

  if (articles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Saved Articles</h1>
        <p className="text-gray-600">You haven't saved any articles yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Saved Articles</h1>
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
                  onClick={() => handleRemoveFromSaved(article.id!)}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200"
                >
                  Remove
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
    </div>
  );
};

export default SavedArticles; 