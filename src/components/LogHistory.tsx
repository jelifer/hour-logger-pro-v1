import { useState } from 'react';
import { History, CreditCard as Edit2, Trash2, Download, Search } from 'lucide-react';
import { WorkLog } from '../lib/supabase';

interface LogHistoryProps {
  logs: WorkLog[];
  onEdit: (log: WorkLog) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function LogHistory({ logs, onEdit, onDelete, isAdmin = false }: LogHistoryProps) {
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('All');
  const [searchUser, setSearchUser] = useState('');

  const years = ['All', ...Array.from(new Set(logs.map(log => new Date(log.date).getFullYear()))).sort((a, b) => b - a)];

  const uniqueUsers = isAdmin
    ? ['All', ...Array.from(new Set(logs.map(log => log.user_email).filter(Boolean))).sort()]
    : [];

  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    const logYear = logDate.getFullYear();
    const logMonth = logDate.getMonth();

    if (selectedYear !== 'All' && logYear !== parseInt(selectedYear)) return false;
    if (selectedMonth !== 'All' && logMonth !== MONTHS.indexOf(selectedMonth)) return false;
    if (startDate && log.date < startDate) return false;
    if (endDate && log.date > endDate) return false;

    if (isAdmin && selectedUser !== 'All' && log.user_email !== selectedUser) return false;

    if (isAdmin && searchUser.trim() !== '') {
      const userEmail = log.user_email?.toLowerCase() || '';
      const search = searchUser.toLowerCase();
      if (!userEmail.includes(search)) return false;
    }

    return true;
  });

  const handleExportPDF = () => {
    alert('PDF export functionality would be implemented here');
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Log History</h2>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-6">A record of all your logged work hours</p>

      {isAdmin && (
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by User</label>
              <select
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                  setSearchUser('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {uniqueUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search User by Name/Email</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => {
                    setSearchUser(e.target.value);
                    setSelectedUser('All');
                  }}
                  placeholder="Type to search..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All</option>
            {MONTHS.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {isAdmin && (
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
              )}
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time In</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time Out</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Break</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-gray-500">
                  No work logs found
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                  {isAdmin && (
                    <td className="py-3 px-4 text-sm text-gray-800 font-medium">
                      {log.user_email || 'Unknown'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-sm text-gray-800">{formatDate(log.date)}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{formatTime(log.time_in)}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{formatTime(log.time_out)}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{log.break_minutes} min</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">
                    {log.total_hours.toFixed(2)}h
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(log)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(log.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
