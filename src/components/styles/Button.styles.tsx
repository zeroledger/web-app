const baseButtonStyle = `inline-flex items-center justify-center gap-2 font-semibold focus:outline-none disabled:opacity-50 disabled:cursor-default transition duration-150 ease-in-out`;

const basePrimaryButtonStyle = `
  ${baseButtonStyle} rounded-md bg-gray-700 hover:cursor-pointer
  text-white shadow-inner shadow-white/10 
  hover:bg-gray-600 disabled:hover:bg-gray-700 
`;

export const primaryButtonStyles = {
  regular: `${basePrimaryButtonStyle} py-2.5 px-3.5 text-base/6 w-32 h-12`,
  small: `${basePrimaryButtonStyle} py-3.5 px-5.5 text-sm/4`,
};

export const linkButtonStyle = `
  ${baseButtonStyle} py-2.5 px-2.5 text-xs/4  
  text-slate-300 hover:text-slate-200`;

export const menuButtonStyle = `
  ${baseButtonStyle} w-full text-white/80 bg-transparent 
  hover:text-white/90 hover:cursor-pointer`;
