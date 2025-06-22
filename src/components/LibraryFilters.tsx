import { useState } from 'react';
import { Search, SortAsc, SortDesc, Calendar } from 'lucide-react';
import { Button } from './ui/Button';
import { format } from 'date-fns';

interface LibraryFiltersProps {
  onSearch: (query: string) => void;
  onSort: (field: string, direction: 'asc' | 'desc') => void;
  onDateFilter: (startDate: Date | null, endDate: Date | null) => void;
}

export default function LibraryFilters({ onSearch, onSort, onDateFilter }: LibraryFiltersProps) {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handleSort = (field: string) => {
    const newDirection = field === sortField && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(newDirection);
    onSort(field, newDirection);
  };

  const handleDateFilter = () => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    onDateFilter(start, end);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by file name..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div className="flex gap-2">
        <Button
          variant={sortField === 'date' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => handleSort('date')}
          className="flex items-center gap-2"
        >
          Date
          {sortField === 'date' && (
            sortDirection === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant={sortField === 'duration' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => handleSort('duration')}
          className="flex items-center gap-2"
        >
          Duration
          {sortField === 'duration' && (
            sortDirection === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Date Range
        </Button>
      </div>

      {showDatePicker && (
        <div className="absolute z-10 mt-16 right-0 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  onDateFilter(null, null);
                  setShowDatePicker(false);
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handleDateFilter();
                  setShowDatePicker(false);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}