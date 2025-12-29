import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  // Updated base styles: rounded-2xl (more bubbly like the reference), bold text
  const baseStyles = "inline-flex items-center justify-center px-6 py-3.5 text-sm font-bold rounded-2xl transition-all transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
  
  const variants = {
    // Reference Image "Next" button: Lime/Green bg, Black text
    primary: "bg-lime-400 text-zinc-950 hover:bg-lime-300 focus:ring-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.3)]",
    
    // Dark card-like button
    secondary: "bg-zinc-800 text-white hover:bg-zinc-700 focus:ring-zinc-600 border border-zinc-700",
    
    // Outline for secondary actions
    outline: "border-2 border-zinc-700 text-zinc-300 bg-transparent hover:bg-zinc-800 focus:ring-zinc-500",
    
    danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 focus:ring-red-500",
    
    ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;