import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ReelCard } from "@/components/ReelCard";
import { EditReelDialog } from "@/components/EditReelDialog";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [editingReel, setEditingReel] = useState<Reel | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchReels();
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
      toast.error("Failed to load reels");
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
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    try {
      const { error } = await supabase
        .from("reels")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Post deleted successfully");
      fetchReels();
    } catch (error) {
      toast.error("Failed to delete post");
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with gradient */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track your social media content</p>
        </div>
        <Button 
          onClick={() => navigate("/upload")} 
          className="gap-2 hover-scale shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Create Post
        </Button>
      </div>

      {/* Stats Cards with animations */}
      <div className="grid gap-4 md:grid-cols-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="group relative overflow-hidden p-6 border rounded-xl bg-gradient-to-br from-card to-card/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              Total Posts
            </div>
            <div className="text-4xl font-bold">{reels.length}</div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden p-6 border rounded-xl bg-gradient-to-br from-primary/5 to-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              Scheduled
            </div>
            <div className="text-4xl font-bold text-primary">
              {reels.filter((r) => r.status === "scheduled").length}
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden p-6 border rounded-xl bg-gradient-to-br from-green-500/5 to-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <CheckCircle2 className="w-4 h-4" />
              Posted
            </div>
            <div className="text-4xl font-bold text-green-600">
              {reels.filter((r) => r.status === "posted").length}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="posted">Posted</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredReels.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg font-medium mb-2">No posts found</p>
              <p className="text-sm text-muted-foreground mb-6">Get started by creating your first post</p>
              <Button
                className="hover-scale"
                onClick={() => navigate("/upload")}
              >
                Create Your First Post
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
