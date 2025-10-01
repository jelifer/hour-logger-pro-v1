import { useState } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { WorkLog, Holiday } from '../lib/supabase';

interface HoursSummaryProps {
  logs: WorkLog[];
  holidays: Holiday[];
}

export function HoursSummary({ logs, holidays }: HoursSummaryProps) {
  const today = new Date().toISOString().split('T')[0];

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(new Date());
  const defaultStartDate = weekStart.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(today);

  const todayLog = logs.find(log => log.date === today);
  const todayHours = todayLog?.total_hours || 0;

  const filteredLogs = logs.filter(log => {
    if (startDate && log.date < startDate) return false;
    if (endDate && log.date > endDate) return false;
    return true;
  });

  const holidayDates = new Set(holidays.map(h => h.date));

  const filteredHolidayCount = filteredLogs.filter(log => holidayDates.has(log.date)).length;
  const filteredTotalHours = filteredLogs.reduce((sum, log) => sum + log.total_hours, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-600">Today's Hours</h3>
        </div>
        <div className="mt-2">
          <p className="text-3xl font-bold text-gray-800">{todayHours.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">Total hours logged for today</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-600">Date Range Hours</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-2">
          <p className="text-3xl font-bold text-gray-800">{filteredTotalHours.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">
            Total hours including {filteredHolidayCount} holiday{filteredHolidayCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
