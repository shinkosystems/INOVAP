import React from 'react';

interface LogoProps {
  className?: string;
  dark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", dark = false }) => {
  return (
    <div className={`flex items-center ${className}`}>
      {/* iOS Squircle Shape Container */}
      <div className={`
        relative flex items-center justify-center
        backdrop-blur-md transition-all duration-300
        ${dark ? 'bg-white/10 border border-white/20' : 'bg-white/90'} 
        rounded-2xl p-2
      `}>
        <img 
          src="https://jmhquynjyekclwxjgupk.supabase.co/storage/v1/object/public/logotipos/logotipos/12.png" 
          alt="INOVAP" 
          className="h-8 w-auto object-contain" 
        />
      </div>
    </div>
  );
};