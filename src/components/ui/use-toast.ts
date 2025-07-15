
// This file re-exports the useToast hook and toast function from our hooks directory
import { useToast as useToastHook, toast as toastFunc } from "@/hooks/use-toast";

export const useToast = useToastHook;
export const toast = toastFunc;
