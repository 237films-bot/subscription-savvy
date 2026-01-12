import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Subscription } from '@/types/subscription';
import { SubscriptionCard } from './SubscriptionCard';
import { GripVertical } from 'lucide-react';

interface SortableSubscriptionCardProps {
  subscription: Subscription;
  onUpdate: (id: string, updates: Partial<Subscription>) => void;
  onDelete: (id: string) => void;
}

export function SortableSubscriptionCard({ subscription, onUpdate, onDelete }: SortableSubscriptionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subscription.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent/50 transition-colors"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="pl-8">
        <SubscriptionCard
          subscription={subscription}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
