import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, formatHearingTime, getTeamCaseStatusLabel } from '../../utils/lawyerUtils';

export default function LawyerHearingsCalendar({ hearings }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const shortMonthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  // Normalize hearing dates to local midnight for accurate comparison
  const getNormalizedDate = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };

  const hearingDatesMap = hearings.reduce((acc, hearing) => {
    if (!hearing.hearingDate) return acc;
    const time = getNormalizedDate(hearing.hearingDate);
    if (!time) return acc;
    if (!acc[time]) acc[time] = [];
    acc[time].push(hearing);
    return acc;
  }, {});

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const time = date.getTime();
      const dayHearings = hearingDatesMap[time] || [];
      const hasHearings = dayHearings.length > 0;
      const isSelected = selectedDate && selectedDate.getTime() === time;

      days.push(
        <div key={day} className="relative flex justify-center w-full">
          <button
            onClick={() => setSelectedDate(isSelected ? null : date)}
            className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex flex-col items-center justify-center text-sm font-bold transition-all duration-300 relative group ${
              isSelected
                ? 'bg-[#f1d15f] text-[#0d1117] shadow-[0_4px_15px_rgba(241,209,95,0.4)] scale-110 z-10'
                : hasHearings
                  ? 'bg-[#f1d15f]/15 text-[#0d1117] hover:bg-[#f1d15f]/30 hover:scale-105'
                  : 'text-[#6f633f] hover:bg-gray-100'
            }`}
          >
            <span className="relative z-10">{day}</span>
            {hasHearings && !isSelected && (
              <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-[#d6a400] shadow-[0_0_5px_#f1d15f]"></span>
            )}
            {isSelected && (
               <motion.div 
                 layoutId="active-date-ring"
                 className="absolute inset-0 rounded-full border-2 border-[#d6a400]"
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1.15 }}
                 transition={{ duration: 0.3 }}
               />
            )}
          </button>
        </div>
      );
    }
    return days;
  };

  const selectedHearings = selectedDate ? (hearingDatesMap[selectedDate.getTime()] || []) : [];
  
  // Sort hearings by time if available
  const sortedHearings = [...selectedHearings].sort((a, b) => {
    const timeA = a.hearingTime || "00:00";
    const timeB = b.hearingTime || "00:00";
    return timeA.localeCompare(timeB);
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Premium Calendar Grid */}
      <div className="bg-white rounded-3xl border border-[#e5e7eb] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 sm:p-8 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#f1d15f]/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0d1117] tracking-tight">{monthNames[month]} <span className="font-light text-[#6f633f]">{year}</span></h2>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#d6a400] mt-1">
               {Object.keys(hearingDatesMap).length} active hearing days
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={prevMonth} className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-[#e5e7eb] shadow-sm hover:border-[#f1d15f] hover:text-[#d6a400] text-[#0d1117] transition-all cursor-pointer">
              <FaChevronLeft size={14} />
            </button>
            <button onClick={nextMonth} className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-[#e5e7eb] shadow-sm hover:border-[#f1d15f] hover:text-[#d6a400] text-[#0d1117] transition-all cursor-pointer">
              <FaChevronRight size={14} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-y-6 gap-x-2 relative z-10">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-[#988b64] uppercase tracking-widest mb-2">{day}</div>
          ))}
          {renderDays()}
        </div>
      </div>

      {/* Premium Floating-like Bottom Details */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate.getTime()}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
            className="w-full relative overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(241,209,95,0.15)] bg-[#fffdf3] border border-[#e9d889]"
          >
            {/* Soft overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#f1d15f]/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#f1d15f]/30 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row relative z-10">
              {/* Left Side - Big Date Display */}
              <div className="md:w-1/3 p-8 border-b md:border-b-0 md:border-r border-[#e9d889]/50 flex flex-col items-center md:items-start justify-center backdrop-blur-sm bg-[#f9f5e8]/50">
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black text-[#0d1117] tracking-tighter leading-none">{selectedDate.getDate()}</span>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-[#6f633f] leading-none">{shortMonthNames[selectedDate.getMonth()]}</span>
                    <span className="text-sm font-semibold text-[#988b64] leading-tight">{selectedDate.getFullYear()}</span>
                  </div>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 bg-[#f1d15f]/15 border border-[#f1d15f]/40 rounded-full px-4 py-1.5">
                  <div className={`w-2 h-2 rounded-full ${selectedHearings.length > 0 ? 'bg-[#d6a400] shadow-[0_0_8px_#f1d15f] animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-bold text-[#2b2412]">
                    {selectedHearings.length} {selectedHearings.length === 1 ? 'Hearing' : 'Hearings'}
                  </span>
                </div>
              </div>

              {/* Right Side - Timeline/List of Hearings */}
              <div className="md:w-2/3 p-6 sm:p-8">
                {selectedHearings.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-70">
                    <div className="w-16 h-16 rounded-full bg-[#f1d15f]/10 flex items-center justify-center mb-4 border border-[#e9d889]">
                      <FaClock className="text-2xl text-[#d6a400]" />
                    </div>
                    <p className="text-lg font-bold text-[#0d1117]">No hearings scheduled</p>
                    <p className="text-sm text-[#6f633f] mt-1">You're clear for this day.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {sortedHearings.map((hearing, idx) => (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                        key={`${hearing.id}-${hearing.teamCode || 'team'}`}
                        className="group relative bg-white hover:bg-[#fffaf0] border border-[#e9d889] hover:border-[#d6a400] transition-all duration-300 rounded-2xl p-5 shadow-sm"
                      >
                        {/* Hover glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#f1d15f]/0 via-[#f1d15f]/0 to-[#f1d15f]/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity pointer-events-none"></div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#f1d15f] to-[#e8ce57] border border-[#e9d889] flex flex-col items-center justify-center shadow-inner shrink-0">
                               <span className="text-xs font-bold text-[#2b2412] uppercase">{formatHearingTime(hearing.hearingTime).split(' ')[1] || 'AM'}</span>
                               <span className="text-lg font-black text-[#0d1117] leading-none">{formatHearingTime(hearing.hearingTime).split(':')[0] + ':' + formatHearingTime(hearing.hearingTime).split(':')[1].split(' ')[0]}</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-[#0d1117] group-hover:text-[#d6a400] transition-colors line-clamp-1">{hearing.caseTitle || 'Untitled Case'}</h4>
                              <p className="text-sm text-[#6f633f] mt-0.5 font-medium">Client: {hearing.clientName || 'Not added'}</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center justify-center rounded-full bg-[#fff4bf] border border-[#e9d889] px-3 py-1 text-xs font-bold text-[#d6a400] whitespace-nowrap self-start sm:self-auto">
                            {getTeamCaseStatusLabel(hearing.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#e9d889]/50">
                          <div className="flex items-start gap-2 text-sm text-[#2b2412]">
                            <FaMapMarkerAlt className="mt-0.5 text-[#988b64]" />
                            <span className="font-medium line-clamp-1">{hearing.courtName || 'Court N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#2b2412]">
                            <span className="text-[#6f633f] font-mono text-xs px-2 py-0.5 bg-[#fff4bf] rounded border border-[#e9d889] uppercase tracking-wider">TEAM</span>
                            <span className="font-bold tracking-widest">{hearing.teamCode || 'N/A'}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
