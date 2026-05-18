import { useState } from 'react';
import { X } from 'lucide-react';

/**
 * PopTagInput — Input de etiquetas tipo "chip" con Enter para añadir.
 * Ideal para alergias, restricciones, tags de temperamento, etc.
 */
const PopTagInput = ({ label, tags, setTags, placeholder = 'Añadir y presionar Enter...' }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
        {label}
      </label>
      <div className="w-full bg-white border-[3.5px] border-black rounded-2xl p-2.5 shadow-[4px_4px_0px_0px_black] min-h-[56px] flex flex-wrap gap-2 items-center focus-within:shadow-none focus-within:translate-y-0.5 transition-all">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="bg-rose-100 text-rose-600 border-2 border-rose-400 px-3 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:text-rose-800 transition-colors"
            >
              <X size={11} strokeWidth={4} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : 'Añadir más...'}
          className="flex-1 bg-transparent border-none outline-none font-black text-xs uppercase px-2 py-1 min-w-[120px] placeholder:text-slate-300 placeholder:normal-case"
        />
      </div>
    </div>
  );
};

export default PopTagInput;
