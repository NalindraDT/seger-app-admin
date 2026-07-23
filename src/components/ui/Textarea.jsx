import { ShadcnTextarea } from './shadcn/textarea';
import { cn } from '@/lib/utils';

export default function Textarea({ error, className = '', id, ...props }) {
  return (
    <ShadcnTextarea
      id={id}
      className={cn(
        error && 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500/15',
        className
      )}
      {...props}
    />
  );
}
