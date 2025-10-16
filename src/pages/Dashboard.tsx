import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ReelCard } from "@/components/ReelCard";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reels")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Reel deleted successfully");
      fetchReels();
    } catch (error) {
      toast.error("Failed to delete reel");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your social media reels</p>
        </div>
        <Button onClick={() => navigate("/upload")} className="gap-2">
          <Plus className="w-4 h-4" />
          Upload Reel
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Total Reels</div>
          <div className="text-3xl font-bold mt-2">{reels.length}</div>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Scheduled</div>
          <div className="text-3xl font-bold mt-2 text-primary">
            {reels.filter((r) => r.status === "scheduled").length}
          </div>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Posted</div>
          <div className="text-3xl font-bold mt-2 text-green-600">
            {reels.filter((r) => r.status === "posted").length}
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
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No reels found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/upload")}
              >
                Upload Your First Reel
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredReels.map((reel) => (
                <ReelCard
                  key={reel.id}
                  reel={reel}
                  onView={(id) => navigate(`/reel/${id}`)}
                  onEdit={(id) => navigate(`/upload?edit=${id}`)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
