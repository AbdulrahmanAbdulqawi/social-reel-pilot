import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <Card className={`animate-fade-in-up ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mb-6 p-4 bg-primary/10 rounded-full">
          <Icon className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md text-balance">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} size="lg" className="hover-lift">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
