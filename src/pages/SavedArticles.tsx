import { useState } from 'react';
import toast from 'react-hot-toast';

const SavedArticles = () => {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Saved Articles</h1>
      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
        <p className="text-yellow-800 mb-2">
          The save article feature is temporarily disabled for maintenance.
        </p>
        <p className="text-yellow-700">
          We are working on improving this feature and it will be available again soon.
        </p>
      </div>
    </div>
  );
};

export default SavedArticles; 