/**
 * Profile Tab - Shows profile page actions
 * Only appears when on a LinkedIn profile page
 */

import React, { useEffect, useState } from 'react';
import { Target, Users, MessageCircle, Bookmark } from 'lucide-react';
import type { LinkedInProfile, ConnectionRoute } from '@/types';

export function ProfileTab() {
  const [pageType, setPageType] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<Partial<LinkedInProfile> | null>(null);
  const [route, setRoute] = useState<ConnectionRoute | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen for page changes
    const handlePageChange = (e: CustomEvent) => {
      setPageType(e.detail.pageType);
    };

    window.addEventListener('linkedin-extension:page-change', handlePageChange as EventListener);
    return () => {
      window.removeEventListener('linkedin-extension:page-change', handlePageChange as EventListener);
    };
  }, []);

  const handleFindRoute = async () => {
    setLoading(true);
    // TODO: Implement route finding
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const handleGenerateMessage = async () => {
    // TODO: Implement message generation
  };

  const handleAddToWatchlist = async () => {
    // TODO: Implement watchlist addition
  };

  if (pageType !== 'profile') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Users className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Not on a Profile Page</h3>
        <p className="text-sm text-gray-500">
          Navigate to someone's LinkedIn profile to use networking features
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-2">Profile Actions</h3>
        <p className="text-sm text-gray-500 mb-4">
          Analyze this connection and find the best path to reach them
        </p>

        <div className="space-y-3">
          {/* Find Best Route */}
          <button
            onClick={handleFindRoute}
            disabled={loading}
            className="btn-primary w-full"
          >
            <Target className="w-4 h-4 mr-2" />
            Find Best Connection Route
          </button>

          {/* Generate Message */}
          <button
            onClick={handleGenerateMessage}
            className="btn-secondary w-full"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Generate Personalized Message
          </button>

          {/* Add to Watchlist */}
          <button
            onClick={handleAddToWatchlist}
            className="btn-ghost w-full"
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Add to Watchlist
          </button>
        </div>
      </div>

      {/* Match Score */}
      {profileData && (
        <div className="card p-4">
          <h4 className="text-sm font-semibold mb-2">Match Score</h4>
          <div className="flex items-center justify-between">
            <div className="match-score">
              {/* TODO: Render stars based on score */}
              ★★★★☆
            </div>
            <span className="text-lg font-bold">85%</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Based on mutuals, background, location, and skills
          </p>
        </div>
      )}

      {/* Route Display */}
      {route && (
        <div className="card p-4">
          <h4 className="text-sm font-semibold mb-3">Connection Route</h4>
          {/* TODO: Render network path visualization */}
          <div className="space-y-2">
            {route.nodes.map((node, i) => (
              <div key={node.id} className="flex items-center gap-2">
                <div className="network-node w-8 h-8 text-xs">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{node.profile.name}</p>
                  <p className="text-xs text-gray-500">{node.profile.headline}</p>
                </div>
                <span className={`
                  text-xs px-2 py-1 rounded
                  ${node.status === 'connected' ? 'bg-green-100 text-green-700' : ''}
                  ${node.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                  ${node.status === 'not_contacted' ? 'bg-gray-100 text-gray-700' : ''}
                `}>
                  {node.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
