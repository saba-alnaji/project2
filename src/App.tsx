import { Toaster } from "@/components/ui/toaster"; // الـ Toast القديم (احتفظ به حالياً)
import { Toaster as Sonner } from "@/components/ui/sonner"; // الـ Sonner الجديد
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import router from "./router";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster /> 

      <Sonner  richColors 
        dir="rtl" 
        position="bottom-right" 
        closeButton 
      />

      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;