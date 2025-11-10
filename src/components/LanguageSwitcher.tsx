import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages, Check } from 'lucide-react';
import { useEffect } from 'react';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'العربية', nativeName: 'العربية', flag: '🇸🇦' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Update document direction and lang attribute
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
    
    // Force re-render of layout by triggering a resize event
    window.dispatchEvent(new Event('resize'));
  }, [i18n.language]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 min-w-[140px] justify-start border-border/40 hover:border-primary/20 hover:bg-accent/50 transition-all"
        >
          <span className="text-2xl">{currentLanguage.flag}</span>
          <span className="flex-1 text-left font-medium">{currentLanguage.nativeName}</span>
          <Languages className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {languages.map((language) => {
          const isActive = i18n.language === language.code;
          return (
            <DropdownMenuItem
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`gap-3 cursor-pointer ${isActive ? 'bg-accent' : ''}`}
            >
              <span className="text-2xl">{language.flag}</span>
              <span className="flex-1 font-medium">{language.nativeName}</span>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
