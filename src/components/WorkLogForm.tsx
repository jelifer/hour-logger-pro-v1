import { useState } from 'react';
import { Calendar, Save } from 'lucide-react';

interface WorkLogFormProps {
  onSave: (data: {
    date: string;
    time_in: string;
    time_out: string;
    break_minutes: number;
  }) => Promise<void>;
}

export function WorkLogForm({ onSave }: WorkLogFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeIn, setTimeIn] = useState('09:00');
  const [timeOut, setTimeOut] = useState('17:00');
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        date,
        time_in: timeIn,
        time_out: timeOut,
        break_minutes: breakMinutes,
      });
      setDate(new Date().toISOString().split('T')[0]);
      setTimeIn('09:00');
      setTimeOut('17:00');
      setBreakMinutes(30);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Add Work Log</h2>
      </div>
      <p className="text-sm text-gray-600 mb-6">Log your daily work hours and breaks</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time In</label>
            <input
              type="time"
              value={timeIn}
              onChange={(e) => setTimeIn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Out</label>
            <input
              type="time"
              value={timeOut}
              onChange={(e) => setTimeOut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Break (minutes)</label>
          <input
            type="number"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Log'}
        </button>
      </form>
    </div>
  );
}
