import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { ReelCard } from "@/components/ReelCard";
import { EditReelDialog } from "@/components/EditReelDialog";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Calendar, CheckCircle2, Video } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { usePostStatusSync } from "@/hooks/usePostStatusSync";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";

interface Reel {
  id: string;
  title: string;
  caption: string | null;
  platform: string;
  status: string;
  scheduled_at: string | null;
  posted_at: string | null;
  thumbnail_url: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [editingReel, setEditingReel] = useState<Reel | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Enable automatic post status syncing
  usePostStatusSync(true);

  useEffect(() => {
    fetchReels();
    
    // Set up realtime subscription for reels updates
    const channel = supabase
      .channel('reels-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reels'
        },
        () => {
          fetchReels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from("reels")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReels(data || []);
    } catch (error) {
      toast.error(t('dashboard.loadFailed'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const reel = reels.find(r => r.id === id);
    if (reel) {
      setEditingReel(reel);
      setEditDialogOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('dashboard.deleteConfirm'))) return;
    
    try {
      const { error } = await supabase
        .from("reels")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success(t('dashboard.deleteSuccess'));
      fetchReels();
    } catch (error) {
      toast.error(t('dashboard.deleteFailed'));
      console.error(error);
    }
  };

  const filterReels = (status: string) => {
    if (status === "all") return reels;
    return reels.filter((reel) => reel.status === status);
  };

  const filteredReels = filterReels(activeTab);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
        <LoadingSkeleton variant="stats" count={3} />
        <LoadingSkeleton variant="card" count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with gradient */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <Button 
          onClick={() => navigate("/upload")} 
          className="gap-2 hover-scale shadow-lg w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="sm:inline">{t('dashboard.createPost')}</span>
        </Button>
      </div>

      {/* Stats Cards with animations */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="card-elevated group relative overflow-hidden p-4 sm:p-6 bg-gradient-to-br from-card to-card/50 hover-lift">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex-gap-sm text-muted-xs sm:text-muted-sm mb-2">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('dashboard.totalPosts')}
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{reels.length}</div>
          </div>
        </div>
        
        <div className="card-elevated group relative overflow-hidden p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-card hover-lift">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex-gap-sm text-muted-xs sm:text-muted-sm mb-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('dashboard.scheduled')}
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
              {reels.filter((r) => r.status === "scheduled").length}
            </div>
          </div>
        </div>
        
        <div className="card-elevated group relative overflow-hidden p-4 sm:p-6 bg-gradient-to-br from-green-500/5 to-card hover-lift">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex-gap-sm text-muted-xs sm:text-muted-sm mb-2">
              <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('dashboard.posted')}
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600">
              {reels.filter((r) => r.status === "posted").length}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">{t('dashboard.all')}</TabsTrigger>
          <TabsTrigger value="draft">{t('dashboard.drafts')}</TabsTrigger>
          <TabsTrigger value="scheduled">{t('dashboard.scheduled')}</TabsTrigger>
          <TabsTrigger value="posted">{t('dashboard.posted')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredReels.length === 0 ? (
            <EmptyState
              icon={Video}
              title={activeTab === "all" ? t('dashboard.noReels') : t(`dashboard.no${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`)}
              description={
                activeTab === "all"
                  ? t('dashboard.noReelsDesc')
                  : `${t('empty.noResults')}`
              }
              action={{
                label: t('dashboard.uploadFirst'),
                onClick: () => navigate("/upload"),
              }}
            />
          ) : (
            <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredReels.map((reel, index) => (
                <div 
                  key={reel.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <ReelCard
                    reel={reel}
                    onView={(id) => navigate(`/reel/${id}`)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {editingReel && (
        <EditReelDialog
          reel={editingReel}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={fetchReels}
        />
      )}
    </div>
  );
};

export default Dashboard;
