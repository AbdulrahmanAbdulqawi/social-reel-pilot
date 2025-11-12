import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, Heart, MessageCircle, MoreVertical, Share2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReelCardProps {
  reel: {
    id: string;
    title: string;
    caption?: string;
    platform: string;
    status: string;
    scheduled_at?: string;
    posted_at?: string;
    thumbnail_url?: string;
  };
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusColors = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-primary/10 text-primary",
  posted: "bg-green-500/10 text-green-700",
  failed: "bg-destructive/10 text-destructive",
};

const platformColors = {
  instagram: "bg-pink-500/10 text-pink-700",
  tiktok: "bg-black/10 text-black",
  youtube: "bg-red-500/10 text-red-700",
};

export function ReelCard({ reel, onView, onEdit, onDelete }: ReelCardProps) {
  const { t } = useTranslation();
  const statusColor = statusColors[reel.status as keyof typeof statusColors] || statusColors.draft;
  const platformColor = platformColors[reel.platform as keyof typeof platformColors] || "bg-muted";
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    // Fetch analytics if post is posted and has getlate_post_id
    const fetchAnalytics = async () => {
      if (reel.status !== 'posted') return;
      
      try {
        setLoadingAnalytics(true);
        const { data: reelData } = await supabase
          .from('reels')
          .select('getlate_post_id')
          .eq('id', reel.id)
          .single();

        if (reelData?.getlate_post_id) {
          const { data } = await supabase.functions.invoke('getlate-analytics', {
            body: { postId: reelData.getlate_post_id }
          });

          if (data?.analytics) {
            setAnalytics(data.analytics);
          }
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    fetchAnalytics();
  }, [reel.id, reel.status]);

  return (
    <Card className="card-interactive group overflow-hidden hover:shadow-xl hover:-translate-y-1 border-2">
      <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
        {reel.thumbnail_url ? (
          <img
            src={reel.thumbnail_url}
            alt={reel.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex-center w-full h-full">
            <TrendingUp className="w-16 h-16 text-muted-foreground/20 group-hover:text-primary/30 transition-colors duration-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Badge className={`absolute top-2 right-2 sm:top-3 sm:right-3 ${statusColor} shadow-lg`}>
          {reel.status}
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{reel.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(reel.id)}>
                  {t('common.viewDetails')}
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(reel.id)}>
                  {t('common.edit')}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(reel.id)}
                  className="text-destructive"
                >
                  {t('common.delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {reel.caption && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {reel.caption}
          </p>
        )}
        
        <div className="flex-gap-sm">
          <Badge variant="outline" className={platformColor}>
            {reel.platform}
          </Badge>
          {reel.scheduled_at && (
            <div className="flex-gap-sm text-muted-xs">
              <Calendar className="w-3 h-3" />
              {format(new Date(reel.scheduled_at), "MMM d, h:mm a")}
            </div>
          )}
        </div>
      </CardContent>

      {reel.status === "posted" && (
        <CardFooter className="border-t p-3 sm:p-4 bg-gradient-to-br from-muted/20 to-muted/5">
          {loadingAnalytics ? (
            <div className="flex-gap-sm text-muted-sm">
              <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span>{t('common.loadingAnalytics')}</span>
            </div>
          ) : analytics ? (
            <div className="flex flex-wrap gap-4 sm:gap-6 text-sm w-full">
              <div className="flex-gap-sm group">
                <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold">{analytics.views?.toLocaleString() || 0}</div>
                  <div className="text-muted-xs">{t('common.views')}</div>
                </div>
              </div>
              <div className="flex-gap-sm group">
                <div className="p-1.5 rounded-lg bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
                  <Heart className="w-4 h-4 text-pink-600" />
                </div>
                <div>
                  <div className="font-semibold">{analytics.likes?.toLocaleString() || 0}</div>
                  <div className="text-muted-xs">{t('common.likes')}</div>
                </div>
              </div>
              <div className="flex-gap-sm group">
                <div className="p-1.5 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold">{analytics.comments?.toLocaleString() || 0}</div>
                  <div className="text-muted-xs">{t('common.comments')}</div>
                </div>
              </div>
              <div className="flex-gap-sm group">
                <div className="p-1.5 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Share2 className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold">{analytics.shares?.toLocaleString() || 0}</div>
                  <div className="text-muted-xs">{t('common.shares')}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-sm">{t('common.noAnalytics')}</div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
