"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';

// 评论格式化日期
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString;
  }
};

// 单条评论组件
const CommentItem = ({ comment, onReply, depth = 0 }) => {
  // 限制嵌套层级为3
  const maxDepth = 3;
  
  return (
    <div className={`${depth === 0 ? 'border-b border-gray-100 dark:border-gray-800 pb-4' : ''}`}>
      <div className="flex items-start space-x-3">
        {/* 用户头像 */}
        <div className="flex-shrink-0">
          {comment.user?.avatar ? (
            <Image
              src={comment.user.avatar}
              alt={comment.user.name || "用户"}
              width={36}
              height={36}
              className="rounded-full"
            />
          ) : (
            <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white">
              {(comment.user?.name || '匿名')[0].toUpperCase()}
            </div>
          )}
        </div>
        
        {/* 评论内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {comment.user?.name || '匿名用户'}
            </div>
            {comment.user?.role === 'admin' && (
              <div className="ml-1.5 px-1.5 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-100 rounded">
                管理员
              </div>
            )}
            <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              {formatDate(comment.createdAt)}
            </div>
          </div>
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">{comment.content}</div>
          <button
            onClick={() => onReply(comment)}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            回复
          </button>
        </div>
      </div>
      
      {/* 子评论区域 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className={`pl-6 mt-3 ${depth < maxDepth ? '' : 'pl-6 pt-2'}`}>
          {depth < maxDepth ? (
            // 正常嵌套展示子评论
            comment.replies.map((reply) => (
              <div key={reply._id} className="mt-3">
                <CommentItem comment={reply} onReply={onReply} depth={depth + 1} />
              </div>
            ))
          ) : (
            // 超过最大深度，平铺展示
            <div className="space-y-3 pt-2">
              {comment.replies.map((reply) => (
                <div key={reply._id} className="border-t border-gray-100 dark:border-gray-800 pt-3">
                  <div className="flex items-start space-x-3">
                    {/* 用户头像 */}
                    <div className="flex-shrink-0">
                      {reply.user?.avatar ? (
                        <Image
                          src={reply.user.avatar}
                          alt={reply.user.name || "用户"}
                          width={28}
                          height={28}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                          {(reply.user?.name || '匿名')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* 评论内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {reply.user?.name || '匿名用户'}
                        </div>
                        {reply.user?.role === 'admin' && (
                          <div className="ml-1.5 px-1.5 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-100 rounded">
                            管理员
                          </div>
                        )}
                        <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(reply.createdAt)}
                        </div>
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">
                        {reply.content}
                      </div>
                      <button
                        onClick={() => onReply(reply)}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        回复
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 评论表单组件
const CommentForm = ({ postId, onCommentSubmitted, replyTo, onCancelReply }) => {
  const { user, loading } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('评论内容不能为空');
      return;
    }
    
    // 必须登录才能评论
    if (!user) {
      setError('请先登录再发表评论');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          content,
          userId: user._id,
          parentId: replyTo?._id // 如果是回复，传入父评论ID
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '评论提交失败');
      }
      
      // 清空表单
      setContent('');
      
      // 通知父组件评论已提交
      onCommentSubmitted();
      
      // 如果是回复，取消回复模式
      if (replyTo) {
        onCancelReply();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">加载中...</div>;
  }

  if (!user) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
        <p className="mb-4">请登录后发表评论</p>
        <a 
          href="/login" 
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          去登录
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
      {replyTo ? (
        <div className="mb-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
          <span>
            回复给：{replyTo.user?.name || '匿名用户'}
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            取消回复
          </button>
        </div>
      ) : (
        <h4 className="text-xl font-medium mb-4">发表评论</h4>
      )}
      
      {error && (
        <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded">
          {error}
        </div>
      )}
      
      <div className="mb-4 flex items-center">
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={user.name}
            width={32}
            height={32}
            className="rounded-full mr-3"
          />
        ) : (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
            {user.name[0].toUpperCase()}
          </div>
        )}
        <span className="font-medium">{user.name}</span>
      </div>
      
      <div className="mb-4">
        <textarea
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows="4"
          placeholder="写下您的评论..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        ></textarea>
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '提交中...' : '提交评论'}
      </button>
    </form>
  );
};

// 主评论区组件
export default function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [totalCommentCount, setTotalCommentCount] = useState(0);
  
  // 处理回复逻辑
  const handleReply = (comment) => {
    setReplyTo(comment);
    // 滚动到评论表单
    document.getElementById('comment-form').scrollIntoView({ behavior: 'smooth' });
  };
  
  // 组织评论树结构
  const organizeComments = (flatComments) => {
    const commentMap = {};
    const rootComments = [];
    
    // 首先创建所有评论的映射
    flatComments.forEach(comment => {
      commentMap[comment._id] = {
        ...comment,
        replies: []
      };
    });
    
    // 构建树结构
    flatComments.forEach(comment => {
      if (comment.parentId && commentMap[comment.parentId]) {
        commentMap[comment.parentId].replies.push(commentMap[comment._id]);
      } else {
        rootComments.push(commentMap[comment._id]);
      }
    });
    
    return rootComments;
  };
  
  // 获取评论列表
  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      
      if (!response.ok) {
        throw new Error('获取评论失败');
      }
      
      const data = await response.json();
      // 组织评论为树结构
      const organizedComments = organizeComments(data);
      setComments(organizedComments);
      // 计算总评论数 - 直接使用data长度，包含所有评论和回复
      setTotalCommentCount(data.length);
    } catch (err) {
      console.error('获取评论错误:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 组件加载时获取评论
  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);
  
  return (
    <section className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-6">评论 ({totalCommentCount})</h3>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-6">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-blue-500 border-r-transparent"></div>
          <p className="ml-2">加载评论中...</p>
        </div>
      ) : error ? (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg mb-6">
          加载评论失败: {error}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400 mb-6">
          还没有评论，成为第一个评论的人吧！
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800 space-y-0 mb-8">
          {comments.map(comment => (
            <div key={comment._id} className="py-4">
              <CommentItem 
                comment={comment} 
                onReply={handleReply}
              />
            </div>
          ))}
        </div>
      )}
      
      <div id="comment-form" className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
        <CommentForm 
          postId={postId} 
          onCommentSubmitted={fetchComments} 
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </section>
  );
} 