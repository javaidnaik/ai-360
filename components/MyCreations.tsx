/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as db from '../services/supabaseDb';
import { VideoCreation } from '../types';
import { TrashIcon, DownloadIcon, VideoIcon } from './icons';
import Spinner from './Spinner';

interface MyCreationsProps {
  onBackToStart: () => void;
}

const MyCreations: React.FC<MyCreationsProps> = ({ onBackToStart }) => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoCreation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserVideos();
  }, [user]);

  const loadUserVideos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const userVideos = await db.getVideosByUserId(user.id);
      setVideos(userVideos);
    } catch (err) {
      console.error('Error loading videos:', err);
      setError('Failed to load your creations');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: number) => {
    if (!confirm('Are you sure you want to delete this creation?')) return;
    
    try {
      await db.deleteVideo(videoId);
      setVideos(prev => prev.filter(v => v.id !== videoId));
    } catch (err) {
      console.error('Error deleting video:', err);
      alert('Failed to delete video');
    }
  };

  const handleDownload = (videoUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Creations</h1>
            <p className="text-gray-300">Your generated 360° videos</p>
          </div>
          <button
            onClick={onBackToStart}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Back to Start
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {videos.length === 0 ? (
          <div className="text-center py-16">
            <VideoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No creations yet</h3>
            <p className="text-gray-400 mb-6">Start by uploading an image and generating your first 360° video</p>
            <button
              onClick={onBackToStart}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Your First Video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 hover:bg-white/15 transition-all duration-200"
              >
                {/* Video Preview */}
                <div className="aspect-video bg-gray-800 relative group">
                  {(video.videoUrl || video.url) ? (
                    <video
                      src={video.videoUrl || video.url}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    >
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <VideoIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                        {video.prompt || 'Untitled Creation'}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {video.animationStyle || 'Default'} • {new Date(video.createdAt || video.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      (video.status || 'completed') === 'completed' 
                        ? 'bg-green-500/20 text-green-300' 
                        : (video.status || 'completed') === 'failed'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {((video.status || 'completed').charAt(0).toUpperCase() + (video.status || 'completed').slice(1))}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {(video.videoUrl || video.url) && (
                      <button
                        onClick={() => handleDownload(video.videoUrl || video.url, `pixshop-${video.id}.mp4`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        <DownloadIcon className="w-4 h-4" />
                        Download
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCreations;
