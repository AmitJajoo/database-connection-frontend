export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
}
