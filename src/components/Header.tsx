import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import arlLogo from '../assets/arl-logo.png';
import { assetUrl } from '../utils/assetUrl';

export default function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 h-14 w-full bg-background/80 backdrop-blur-md border-b border-border shadow-sm flex items-center px-4 flex-shrink-0 transition-colors duration-200">
      <div className="flex-1" />
      <div className="flex items-center justify-center">
        <img
          src={assetUrl(arlLogo)}
          alt="ARL Network"
          className="h-8 w-auto animate-fade-in"
        />
      </div>
      <div className="flex-1 flex justify-end items-center gap-3">
        <button
          onClick={toggle}
          className="size-9 flex items-center justify-center rounded-lg border border-input bg-card text-muted-foreground shadow-sm transition-all duration-200 hover:bg-accent hover:text-foreground active:scale-90"
        >
          <div className="relative w-[18px] h-[18px]">
            <Sun className={`absolute inset-0 w-[18px] h-[18px] transition-all duration-500 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
            <Moon className={`absolute inset-0 w-[18px] h-[18px] transition-all duration-500 ${theme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
          </div>
        </button>
        <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center shadow-md shadow-blue-500/20 transition-transform duration-200 hover:scale-110">
          <span className="text-sm font-semibold text-white">AM</span>
        </div>
        <span className="text-sm text-foreground font-medium">Anderson Marquez</span>
      </div>
    </header>
  );
}
