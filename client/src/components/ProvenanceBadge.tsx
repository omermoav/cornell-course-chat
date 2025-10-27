import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProvenanceBadgeProps {
  rosterSlug: string;
  rosterDescr: string;
  isOldData?: boolean;
}

export default function ProvenanceBadge({ 
  rosterSlug, 
  rosterDescr,
  isOldData = false 
}: ProvenanceBadgeProps) {
  return (
    <Badge 
      data-testid="badge-provenance"
      variant={isOldData ? "secondary" : "default"}
      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs md:text-sm font-medium"
    >
      <Calendar className="h-3.5 w-3.5" />
      <span>Source: {rosterDescr} ({rosterSlug})</span>
    </Badge>
  );
}
