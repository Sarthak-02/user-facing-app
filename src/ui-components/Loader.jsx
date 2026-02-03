export default function Loader({ 
  size = "md", 
  message = "Loading...", 
  fullScreen = false,
  overlay = false 
}) {
  const sizes = {
    sm: "h-6 w-6 border-2",
    md: "h-12 w-12 border-2",
    lg: "h-16 w-16 border-4",
  };
  
  const loaderContent = (
    <div className="text-center">
      <div
        className={`inline-block animate-spin rounded-full border-b-2 border-blue-500 ${sizes[size]}`}
      />
      {message && (
        <p className="mt-4 text-gray-600">{message}</p>
      )}
    </div>
  );

  // Overlay loader (for blocking UI during API calls)
  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto">
          {loaderContent}
        </div>
      </div>
    );
  }

  // Full screen centered loader
  if (fullScreen) {
    return (
      <div className="flex-1 flex items-center justify-center">
        {loaderContent}
      </div>
    );
  }

  // Inline loader
  return (
    <div className="flex justify-center items-center py-4">
      {loaderContent}
    </div>
  );
}
