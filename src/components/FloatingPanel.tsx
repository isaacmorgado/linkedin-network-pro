/**
 * Main Floating Panel Component
 *
 * Apple-like draggable/resizable panel with:
 * - Frosted glass effect
 * - Smooth animations
 * - Tab-based navigation
 * - Persistent position/size
 */

import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { LoginScreen } from './auth/LoginScreen';
import { TabNavigation } from './navigation/TabNavigation';
import { ProfileTab } from './tabs/ProfileTab';
import { WatchlistTab } from './tabs/WatchlistTab';
import { JobsTab } from './tabs/JobsTab';
import { FeedTab } from './tabs/FeedTab';
import { SettingsTab } from './tabs/SettingsTab';
import { NotificationsTab } from './tabs/NotificationsTab';

export function FloatingPanel() {
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const { panelPosition, panelSize, theme, updatePanelPosition, updatePanelSize } = useSettingsStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('profile');

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle visibility toggle
  useEffect(() => {
    const handleToggle = () => {
      setIsVisible((prev) => !prev);
    };

    window.addEventListener('linkedin-extension:toggle', handleToggle);
    return () => window.removeEventListener('linkedin-extension:toggle', handleToggle);
  }, []);

  if (!isVisible) return null;

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <Rnd
        default={{
          x: panelPosition.x,
          y: panelPosition.y,
          width: 400,
          height: 500,
        }}
        minWidth={350}
        minHeight={400}
        bounds="window"
        dragHandleClassName="drag-handle"
        onDragStop={(e, d) => {
          updatePanelPosition({ x: d.x, y: d.y });
        }}
      >
        <LoginScreen />
      </Rnd>
    );
  }

  return (
    <Rnd
      default={{
        x: panelPosition.x,
        y: panelPosition.y,
        width: panelSize.width,
        height: panelSize.height,
      }}
      minWidth={380}
      minHeight={500}
      maxWidth={800}
      maxHeight={900}
      bounds="window"
      dragHandleClassName="drag-handle"
      onDragStop={(e, d) => {
        updatePanelPosition({ x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        updatePanelSize({
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
        });
        updatePanelPosition(position);
      }}
      style={{
        zIndex: 2147483647, // Maximum z-index
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`
          h-full w-full overflow-hidden rounded-2xl
          ${theme.mode === 'dark' ? 'bg-gray-900/90' : 'bg-white/90'}
          backdrop-blur-apple border border-white/20
          shadow-2xl flex flex-col
        `}
        style={{
          backdropFilter: `blur(${theme.blurIntensity}px)`,
        }}
      >
        {/* Header */}
        <div
          className={`
            drag-handle flex items-center justify-between px-4 py-3
            border-b ${theme.mode === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}
            cursor-move
          `}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" onClick={() => setIsVisible(false)} />
            <div className="w-3 h-3 rounded-full bg-yellow-500" onClick={() => setIsMinimized(!isMinimized)} />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>

          <h2 className={`text-sm font-semibold ${theme.mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            LinkedIn Network Pro
          </h2>

          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        {!isMinimized && (
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {!isMinimized && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-auto p-4"
            >
              {activeTab === 'profile' && <ProfileTab />}
              {activeTab === 'watchlist' && <WatchlistTab />}
              {activeTab === 'jobs' && <JobsTab />}
              {activeTab === 'feed' && <FeedTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
              {activeTab === 'settings' && <SettingsTab />}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Rnd>
  );
}
