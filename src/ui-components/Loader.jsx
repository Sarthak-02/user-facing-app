export default function Loader({ size = "md" }) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-4",
  };

  return (
    <div className="flex justify-center items-center py-4">
      <div
        className={`animate-spin rounded-full border-gray-300 border-t-primary-600 ${sizes[size]}`}
      />
    </div>
  );
}
