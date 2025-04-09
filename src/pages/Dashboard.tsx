import { useState, useEffect } from 'react';
import { useUserData } from '@nhost/react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { fetchArticles, AVAILABLE_CATEGORIES, type Article } from '../services/newsService';

interface Preferences {
  topics: string[];
  keywords: string[];
  sources: string[];
  categories: string[];
}

interface NewsStats {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
}

const AVAILABLE_TOPICS = ['Technology', 'Sports', 'Health', 'Business', 'Entertainment', 'Science'];
const AVAILABLE_SOURCES = ['CNN', 'BBC', 'Reuters', 'AP News', 'The Guardian', 'New York Times'];

const Dashboard = () => {
  const user = useUserData();
  const [preferences, setPreferences] = useState<Preferences>({
    topics: [],
    keywords: [],
    sources: [],
    categories: [],
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newsSummary, setNewsSummary] = useState<Article[]>([]);
  const [newsStats, setNewsStats] = useState<NewsStats>({ total: 0, positive: 0, negative: 0, neutral: 0 });
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    // Fetch user preferences
    const fetchPreferences = async () => {
      try {
        // Simulated API call
        const response = await fetch('YOUR_HASURA_ENDPOINT', {
          headers: {
            Authorization: `Bearer ${user?.id}`,
          },
        });
        const data = await response.json();
        setPreferences(data.preferences || { topics: [], keywords: [], sources: [], categories: [] });
      } catch (error) {
        console.error('Error fetching preferences:', error);
      }
    };

    // Fetch latest news
    const fetchNewsSummary = async () => {
      try {
        setIsLoadingNews(true);
        // Use the selected category if available
        const articles = await fetchArticles({
          category: selectedCategory || undefined
        });
        
        // Get just the latest 3 articles for the summary
        const latestArticles = articles.slice(0, 3);
        setNewsSummary(latestArticles);
        
        // Calculate stats for sentiment analysis
        const stats = calculateNewsStats(articles);
        setNewsStats(stats);
      } catch (error) {
        console.error('Error fetching news summary:', error);
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchPreferences();
    fetchNewsSummary();
  }, [user?.id, selectedCategory]);

  const calculateNewsStats = (articles: Article[]): NewsStats => {
    const stats: NewsStats = { total: articles.length, positive: 0, negative: 0, neutral: 0 };
    
    articles.forEach(article => {
      const sentiment = getSentimentFromContent(article.description || article.content || '');
      if (sentiment === 'positive') stats.positive++;
      else if (sentiment === 'negative') stats.negative++;
      else stats.neutral++;
    });
    
    return stats;
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

  const handleTopicToggle = (topic: string) => {
    setPreferences((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic],
    }));
  };

  const handleSourceToggle = (source: string) => {
    setPreferences((prev) => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter((s) => s !== source)
        : [...prev.sources, source],
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setPreferences((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !preferences.keywords.includes(newKeyword.trim())) {
      setPreferences((prev) => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()],
      }));
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setPreferences((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }));
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      // TODO: Save preferences to Hasura
      // This is a placeholder for the actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Preferences saved successfully!');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryFilterChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-500';
      case 'negative':
        return 'text-red-500';
      default:
        return 'text-gray-500';
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* News Summary Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Welcome, {user?.email?.split('@')[0]}!
        </h1>
        
        <h2 className="text-lg font-medium text-gray-900 mb-4">Latest News Summary</h2>
        
        {/* Category Filter for News Summary */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Category</h3>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryFilterChange(category)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
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
                className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
        
        {isLoadingNews ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{newsStats.total}</div>
                <div className="text-sm text-gray-500">Total Articles</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{newsStats.positive}</div>
                <div className="text-sm text-green-500">Positive</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{newsStats.negative}</div>
                <div className="text-sm text-red-500">Negative</div>
              </div>
            </div>
            
            <h3 className="text-md font-medium text-gray-800">Latest Headlines:</h3>
            {newsSummary.length === 0 ? (
              <p className="text-gray-600 text-center py-4">
                {selectedCategory 
                  ? `No articles found in the "${selectedCategory}" category. Try another category or clear the filter.` 
                  : 'No articles found. Check back later for news updates.'}
              </p>
            ) : (
              <div className="space-y-4">
                {newsSummary.map(article => (
                  <div key={article.id} className="border-l-4 pl-4 border-primary-500 flex gap-4">
                    {article.image && (
                      <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded">
                        <img 
                          src={article.image} 
                          alt={article.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-grow">
                      <h4 className="font-medium">{article.title}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {article.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className={getSentimentColor(getSentimentFromContent(article.description || article.content || ''))}>
                          {getSentimentFromContent(article.description || article.content || '').toUpperCase()}
                        </span>
                        {article.source && (
                          <> • <span>{article.source}</span></>
                        )}
                        {article.published_at && (
                          <> • <span>{formatDate(article.published_at)}</span></>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="text-right">
              <Link 
                to="/" 
                className="inline-block text-primary-600 hover:text-primary-800 font-medium"
              >
                View all news →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Preferences Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">News Preferences</h2>

        <div className="space-y-8">
          {/* Topics Section */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Topics</h2>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicToggle(topic)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    preferences.topics.includes(topic)
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Section */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">News Categories</h2>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    preferences.categories.includes(category)
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <span className="capitalize">{category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Keywords Section */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Keywords</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                placeholder="Add a keyword"
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm flex-1"
              />
              <button 
                onClick={handleAddKeyword} 
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                >
                  {keyword}
                  <button
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Sources Section */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">News Sources</h2>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SOURCES.map((source) => (
                <button
                  key={source}
                  onClick={() => handleSourceToggle(source)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    preferences.sources.includes(source)
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={handleSavePreferences}
              disabled={isSaving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full sm:w-auto"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 