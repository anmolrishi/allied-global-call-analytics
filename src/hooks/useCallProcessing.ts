import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { processCall } from '@/lib/api/processing';
import { toast } from 'react-hot-toast';

export function useCallProcessing() {
  useEffect(() => {
    const channel = supabase
      .channel('call-processing')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
        },
        async (payload) => {
          if (payload.new && payload.new.status === 'pending') {
            const toastId = toast.loading('Processing call...');
            
            try {
              const { data } = await supabase.storage
                .from('call-recordings')
                .download(payload.new.file_path);

              if (data) {
                const file = new File([data], payload.new.file_path, {
                  type: 'audio/mpeg'
                });

                await processCall(
                  payload.new.id,
                  file,
                  (status) => {
                    toast.loading(status, { id: toastId });
                  }
                );

                toast.success('Call processed successfully', { id: toastId });
              }
            } catch (error) {
              console.error('Call processing error:', error);
              toast.error('Failed to process call', { id: toastId });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}