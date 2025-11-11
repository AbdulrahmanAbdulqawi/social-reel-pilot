import { Moon, Sun, Monitor, Check, Circle } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "black", label: "Black", icon: Circle },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 px-2 sm:px-3 border-border/40 hover:border-primary/20 hover:bg-accent/50 transition-all"
      >
        <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Button>
    );
  }

  const currentTheme = themes.find((t) => t.value === theme) || themes[0];
  const Icon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 px-2 sm:px-3 border-border/40 hover:border-primary/20 hover:bg-accent/50 transition-all"
        >
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-300" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {themes.map((themeOption) => {
          const isActive = theme === themeOption.value;
          const ThemeIcon = themeOption.icon;
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={`gap-2 cursor-pointer justify-between ${isActive ? 'bg-accent' : ''}`}
            >
              <div className="flex items-center gap-2">
                <ThemeIcon className="h-4 w-4" />
                <span>{themeOption.label}</span>
              </div>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
