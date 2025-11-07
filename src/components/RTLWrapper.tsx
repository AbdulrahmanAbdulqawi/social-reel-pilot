import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RTLWrapperProps {
  children: React.ReactNode;
}

export function RTLWrapper({ children }: RTLWrapperProps) {
  const { i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(i18n.language === 'ar');

  useEffect(() => {
    const handleLanguageChange = () => {
      const isArabic = i18n.language === 'ar';
      setIsRTL(isArabic);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return (
    <div 
      className="flex min-h-screen w-full"
      style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
    >
      {children}
    </div>
  );
}
