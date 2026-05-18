import React, { useState } from 'react';
import { X } from 'lucide-react';

const PopTagInput = ({ label, tags = [], setTags, disabled = false, placeholder }) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()]);
      }
      setInputValue("");
    }
  };

  const removeTag = (indexToRemove) => {
    if (disabled) return;
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={`relative w-full group mb-6 ${disabled ? 'opacity-70' : ''}`}>
      {label && (
        <label className="absolute -top-3 left-4 z-30 bg-black text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm">
          {label}
        </label>
      )}
      <div className={`w-full bg-white border-[3.5px] border-black rounded-2xl p-3 min-h-[56px] flex flex-wrap gap-2 items-center transition-all ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'focus-within:shadow-[4px_4px_0px_0px_var(--primary)] shadow-[4px_4px_0px_0px_black]'}`}>
        {tags.map((tag, index) => (
          <span key={index} className="bg-[var(--secondary)] text-black border-2 border-black px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
            {tag}
            {!disabled && (
              <button onClick={(e) => { e.preventDefault(); removeTag(index); }} className="hover:text-white hover:bg-black transition-colors bg-black/10 rounded-full p-0.5">
                <X size={12} strokeWidth={4} />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : "Anadir y presionar Enter..."}
            className="flex-1 bg-transparent border-none outline-none font-bold text-sm min-w-[120px] px-2"
          />
        )}
      </div>
    </div>
  );
};

export default PopTagInput;
