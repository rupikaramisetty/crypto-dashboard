import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { CryptoCard } from "~/components/CryptoCard";
import type { CryptoRate } from "~/lib/crypto";

/**
 * Wires a `CryptoCard` into dnd-kit's sortable context. The drag listeners are
 * attached only to the card's handle button (not the whole card) so that text
 * selection and future interactive elements keep working.
 */
export function SortableCryptoCard({ rate }: { rate: CryptoRate }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rate.symbol });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Keep the dragged card above its peers.
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.9 : undefined,
  };

  return (
    <CryptoCard
      ref={setNodeRef}
      rate={rate}
      isDragging={isDragging}
      style={style}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
}
