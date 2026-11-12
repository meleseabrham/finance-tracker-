import { useState, useRef, useEffect } from 'react';
import {
  format,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  isBefore,
  isAfter,
  parseISO,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowRight, X } from 'lucide-react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DateRangePicker({ startDate, endDate, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    startDate ? startOfMonth(parseISO(startDate)) : startOfMonth(new Date())
  );
  const [pendingStart, setPendingStart] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setPendingStart(null);
        setHoverDate(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDayClick = (day) => {
    if (!pendingStart) {
      setPendingStart(day);
      setHoverDate(day);
    } else {
      let start = pendingStart;
      let end = day;
      if (isBefore(end, start)) {
        [start, end] = [end, start];
      }
      setPendingStart(null);
      setHoverDate(null);
      onChange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
      setOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setPendingStart(null);
    setHoverDate(null);
    onChange('', '');
  };

  const activeStart = pendingStart || (startDate ? parseISO(startDate) : null);
  const activeEnd = pendingStart ? hoverDate : (endDate ? parseISO(endDate) : null);

  const rangeStart =
    activeStart && activeEnd && isAfter(activeStart, activeEnd) ? activeEnd : activeStart;
  const rangeEnd =
    activeStart && activeEnd && isAfter(activeStart, activeEnd) ? activeStart : activeEnd;

  const renderMonth = (monthDate, isSecondMonth = false) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calStart, end: calEnd });
    const today = new Date();

    return (
      <div className={`w-full md:w-64 ${isSecondMonth ? 'hidden md:block' : ''}`}>
        {/* Month Header */}
        <div className="flex items-center justify-between px-1 pb-3 mb-2 border-b border-gray-100">
          <div className="flex items-center gap-1">
            {!isSecondMonth && (
              <>
                <button
                  type="button"
                  onClick={() => setViewMonth((m) => subYears(m, 1))}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  title="Previous year"
                >
                  <ChevronsLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMonth((m) => subMonths(m, 1))}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  title="Previous month"
                >
                  <ChevronLeft size={15} />
                </button>
              </>
            )}
          </div>

          <span className="text-sm font-semibold text-gray-800">
            {format(monthDate, 'MMM yyyy')}
          </span>

          <div className="flex items-center gap-1">
            <div className={isSecondMonth ? 'flex items-center gap-1' : 'flex items-center gap-1 md:hidden'}>
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                title="Next month"
              >
                <ChevronRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMonth((m) => addYears(m, 1))}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                title="Next year"
              >
                <ChevronsRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 text-center mb-1">
          {WEEKDAYS.map((d) => (
            <span key={d} className="text-xs font-medium text-gray-500 py-1">
              {d}
            </span>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-y-0.5 text-center">
          {days.map((day) => {
            const inCurrentMonth = isSameMonth(day, monthDate);
            const isToday = isSameDay(day, today);
            const isStart = rangeStart && isSameDay(day, rangeStart);
            const isEnd = rangeEnd && isSameDay(day, rangeEnd);
            const inRange =
              inCurrentMonth &&
              rangeStart &&
              rangeEnd &&
              isWithinInterval(day, { start: rangeStart, end: rangeEnd });

            return (
              <div
                key={day.toISOString()}
                className={`flex items-center justify-center ${
                  inRange && !isStart && !isEnd ? 'bg-indigo-50' : ''
                } ${isStart && rangeEnd && !isSameDay(rangeStart, rangeEnd) ? 'bg-gradient-to-r from-transparent via-indigo-50 to-indigo-50' : ''} ${
                  isEnd && rangeStart && !isSameDay(rangeStart, rangeEnd) ? 'bg-gradient-to-l from-transparent via-indigo-50 to-indigo-50' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => pendingStart && setHoverDate(day)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors flex items-center justify-center ${
                    !inCurrentMonth
                      ? 'text-gray-300 hover:bg-gray-50'
                      : isStart || isEnd
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : isToday
                          ? 'border border-indigo-500 text-indigo-600 font-semibold hover:bg-indigo-50'
                          : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const secondMonth = addMonths(viewMonth, 1);

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen((o) => !o); }}
        className={`input flex items-center justify-between gap-2 cursor-pointer select-none min-w-[240px] sm:min-w-[270px] ${
          open ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
        }`}
      >
        <div className="flex items-center gap-2 text-sm truncate">
          <span className={startDate ? 'text-gray-800 font-medium' : 'text-gray-400'}>
            {startDate ? format(parseISO(startDate), 'MMM d, yyyy') : 'Start date'}
          </span>
          <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
          <span className={endDate ? 'text-gray-800 font-medium' : 'text-gray-400'}>
            {endDate ? format(parseISO(endDate), 'MMM d, yyyy') : 'End date'}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded text-gray-400 hover:text-gray-600"
              aria-label="Clear date range"
            >
              <X size={14} />
            </button>
          )}
          <Calendar size={15} className="text-gray-400" />
        </div>
      </div>

      {open && (
        <div className="absolute right-0 mt-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-[calc(100vw-2rem)] max-w-[320px] md:max-w-none md:w-auto">
          <div className="flex gap-6">
            {renderMonth(viewMonth, false)}
            {renderMonth(secondMonth, true)}
          </div>
          {pendingStart && (
            <p className="text-xs text-indigo-600 mt-3 pt-2 border-t border-gray-100 text-center">
              Select an end date to apply range
            </p>
          )}
        </div>
      )}
    </div>
  );
}
