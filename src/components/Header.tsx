import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import arlLogo from '../assets/arl-logo.png';
import { assetUrl } from '../utils/assetUrl';

export default function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 h-12 w-full bg-background/80 backdrop-blur-md border-b border-border shadow-sm flex items-center px-4 flex-shrink-0 transition-colors duration-200">
      <div className="flex-1" />
      <div className="flex items-center justify-center">
        <img
          src={assetUrl(arlLogo)}
          alt="ARL Network"
          className="h-7 w-auto animate-fade-in"
        />
      </div>
      <div className="flex-1 flex justify-end items-center gap-3">
        <button
          onClick={toggle}
          className="size-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md transition-all duration-200 hover:bg-muted hover:rotate-12 active:scale-90"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <div className="w-7 h-7 rounded-full bg-[#3B82F6] flex items-center justify-center shadow-md shadow-blue-500/20 transition-transform duration-200 hover:scale-110">
          <span className="text-xs font-semibold text-white">AM</span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">Anderson Marquez</span>
      </div>
    </header>
  );
}
