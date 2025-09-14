import { cn } from "@/lib/utils";

interface PosCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export const PosCard: React.FC<PosCardProps> = ({ 
  children, 
  className, 
  title, 
  description 
}) => {
  return (
    <div className={cn("pos-card", className)}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};