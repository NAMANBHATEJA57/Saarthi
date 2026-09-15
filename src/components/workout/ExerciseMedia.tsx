import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { Play } from 'lucide-react';

interface ExerciseMediaProps {
  animationUrl?: string | null;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  alt: string;
  className?: string;
  expandable?: boolean;
}

export function ExerciseMedia({
  animationUrl,
  mediaUrl,
  thumbnailUrl,
  alt,
  className = '',
  expandable = false,
}: ExerciseMediaProps) {
  const [mediaError, setMediaError] = useState<{ animation: boolean; media: boolean }>({
    animation: false,
    media: false,
  });

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

  // Determine what to show
  const showAnimation = animationUrl && !mediaError.animation && !reducedMotion;
  const showFallback = mediaUrl && !mediaError.media;
  const showThumbnail = thumbnailUrl && !showFallback && !showAnimation;

  const handleAnimationError = () => {
    setMediaError(prev => ({ ...prev, animation: true }));
  };

  const handleMediaError = () => {
    setMediaError(prev => ({ ...prev, media: true }));
  };

  const renderMediaContent = (isExpanded: boolean = false) => {
    const defaultClasses = "w-full h-full object-cover mix-blend-multiply";
    const expandedClasses = "w-full h-full object-contain rounded-md";
    const currentClasses = isExpanded ? expandedClasses : defaultClasses;

    if (showAnimation) {
      if (isVideo(animationUrl as string)) {
        return (
          <video
            src={animationUrl!}
            className={currentClasses}
            autoPlay
            loop
            muted
            playsInline
            onError={handleAnimationError}
            title={alt}
          />
        );
      } else {
        return (
          <img
            src={animationUrl!}
            alt={`${alt} demonstration`}
            className={currentClasses}
            onError={handleAnimationError}
            loading={isExpanded ? "eager" : "lazy"}
          />
        );
      }
    }

    if (showFallback || showThumbnail) {
      const src = showFallback ? mediaUrl! : thumbnailUrl!;
      return (
        <img
          src={src}
          alt={alt}
          className={currentClasses}
          onError={showFallback ? handleMediaError : undefined}
          loading={isExpanded ? "eager" : "lazy"}
        />
      );
    }

    return (
      <div className={`flex flex-col items-center justify-center bg-muted ${currentClasses}`}>
        <span className="text-muted-foreground text-xs text-center px-2">No demonstration</span>
      </div>
    );
  };

  const containerClasses = `relative bg-muted shrink-0 flex items-center justify-center ${className}`;

  if (expandable && (showAnimation || showFallback || showThumbnail)) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className={`${containerClasses} cursor-pointer group`}>
            {renderMediaContent(false)}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
              <Play className="text-white opacity-0 group-hover:opacity-80 transition-opacity w-8 h-8 drop-shadow-md" />
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md p-4 bg-background">
          <DialogTitle className="sr-only">{alt} Demonstration</DialogTitle>
          <div className="w-full h-[60vh] bg-muted rounded-md overflow-hidden relative">
             {renderMediaContent(true)}
          </div>
          <div className="text-center font-semibold mt-2">{alt}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className={containerClasses}>
      {renderMediaContent(false)}
    </div>
  );
}
