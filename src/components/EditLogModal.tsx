import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { WorkLog } from '../lib/supabase';

interface EditLogModalProps {
  log: WorkLog | null;
  onClose: () => void;
  onSave: (id: string, data: {
    date: string;
    time_in: string;
    time_out: string;
    break_minutes: number;
  }) => Promise<void>;
}

export function EditLogModal({ log, onClose, onSave }: EditLogModalProps) {
  const [date, setDate] = useState('');
  const [timeIn, setTimeIn] = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (log) {
      setDate(log.date);
      setTimeIn(log.time_in.substring(0, 5));
      setTimeOut(log.time_out.substring(0, 5));
      setBreakMinutes(log.break_minutes);
    }
  }, [log]);

  if (!log) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(log.id, {
        date,
        time_in: timeIn,
        time_out: timeOut,
        break_minutes: breakMinutes,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Edit Work Log</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
