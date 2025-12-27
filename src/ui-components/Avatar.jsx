export default function Avatar({ src, name }) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium text-gray-600">
            {name?.[0]}
          </span>
        )}
      </div>
    );
  }
  