import React from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ value, onChange, readOnly = false }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative w-full h-full bg-[#0f172a] flex">
      {/* Line Numbers - Simplified */}
      <div className="hidden md:flex flex-col items-end px-2 pt-4 bg-[#1e293b] text-slate-600 select-none font-mono text-sm min-w-[3rem] border-r border-slate-700">
         {value.split('\n').map((_, i) => (
           <div key={i} className="leading-6">{i + 1}</div>
         ))}
      </div>
      
      {/* Text Area */}
      <textarea
        className="w-full h-full bg-transparent text-slate-200 font-mono text-sm p-4 leading-6 resize-none focus:outline-none code-font"
        value={value}
        onChange={handleChange}
        spellCheck={false}
        readOnly={readOnly}
      />
    </div>
  );
};
