import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RTLWrapperProps {
  children: React.ReactNode;
}

export function RTLWrapper({ children }: RTLWrapperProps) {
  const { i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(i18n.language === 'ar');

  useEffect(() => {
    const applyDir = () => {
      const isArabic = i18n.language === 'ar';
      setIsRTL(isArabic);
      // Set document direction attribute for robust RTL support
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
      }
    };

    applyDir();
    i18n.on('languageChanged', applyDir);
    return () => {
      i18n.off('languageChanged', applyDir);
    };
  }, [i18n]);

  return (
    <div className="flex min-h-screen w-full">
      {children}
    </div>
  );
}
