import { useQuery, useMutation } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { playNotificationSound } from "@/lib/notification-sound";

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  appointmentId: number | null;
  createdAt: string;
}

export function useNotifications() {
  const { toast } = useToast();
  
  // Referência para controlar a reprodução do som (evitar duplicação)
  const lastSoundPlayed = React.useRef<string | null>(null);
  const lastSoundTime = React.useRef<number>(0);
  
  // Função para tocar o som apenas uma vez por notificação
  const playSound = (notificationId: string | number) => {
    const id = notificationId.toString();
    const now = Date.now();
    
    // Verificar se já tocamos o som para esta notificação ou na últimos 3 segundos
    if (lastSoundPlayed.current === id || (now - lastSoundTime.current) < 3000) {
      console.log('Som já tocado para esta notificação ou tocado recentemente');
      return;
    }
    
    // Tocar o som
    playNotificationSound();
    
    // Atualizar controles para evitar repetição
    lastSoundPlayed.current = id;
    lastSoundTime.current = now;
  };
  
  // Atualizar com uma referência do useEffect para garantir que as atualizações ocorram
  useEffect(() => {
    const checkForUpdates = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    };
    
    // Verificar uma vez a cada 15 segundos
    const interval = setInterval(checkForUpdates, 15000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Buscar todas as notificações
  const { data: allNotifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      console.log('Buscando todas as notificações');
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Falha ao buscar notificações');
      const data = await res.json();
      console.log('Notificações recebidas:', data);
      return data;
    },
    staleTime: 15000, // 15 segundos para mais responsividade
    refetchInterval: 30000, // Re-buscar a cada 30 segundos
  });
  
  // Buscar notificações não lidas
  const { 
    data: unreadNotifications = [], 
    isLoading: isLoadingUnread,
    refetch: refetchUnread 
  } = useQuery<Notification[]>({
    queryKey: ['/api/notifications/unread'],
    queryFn: async () => {
      console.log('Buscando notificações não lidas');
      const res = await fetch('/api/notifications/unread');
      if (!res.ok) throw new Error('Falha ao buscar notificações não lidas');
      const data = await res.json();
      console.log('Notificações não lidas recebidas:', data);
      return data;
    },
    staleTime: 15000, // 15 segundos para mais responsividade
    refetchInterval: 20000, // Re-buscar a cada 20 segundos
    refetchOnWindowFocus: true, // Recarregar quando a janela receber foco
  });

  // Usar WebSocket para atualizar notificações em tempo real
  const { connected } = useWebSocket({
    onMessage: (data) => {
      console.log('WebSocket message recebida no hook de notificações:', data);
      
      // Se for um novo agendamento criado
      if (data.type === 'appointment_created') {
        console.log('Novo agendamento detectado, atualizando notificações');
        // Quando um novo agendamento é criado, recarregar as notificações não lidas
        refetchUnread();
        
        // Tocar som de notificação uma vez só (usando o ID do agendamento)
        const appointmentId = data.data?.appointment?.id || 'appointment_' + Date.now();
        playSound(appointmentId);
        
        toast({
          title: 'Nova notificação',
          description: 'Você recebeu um novo agendamento',
          variant: 'info',
        });
      }
      
      // Se for uma nova notificação
      if (data.type === 'notification_created') {
        console.log('Nova notificação detectada via WebSocket:', data);
        
        // Extrair dados da notificação com tratamento de erros
        const notificationData = data.data || data;
        const notification = notificationData.notification;
        
        if (notification) {
          console.log('Notificação recebida:', notification);
          
          // Forçar atualização imediata das queries
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
          
          // Forçar refetch imediato sem esperar o cache
          refetchUnread();
          
          // Tocar som de notificação uma vez só (usando o ID da notificação)
          playSound(notification.id);
          
          // Mostrar toast
          toast({
            title: notification.title || 'Nova notificação',
            description: notification.message || 'Você tem uma nova notificação',
            variant: 'info',
          });
        } else {
          console.error('Notificação recebida via WebSocket sem dados de notificação:', data);
        }
      }
    },
  });
  
  // Mutação para marcar uma notificação como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('PATCH', `/api/notifications/${id}/mark-as-read`);
    },
    onSuccess: () => {
      // Invalidar queries para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao marcar notificação como lida',
        variant: 'destructive',
      });
    },
  });
  
  // Mutação para marcar todas as notificações como lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/notifications/mark-all-as-read');
    },
    onSuccess: () => {
      // Invalidar queries para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      
      toast({
        title: 'Notificações',
        description: 'Todas as notificações foram marcadas como lidas',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao marcar todas notificações como lidas',
        variant: 'destructive',
      });
    },
  });
  
  return {
    allNotifications,
    unreadNotifications,
    unreadCount: unreadNotifications.length,
    isLoadingUnread,
    markAsRead: (id: number) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    isConnected: connected,
  };
}