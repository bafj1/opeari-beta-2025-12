import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'tertiary' | 'accent';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    to?: string;            // If provided, renders as Link
    href?: string;          // If provided, renders as <a>
    onClick?: (e: React.MouseEvent) => void;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    to,
    href,
    onClick,
    disabled = false,
    loading = false,
    className = '',
    type = 'button',
}) => {
    // Base Styles
    const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed';

    // Variants
    const variants = {
        primary: `bg-opeari-green text-white hover:bg-opeari-green-dark hover:-translate-y-0.5 shadow-button hover:shadow-button-hover active:translate-y-0 disabled:hover:translate-y-0 disabled:shadow-none focus:ring-opeari-green/30`,
        secondary: `bg-opeari-bg text-opeari-green border-2 border-opeari-border hover:border-opeari-green hover:text-opeari-green-dark hover:-translate-y-0.5 disabled:hover:border-opeari-border disabled:hover:translate-y-0 focus:ring-opeari-green/20`,
        tertiary: `bg-transparent text-opeari-green hover:text-opeari-coral hover:underline focus:ring-0 px-0 shadow-none`,
        accent: `btn-accent shadow-button hover:shadow-button-hover active:translate-y-0`,
    };

    // Sizes
    const sizes = {
        sm: 'text-sm px-4 py-2 rounded-full',
        md: 'text-base px-6 py-3.5 rounded-full',
        lg: 'text-lg px-8 py-4 rounded-full',
    };

    // Tertiary overrides (no padding/bg)
    const finalSize = variant === 'tertiary' ? 'text-sm' : sizes[size];
    const widthClass = fullWidth ? 'w-full' : '';

    const classes = `
    ${baseStyles}
    ${variants[variant]}
    ${finalSize}
    ${widthClass}
    ${className}
  `.trim();

    // Content (Handling Loading)
    const content = loading ? (
        <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {children}
        </>
    ) : children;

    // Render logic
    if (to && !disabled) {
        return (
            <Link to={to} className={classes} onClick={onClick}>
                {content}
            </Link>
        );
    }

    if (href && !disabled) {
        return (
            <a href={href} className={classes} onClick={onClick}>
                {content}
            </a>
        );
    }

    return (
        <button
            type={type}
            className={classes}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {content}
        </button>
    );
};

export default Button;
