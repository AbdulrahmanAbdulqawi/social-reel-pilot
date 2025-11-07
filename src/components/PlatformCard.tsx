import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="p-3 sm:p-4 border rounded-lg hover:bg-accent/50 hover:border-primary/20 transition-all duration-300 hover-lift animate-fade-in">
      {/* Mobile Layout: Stacked */}
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${color}-500/10`}>
              <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
            </div>
            <div>
              <p className="font-medium text-sm">{name}</p>
              {account && (
                <p className="text-xs text-muted-foreground">@{account.username}</p>
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
          {loading ? "Loading..." : connected ? "Disconnect" : "Connect"}
        </Button>
      </div>

      {/* Desktop Layout: Horizontal */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${color}-500/10 transition-transform hover:scale-110`}>
            <Icon className={`w-6 h-6 ${color} flex-shrink-0`} />
          </div>
          <div className="flex items-center gap-3">
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
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">{account.displayName}</p>
                  <p className="text-xs">@{account.username}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {connected ? (
            <>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3" aria-label="Connected">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                </span>
                <span className="text-sm text-muted-foreground">Connected</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDisconnect(name)}
                disabled={loading}
                className="hover-lift"
                aria-label={`Disconnect ${name}`}
              >
                Disconnect
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
              {loading ? "Loading..." : "Connect"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
