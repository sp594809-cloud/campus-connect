import React from "react";

/**
 * Fallback UI component shown while lazy-loaded routes are being imported
 * Uses existing design system styles to maintain consistent UX
 */
export const LazyLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-background">
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Loading spinner */}
      <div className="w-12 h-12 relative">
        <div className="absolute inset-0 rounded-full border-4 border-muted opacity-20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
      </div>
      {/* Loading text */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground font-medium">Loading...</p>
      </div>
    </div>
  </div>
);

export default LazyLoadingFallback;
