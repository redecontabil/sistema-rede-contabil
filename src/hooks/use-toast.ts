
import { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string | ReactNode;
  variant?: "default" | "destructive";
  action?: ReactNode;
  [key: string]: any;
};

export const useToast = () => {
  const toast = ({ title, description, variant, ...props }: ToastProps) => {
    sonnerToast(title || "", {
      description,
      ...props,
    });
  };

  return {
    toast,
    toasts: [] as any[],
  };
};

export const toast = ({ title, description, variant, ...props }: ToastProps) => {
  sonnerToast(title || "", {
    description,
    ...props,
  });
};
