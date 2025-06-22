import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import CallDetails from '@/components/CallDetails';
import { processCall } from '@/lib/api/processing';
import { toast } from 'react-hot-toast';
import { Checkbox } from '@/components/ui/Checkbox';
import AudioPlayer from '@/components/AudioPlayer';
import LibraryFilters from '@/components/LibraryFilters';
import { getCallStatus } from '@/lib/api/database';

type Call = {
  id: string;
  file_path: string;
  call_date: string;
  status: string;
  duration: number;
  analyses:
    | {
        performance_score: number;
        summary: string;
      }[]
    | null;
};

export default function Library() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedCalls, setSelectedCalls] = useState<string[]>([]);
  const [processingBulk, setProcessingBulk] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    field: 'date',
    direction: 'desc' as const,
  });
  const [dateFilter, setDateFilter] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    fetchCalls();

    const channel = supabase
      .channel('calls-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
        },
        fetchCalls
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select(
          `
          id,
          file_path,
          call_date,
          status,
          duration,
          analyses (
            performance_score,
            summary
          )
        `
        )
        .order('call_date', { ascending: false });

      if (error) throw error;
      setCalls(data || []);
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedCalls = useMemo(() => {
    let result = [...calls];

    // Apply date filter
    if (dateFilter.startDate || dateFilter.endDate) {
      result = result.filter((call) => {
        const callDate = new Date(call.call_date);
        if (dateFilter.startDate && callDate < dateFilter.startDate) return false;
        if (dateFilter.endDate && callDate > dateFilter.endDate) return false;
        return true;
      });
    }

    // Apply search filter
    if (searchQuery) {
      result = result.filter((call) =>
        call.file_path.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortConfig.field === 'date') {
        return sortConfig.direction === 'desc'
          ? new Date(b.call_date).getTime() - new Date(a.call_date).getTime()
          : new Date(a.call_date).getTime() - new Date(b.call_date).getTime();
      } else if (sortConfig.field === 'duration') {
        const aDuration = typeof a.duration === 'number' ? a.duration : 0;
        const bDuration = typeof b.duration === 'number' ? b.duration : 0;
        return sortConfig.direction === 'desc'
          ? bDuration - aDuration
          : aDuration - bDuration;
      }
      return 0;
    });

    return result;
  }, [calls, searchQuery, sortConfig, dateFilter]);

  const selectableCalls = useMemo(() => {
    return filteredAndSortedCalls.filter(call => call.status !== 'completed');
  }, [filteredAndSortedCalls]);

  const allSelectableSelected = useMemo(() => 
    selectableCalls.length > 0 && selectableCalls.every(call => selectedCalls.includes(call.id)),
    [selectableCalls, selectedCalls]
  );

  const handleAnalyze = async (callId: string) => {
    const toastId = toast.loading('Starting analysis...');
    try {
      const call = calls.find((c) => c.id === callId);
      if (!call) return;

      await processCall(callId, call.file_path, (status) => {
        toast.loading(status, { id: toastId });
      });

      const finalStatus = await getCallStatus(callId);
      if (finalStatus === 'completed') {
        toast.success('Call processed successfully', { id: toastId });
      } else {
        toast.error('Failed to process call', { id: toastId });
      }

      const { data: updatedCall } = await supabase
        .from('calls')
        .select(
          `
          id,
          file_path,
          call_date,
          status,
          duration,
          analyses (
            performance_score,
            summary
          )
        `
        )
        .eq('id', callId)
        .single();

      if (updatedCall) {
        setCalls((prev) =>
          prev.map((call) => (call.id === callId ? updatedCall : call))
        );
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to process call', { id: toastId });
    }
  };

  const handleBulkAnalyze = async () => {
    setProcessingBulk(true);
    const toastId = toast.loading(
      `Processing ${selectedCalls.length} calls...`
    );

    try {
      for (const callId of selectedCalls) {
        const call = calls.find((c) => c.id === callId);
        if (!call || call.status === 'completed') continue;

        await processCall(callId, call.file_path, (status) => {
          toast.loading(`${status} (${callId})`, { id: toastId });
        });
      }

      toast.success('All selected calls processed successfully', {
        id: toastId,
      });
      setSelectedCalls([]);
      await fetchCalls();
    } catch (error) {
      console.error('Bulk processing error:', error);
      toast.error('Failed to process some calls', { id: toastId });
    } finally {
      setProcessingBulk(false);
    }
  };

  const toggleCallSelection = (callId: string) => {
    setSelectedCalls((prev) =>
      prev.includes(callId)
        ? prev.filter((id) => id !== callId)
        : [...prev, callId]
    );
  };

  const toggleAllCalls = () => {
    if (allSelectableSelected) {
      setSelectedCalls([]);
    } else {
      setSelectedCalls(selectableCalls.map(call => call.id));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Call Library</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all uploaded calls and their analysis status
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {selectedCalls.length > 0 && (
            <Button
              onClick={handleBulkAnalyze}
              isLoading={processingBulk}
              disabled={processingBulk}
            >
              Analyze Selected ({selectedCalls.length})
            </Button>
          )}
        </div>
      </div>

      <LibraryFilters
        onSearch={setSearchQuery}
        onSort={(field, direction) => setSortConfig({ field, direction })}
        onDateFilter={(startDate, endDate) => setDateFilter({ startDate, endDate })}
      />

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="px-3 py-3.5">
                  <Checkbox
                    checked={allSelectableSelected}
                    onChange={toggleAllCalls}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  File Name
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Audio
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Score
                </th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedCalls.map((call) => (
                <tr key={call.id}>
                  <td className="px-3 py-4">
                    {call.status !== 'completed' && (
                      <Checkbox
                        checked={selectedCalls.includes(call.id)}
                        onChange={() => toggleCallSelection(call.id)}
                      />
                    )}
                  </td>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                    {format(new Date(call.call_date), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {call.file_path.split('-').slice(1).join('-')}
                  </td>
                  <td className="px-3 py-4">
                    <AudioPlayer filePath={call.file_path} callId={call.id} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        call.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : call.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {call.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {call.analyses?.[0]?.performance_score ?? '-'}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    {call.status === 'completed' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedCallId(call.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        View details
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAnalyze(call.id)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-900"
                      >
                        Analyze
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCallId && (
        <CallDetails
          callId={selectedCallId}
          onClose={() => setSelectedCallId(null)}
        />
      )}
    </div>
  );
}