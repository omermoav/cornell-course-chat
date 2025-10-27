import ProvenanceBadge from '../ProvenanceBadge';

export default function ProvenanceBadgeExample() {
  return (
    <div className="space-y-4">
      <ProvenanceBadge rosterSlug="FA25" rosterDescr="Fall 2025" />
      <ProvenanceBadge rosterSlug="SP24" rosterDescr="Spring 2024" isOldData={true} />
    </div>
  );
}
