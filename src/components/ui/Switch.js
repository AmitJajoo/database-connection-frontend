import React from "react";

export function Switch({ checked, onCheckedChange }) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-checked:bg-blue-600 rounded-full peer relative transition-all duration-300">
        <div className="w-5 h-5 bg-white rounded-full shadow transform peer-checked:translate-x-5 transition-all duration-300 absolute top-0.5 left-0.5"></div>
      </div>
    </label>
  );
}
