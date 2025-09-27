"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { LogEntry } from "@/lib/types";
import {
  differenceInMinutes,
  format,
  parse,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWeekend,
  parseISO,
} from "date-fns";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { useUser, useFirestore, useCollection, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import Header from "@/components/app/header";
import SummaryCards from "@/components/app/summary-cards";
import LogForm from "@/components/app/log-form";
import LogHistory, { PrintableLogHistory } from "@/components/app/log-history";
import PublicHolidayPayCalculator from "@/components/app/public-holiday-pay-calculator";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);

  const [filterYear, setFilterYear] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  
  const [savedHolidayHours, setSavedHolidayHours] = useState<number>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('savedHolidayHours');
          return saved ? parseFloat(saved) : 0;
      }
      return 0;
  });
  const [manualWeeklyHours, setManualWeeklyHours] = useState<number | null>(null);
  const { toast } = useToast();

  const logsCollectionRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'logs');
  }, [firestore, user]);

  const { data: logs, isLoading: isLoadingLogs } = useCollection<LogEntry>(logsCollectionRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);
  
  useEffect(() => {
      if (typeof window !== 'undefined') {
          localStorage.setItem('savedHolidayHours', savedHolidayHours.toString());
      }
  }, [savedHolidayHours]);

  const resetManualHours = () => {
    setManualWeeklyHours(null);
  };

  const handleAddOrUpdateLog = (logData: Omit<LogEntry, "id">, id?: string) => {
    if (!logsCollectionRef) return;
    
    if (editingLog && editingLog.id) {
      const docRef = doc(logsCollectionRef, editingLog.id);
      setDocumentNonBlocking(docRef, { ...logData, updatedAt: serverTimestamp() }, { merge: true });
    } else {
      addDocumentNonBlocking(logsCollectionRef, { ...logData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    setEditingLog(null);
    resetManualHours();
  };

  const handleDeleteLog = (id: string) => {
    if (!logsCollectionRef) return;
    const docRef = doc(logsCollectionRef, id);
    deleteDocumentNonBlocking(docRef);
    resetManualHours();
  };
  
  const handleSaveHolidayHours = (hours: number) => {
    setSavedHolidayHours(prev => {
      const newTotal = prev + hours;
      return parseFloat(newTotal.toFixed(2));
    });
    toast({
      title: 'Holiday Hours Saved',
      description: `${hours.toFixed(2)} hours have been added to your weekly total.`
    });
    resetManualHours();
  };

  const calculateHoursForLog = (log: LogEntry): number => {
    if (!log.timeIn || !log.timeOut) return 0;
    const timeInDate = parse(log.timeIn, "HH:mm", new Date(log.date));
    const timeOutDate = parse(log.timeOut, "HH:mm", new Date(log.date));
    const diff = differenceInMinutes(timeOutDate, timeInDate);
    return (diff - log.breakMinutes) / 60;
  };

  const { dailyHours, weeklyHours } = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    
    if (!logs) return { dailyHours: 0, weeklyHours: 0 };
    
    const todayLog = logs.find((log) => log.date === todayStr);
    const daily = todayLog ? calculateHoursForLog(todayLog) : 0;

    if (manualWeeklyHours !== null) {
        return { dailyHours: daily, weeklyHours: manualWeeklyHours };
    }

    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    let weekly = 0;
    daysInWeek.forEach((day) => {
      if (isWeekend(day)) return;
      const dayStr = format(day, "yyyy-MM-dd");
      const logForDay = logs.find((log) => log.date === dayStr);

      if (logForDay) {
        weekly += calculateHoursForLog(logForDay);
      }
    });

    if (logs.length === 0 && savedHolidayHours > 0) {
        setSavedHolidayHours(0); 
    }

    const finalWeeklyHours = logs.length > 0 ? weekly + savedHolidayHours : 0;
    return { dailyHours: daily, weeklyHours: parseFloat(finalWeeklyHours.toFixed(2)) };
  }, [logs, savedHolidayHours, manualWeeklyHours]);
  
  const { filteredAndSortedLogs, availableYears, availableMonths } = useMemo(() => {
    if (!logs) return { filteredAndSortedLogs: [], availableYears: [], availableMonths: [] };

    const years = new Set<string>();
    const months = new Set<string>();
    logs.forEach(log => {
      const logDate = parseISO(log.date);
      years.add(format(logDate, 'yyyy'));
      months.add(format(logDate, 'MM'));
    });

    const filtered = logs.filter(log => {
      const logDate = parseISO(log.date);
      if (filterYear && format(logDate, 'yyyy') !== filterYear) {
        return false;
      }
      if (filterMonth && format(logDate, 'MM') !== filterMonth) {
        return false;
      }
      if (filterStartDate && log.date < filterStartDate) {
        return false;
      }
      if (filterEndDate && log.date > filterEndDate) {
        return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : b.date.localeCompare(a.date);
    });

    return {
      filteredAndSortedLogs: sorted,
      availableYears: Array.from(years).sort((a, b) => b.localeCompare(a)),
      availableMonths: Array.from(months).sort((a, b) => a.localeCompare(b)),
    };
  }, [logs, sortOrder, filterYear, filterMonth, filterStartDate, filterEndDate]);
  
  const handleClearFilters = () => {
    setFilterYear("");
    setFilterMonth("");
    setFilterStartDate("");
    setFilterEndDate("");
  };
  
  const handleUpdateWeeklyHours = (newHours: number) => {
    setManualWeeklyHours(newHours);
    toast({
      title: 'Weekly Hours Updated',
      description: `This week's hours have been manually set to ${newHours.toFixed(2)}.`
    });
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 lg:p-12">
          <div className="grid gap-4 md:grid-cols-2 md:gap-8">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 flex flex-col gap-4 md:gap-8">
              <Skeleton className="h-96" />
              <Skeleton className="h-80" />
            </div>
            <div className="lg:col-span-2">
               <Skeleton className="h-[40rem]" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="print-only">
        <PrintableLogHistory logs={filteredAndSortedLogs} calculateHours={calculateHoursForLog} />
      </div>
      <div className="no-print">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 lg:p-12">
          <SummaryCards 
            dailyHours={dailyHours} 
            weeklyHours={weeklyHours} 
            onUpdateWeeklyHours={handleUpdateWeeklyHours}
          />
          <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 flex flex-col gap-4 md:gap-8">
              <LogForm
                onSave={handleAddOrUpdateLog}
                editingLog={editingLog}
                clearEditing={() => setEditingLog(null)}
              />
              <PublicHolidayPayCalculator onSave={handleSaveHolidayHours} />
            </div>
            <div className="lg:col-span-2 grid gap-4 md:gap-8">
              <LogHistory
                logs={filteredAndSortedLogs}
                isLoading={isLoadingLogs}
                onEdit={(log) => {
                  setEditingLog(log);
                  resetManualHours();
                }}
                onDelete={handleDeleteLog}
                calculateHours={calculateHoursForLog}
                sortOrder={sortOrder}
                onSortToggle={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                filters={{
                  year: filterYear,
                  month: filterMonth,
                  startDate: filterStartDate,
                  endDate: filterEndDate,
                }}
                onFilterChange={{
                  setYear: setFilterYear,
                  setMonth: setFilterMonth,
                  setStartDate: setFilterStartDate,
                  setEndDate: setFilterEndDate,
                }}
                onClearFilters={handleClearFilters}
                availableYears={availableYears}
                availableMonths={availableMonths}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
