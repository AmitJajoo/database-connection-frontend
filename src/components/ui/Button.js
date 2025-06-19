export function Button({ children, onClick, className = "", ...props }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
