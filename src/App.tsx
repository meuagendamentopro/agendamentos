import React, { useState, useEffect, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Services from "@/pages/services";
import Appointments from "@/pages/appointments";
import Clients from "@/pages/clients";
import Booking from "@/pages/booking";
import Settings from "@/pages/settings";
import ProfilePage from "@/pages/profile-page";
import AuthPage from "@/pages/auth-page";
import EmailVerificationPage from "@/pages/email-verification-page";
import FinancialReport from "@/pages/financial-report";
import AdminPage from "@/pages/admin-page";
import UsersPage from "@/pages/admin/users-page";
import RenewSubscriptionPage from "@/pages/renew-subscription";
import SubscriptionHistoryPage from "@/pages/subscription-history";
import MainNav from "@/components/layout/main-nav";
import MobileNav from "@/components/layout/mobile-nav";
import UserAvatar from "@/components/layout/user-avatar";
import WhatsAppPopup from "@/components/whatsapp-popup";
import { useNotifications } from "@/hooks/use-notifications";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";

function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { unreadNotifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  // Integra o WebSocket para atualizações em tempo real
  const { connected, error } = useWebSocket({
    onMessage: (data) => {
      // Exibe uma notificação quando um agendamento for atualizado
      if (data.type === 'appointment_updated') {
        const appointment = data.data;
        
        let title = "Agendamento atualizado";
        let description = `O agendamento #${appointment.id} foi atualizado.`;
        
        if (appointment.status === 'confirmed') {
          title = "Agendamento confirmado";
          description = `O agendamento #${appointment.id} foi confirmado.`;
        } else if (appointment.status === 'cancelled') {
          title = "Agendamento cancelado";
          description = `O agendamento #${appointment.id} foi cancelado.`;
        } else if (appointment.status === 'completed') {
          title = "Agendamento concluído";
          description = `O agendamento #${appointment.id} foi marcado como concluído.`;
        }
        
        toast({
          title,
          description,
          variant: appointment.status === 'cancelled' ? "destructive" : "default",
        });
      } else if (data.type === 'appointment_created') {
        const appointment = data.data;
        
        // Exibe uma notificação quando um novo agendamento for criado
        toast({
          title: "Novo agendamento recebido!",
          description: `Um novo agendamento foi criado para o dia ${new Date(appointment.date).toLocaleDateString()}.`,
        });
      }
    }
  });
  
  // Registra o toast como um gatilho global para permitir que outros componentes o utilizem
  useEffect(() => {
    window.__TOAST_TRIGGER = toast;
    return () => {
      window.__TOAST_TRIGGER = undefined;
    };
  }, [toast]);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* WhatsApp Popup */}
      {user && <WhatsAppPopup />}
      
      {/* MAIN NAVIGATION */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-primary-600 text-xl font-bold">AgendaPro</span>
              </div>
              
              <MainNav />
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {/* Popover para notificações */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <span className="sr-only">Ver notificações</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                    </svg>
                    
                    {/* Contador de notificações */}
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 max-w-sm p-0 rounded-lg border bg-white shadow-xl" align="end">
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                        </svg>
                        Notificações
                        {unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </h3>
                      {unreadCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={markAllAsRead}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                        >
                          Marcar todas como lidas
                        </Button>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="h-[350px]">
                    {unreadNotifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                        <div className="bg-gray-50 p-4 rounded-full mb-3">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="24" 
                            height="24" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            className="h-10 w-10 text-gray-400"
                          >
                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                          </svg>
                        </div>
                        <p className="text-sm font-medium">Não há notificações não lidas</p>
                        <p className="text-xs text-gray-400 mt-1">As novas notificações aparecerão aqui</p>
                      </div>
                    ) : (
                      <div>
                        {unreadNotifications.map((notification) => {
                          // Determinar o tipo de notificação e definir cores e ícones
                          let bgColor = "bg-gray-50";
                          let iconColor = "text-gray-500";
                          let icon = (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                            </svg>
                          );
                          
                          if (notification.title.includes("Novo")) {
                            bgColor = "bg-blue-50";
                            iconColor = "text-blue-600";
                            icon = (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v8"/>
                                <path d="M8 12h8"/>
                              </svg>
                            );
                          } else if (notification.title.includes("confirmado")) {
                            bgColor = "bg-green-50";
                            iconColor = "text-green-600";
                            icon = (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                              </svg>
                            );
                          } else if (notification.title.includes("cancelado")) {
                            bgColor = "bg-red-50";
                            iconColor = "text-red-600";
                            icon = (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                              </svg>
                            );
                          }
                          
                          return (
                            <div 
                              key={notification.id}
                              className={`p-4 border-b border-gray-100 hover:bg-opacity-80 cursor-pointer transition-all ${bgColor}`}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-1 ${iconColor}`}>
                                  {icon}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-semibold text-gray-800">
                                      {notification.title}
                                    </h4>
                                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2 font-medium">
                                      {format(new Date(notification.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="p-2 border-t border-gray-100 bg-gray-50">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="w-full text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center gap-1"
                      onClick={() => setLocation("/notifications")}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                      Ver todas as notificações
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {user && (
                <div className="flex items-center space-x-2">
                  <UserAvatar 
                    name={user.name}
                    email={user.username}
                    imageUrl={user.avatarUrl || undefined}
                  />
                  <button
                    onClick={handleLogout}
                    className="ml-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                    disabled={logoutMutation.isPending}
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
            
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* PAGE CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Rotas públicas para autenticação */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/verify-email/:token" component={EmailVerificationPage} />
      
      {/* Rota para renovação de assinatura */}
      <Route path="/renew-subscription" component={RenewSubscriptionPage} />
      
      {/* Rotas públicas para agendamento de clientes (ambos formatos) */}
      <Route path="/booking" component={Booking} />
      <Route path="/booking/:linkId" component={Booking} />
      
      {/* Rotas protegidas que exigem autenticação */}
      <ProtectedRoute 
        path="/" 
        element={
          <MainLayout>
            <Dashboard />
          </MainLayout>
        } 
      />
      
      <ProtectedRoute 
        path="/profile" 
        element={
          <MainLayout>
            <ProfilePage />
          </MainLayout>
        } 
      />
      
      <ProtectedRoute 
        path="/services" 
        element={
          <MainLayout>
            <Services />
          </MainLayout>
        } 
      />
      
      <ProtectedRoute 
        path="/appointments" 
        element={
          <MainLayout>
            <Appointments />
          </MainLayout>
        } 
      />
      
      <ProtectedRoute 
        path="/clients" 
        element={
          <MainLayout>
            <Clients />
          </MainLayout>
        } 
      />
      
      <ProtectedRoute 
        path="/settings" 
        element={
          <MainLayout>
            <Settings />
          </MainLayout>
        } 
      />
      
      <ProtectedRoute 
        path="/financial" 
        element={
          <MainLayout>
            <FinancialReport />
          </MainLayout>
        } 
      />
      
      <ProtectedRoute 
        path="/subscription-history" 
        element={
          <MainLayout>
            <SubscriptionHistoryPage />
          </MainLayout>
        } 
      />
      
      <AdminRoute 
        path="/admin" 
        element={
          <MainLayout>
            <AdminPage />
          </MainLayout>
        } 
      />
      
      <AdminRoute 
        path="/admin/users" 
        element={
          <MainLayout>
            <UsersPage />
          </MainLayout>
        } 
      />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
