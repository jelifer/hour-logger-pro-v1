import { useState } from 'react';
import { Gift, Save } from 'lucide-react';

interface HolidayCalculatorProps {
  onSaveToWeek: (hours: number) => void;
}

export function HolidayCalculator({ onSaveToWeek }: HolidayCalculatorProps) {
  const [totalHours, setTotalHours] = useState(160);
  const [daysWorked, setDaysWorked] = useState(20);
  const [saving, setSaving] = useState(false);

  const hoursPerDay = totalHours / daysWorked;
  const calculatedHours = isFinite(hoursPerDay) ? hoursPerDay : 0;

  const handleSaveToWeek = async () => {
    setSaving(true);
    try {
      await onSaveToWeek(calculatedHours);
      setTimeout(() => setSaving(false), 500);
    } catch (error) {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Public Holiday Pay Calculator</h2>
      </div>
      <p className="text-sm text-gray-600 mb-6">Calculate public holiday pay entitlement in hours</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Hours (4 weeks)
          </label>
          <input
            type="number"
            value={totalHours}
            onChange={(e) => setTotalHours(parseInt(e.target.value) || 0)}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Days worked in last 4 weeks
          </label>
          <input
            type="number"
            value={daysWorked}
            onChange={(e) => setDaysWorked(parseInt(e.target.value) || 0)}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <p className="text-sm text-gray-600 mb-2">Calculated Holiday Pay Hours</p>
          <p className="text-3xl font-bold text-blue-600">{calculatedHours.toFixed(2)} hours</p>
          <p className="text-xs text-gray-500 mt-2">per holiday</p>
        </div>

        <button
          onClick={handleSaveToWeek}
          disabled={saving || !isFinite(hoursPerDay)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saved!' : 'Save to This Week'}
        </button>
      </div>
    </div>
  );
}
