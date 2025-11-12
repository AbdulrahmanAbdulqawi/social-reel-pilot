import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface PlatformCardProps {
  name: string;
  icon: LucideIcon | (() => JSX.Element);
  color: string;
  connected: boolean;
  account?: {
    username: string;
    displayName: string;
    profilePicture?: string;
  };
  loading: boolean;
  profileId: string | null;
  onConnect: (platform: string) => void;
  onDisconnect: (platform: string) => void;
}

export function PlatformCard({
  name,
  icon: Icon,
  color,
  connected,
  account,
  loading,
  profileId,
  onConnect,
  onDisconnect,
}: PlatformCardProps) {
  const { t } = useTranslation();
  
  return (
    <div className="card-interactive p-3 sm:p-4 hover-lift animate-fade-in">
      {/* Mobile Layout: Stacked */}
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="flex-between">
          <div className="flex-gap-md">
            <div className={`w-10 h-10 rounded-full flex-center bg-${color}-500/10`}>
              <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
            </div>
            <div>
              <p className="font-medium text-sm">{name}</p>
              {account && (
                <p className="text-muted-xs">@{account.username}</p>
              )}
            </div>
          </div>
          {connected && (
            <span className="relative flex h-3 w-3 flex-shrink-0" aria-label="Connected">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
            </span>
          )}
        </div>
        
        {account?.profilePicture && (
          <img 
            src={account.profilePicture} 
            alt={`${account.displayName} profile`}
            className="w-10 h-10 rounded-full object-cover border-2 border-border self-start"
          />
        )}
        
        <Button
          variant={connected ? "outline" : "default"}
          size="sm"
          onClick={() => connected ? onDisconnect(name) : onConnect(name)}
          disabled={loading || (!connected && !profileId)}
          className="w-full hover-lift"
          aria-label={connected ? `Disconnect ${name}` : `Connect ${name}`}
        >
          {loading ? t('common.loading') : connected ? t('common.disconnect') : t('common.connect')}
        </Button>
      </div>

      {/* Desktop Layout: Horizontal */}
      <div className="hidden sm:flex-between">
        <div className="flex-gap-lg">
          <div className={`w-12 h-12 rounded-full flex-center bg-${color}-500/10 hover-scale`}>
            <Icon className={`w-6 h-6 ${color} flex-shrink-0`} />
          </div>
          <div className="flex-gap-md">
            {account?.profilePicture && (
              <img 
                src={account.profilePicture} 
                alt={`${account.displayName} profile`}
                className="w-10 h-10 rounded-full object-cover border-2 border-border hover-scale"
              />
            )}
            <div>
              <p className="font-medium">{name}</p>
              {account && (
                <div className="text-muted-sm">
                  <p className="font-medium">{account.displayName}</p>
                  <p className="text-muted-xs">@{account.username}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-gap-md flex-shrink-0">
          {connected ? (
            <>
              <div className="flex-gap-sm">
                <span className="relative flex h-3 w-3" aria-label="Connected">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                </span>
                <span className="text-muted-sm">{t('common.connected')}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDisconnect(name)}
                disabled={loading}
                className="hover-lift"
                aria-label={`Disconnect ${name}`}
              >
                {t('common.disconnect')}
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => onConnect(name)}
              disabled={loading || !profileId}
              className="hover-lift"
              aria-label={`Connect ${name}`}
            >
              {loading ? t('common.loading') : t('common.connect')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
