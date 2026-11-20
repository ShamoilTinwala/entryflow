import { useId, useState } from "react";

export default function ShortList({ items, label, children, limit = 3, className = "space-y-3" }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  return <>
    <div id={id} className={className}>{(expanded ? items : items.slice(0, limit)).map(children)}</div>
    {items.length > limit && <button type="button" aria-expanded={expanded} aria-controls={id}
      className="mt-2 min-h-11 rounded-lg px-2 text-sm font-semibold text-primary"
      onClick={() => setExpanded(!expanded)}>
      {expanded ? "Show fewer" : `View all ${items.length} ${label}`}
    </button>}
  </>;
}
