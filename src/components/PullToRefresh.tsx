import React, { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValue, useTransform } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const pullThreshold = 80;

  const handleDrag = (_: any, info: any) => {
    if (isRefreshing) return;
    const { y } = info.point;
    // Simple heuristic for pull progress based on drag delta y if starting from top
    if (info.offset.y > 0) {
      const progress = Math.min(info.offset.y / pullThreshold, 1.2);
      setPullProgress(progress);
    }
  };

  const handleDragEnd = async (_: any, info: any) => {
    if (info.offset.y >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullProgress(0);
  };

  return (
    <div className="relative overflow-hidden w-full h-full">
      {/* Pull Indicator */}
      <motion.div 
        style={{ 
          top: -40,
          opacity: pullProgress,
          scale: pullProgress,
          y: pullProgress * 60
        }}
        className="absolute left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
      >
        <div className={`p-3 rounded-full bg-navy border border-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.2)] ${isRefreshing ? 'animate-spin' : ''}`}>
          <RefreshCw className={`w-5 h-5 text-gold transition-transform ${pullProgress >= 1 ? 'rotate-180' : ''}`} />
        </div>
      </motion.div>

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.6}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="w-full h-full touch-pan-x"
      >
        {children}
      </motion.div>
    </div>
  );
}
