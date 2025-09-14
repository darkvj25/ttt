import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const posButtonVariants = cva(
  "transition-all duration-200 font-medium",
  {
    variants: {
      posVariant: {
        primary: "bg-primary hover:bg-primary-hover text-primary-foreground shadow-primary",
        secondary: "bg-secondary hover:bg-secondary-hover text-secondary-foreground",
        success: "bg-success hover:bg-success/90 text-success-foreground",
        warning: "bg-warning hover:bg-warning/90 text-warning-foreground",
        destructive: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
        cash: "bg-success hover:bg-success/90 text-success-foreground shadow-lg",
        card: "bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg",
      },
    },
    defaultVariants: {
      posVariant: "primary",
    },
  }
);

export interface PosButtonProps
  extends ButtonProps,
    VariantProps<typeof posButtonVariants> {
  posVariant?: VariantProps<typeof posButtonVariants>["posVariant"];
}

export const PosButton: React.FC<PosButtonProps> = ({
  className,
  posVariant,
  ...props
}) => {
  return (
    <Button
      className={cn(posButtonVariants({ posVariant }), className)}
      {...props}
    />
  );
};