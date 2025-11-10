import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Copy, Calendar, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onDuplicate: () => void;
  onReschedule: () => void;
  onClear: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onDelete,
  onDuplicate,
  onReschedule,
  onClear,
}: BulkActionsBarProps) {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <Card className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 shadow-lg border-primary/20 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {selectedCount} {t("calendar.bulk.selected")}
          </Badge>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReschedule}
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            {t("calendar.bulk.reschedule")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDuplicate}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            {t("calendar.bulk.duplicate")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            {t("calendar.bulk.delete")}
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="gap-2"
        >
          <X className="w-4 h-4" />
          {t("common.cancel")}
        </Button>
      </div>
    </Card>
  );
}
