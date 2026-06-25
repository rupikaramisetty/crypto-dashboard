import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useMemo, useState } from "react";

import { CryptoCard } from "~/components/CryptoCard";
import { SortableCryptoCard } from "~/components/SortableCryptoCard";
import type { CryptoRate } from "~/lib/crypto";

export interface CryptoGridProps {
  rates: CryptoRate[];
  /**
   * Called with the new symbol order after a drag completes. Receives the full
   * reordered list of the currently visible symbols.
   */
  onReorder: (orderedSymbols: string[]) => void;
  /** Drag is disabled while filtering, since the visible set is partial. */
  sortingEnabled: boolean;
}

export function CryptoGrid({ rates, onReorder, sortingEnabled }: CryptoGridProps) {
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);

  const sensors = useSensors(
    // A small activation distance lets clicks/taps through without starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const symbols = useMemo(() => rates.map((r) => r.symbol), [rates]);
  const activeRate = activeSymbol
    ? rates.find((r) => r.symbol === activeSymbol) ?? null
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveSymbol(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveSymbol(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = symbols.indexOf(String(active.id));
    const newIndex = symbols.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(symbols, oldIndex, newIndex));
  }

  if (!sortingEnabled) {
    // Static grid (no DnD) while filtering.
    return (
      <ul className="grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rates.map((rate) => (
          <li key={rate.symbol}>
            <CryptoCard rate={rate} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToParentElement]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveSymbol(null)}
    >
      <SortableContext items={symbols} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rates.map((rate) => (
            <SortableCryptoCard key={rate.symbol} rate={rate} />
          ))}
        </div>
      </SortableContext>

      {/* Floating clone that follows the cursor for a smoother drag feel. */}
      <DragOverlay>
        {activeRate ? <CryptoCard rate={activeRate} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
