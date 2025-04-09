import React from 'react';

const TestComponent = () => {
  return (
    <div className="p-4 bg-blue-500 text-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold">Tailwind CSS Test</h1>
      <p className="mt-2">If you can see this styled properly, Tailwind CSS is working!</p>
      <button className="mt-4 px-4 py-2 bg-white text-blue-500 rounded hover:bg-blue-100">
        Test Button
      </button>
    </div>
  );
};

export default TestComponent; 