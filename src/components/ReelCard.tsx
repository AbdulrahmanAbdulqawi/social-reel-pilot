import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, Heart, MessageCircle, MoreVertical } from "lucide-react";
import { format } from "date-fns";
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
  const statusColor = statusColors[reel.status as keyof typeof statusColors] || statusColors.draft;
  const platformColor = platformColors[reel.platform as keyof typeof platformColors] || "bg-muted";

  return (
    <Card className="overflow-hidden hover:shadow-card transition-shadow">
      <div className="aspect-video bg-muted relative">
        {reel.thumbnail_url ? (
          <img
            src={reel.thumbnail_url}
            alt={reel.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Eye className="w-12 h-12 text-muted-foreground/20" />
          </div>
        )}
        <Badge className={`absolute top-2 right-2 ${statusColor}`}>
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
                  View Details
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(reel.id)}>
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(reel.id)}
                  className="text-destructive"
                >
                  Delete
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
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={platformColor}>
            {reel.platform}
          </Badge>
          {reel.scheduled_at && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {format(new Date(reel.scheduled_at), "MMM d, h:mm a")}
            </div>
          )}
        </div>
      </CardContent>

      {reel.status === "posted" && (
        <CardFooter className="border-t p-4 bg-muted/30">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>1.2K</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>234</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>45</span>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
