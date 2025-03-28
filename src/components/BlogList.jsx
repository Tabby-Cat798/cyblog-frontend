"use client";
import React from 'react';
import BlogCard from './BlogCard';

const BlogList = ({ posts = [] }) => {
  if (posts.length === 0) {
    return (
      <div className="w-full py-20 text-center">
        <h3 className="text-xl text-gray-600 dark:text-gray-400">暂无文章</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <BlogCard key={post._id} post={post} />
      ))}
    </div>
  );
};

export default BlogList; 