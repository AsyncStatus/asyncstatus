"use client";

import { useState, useEffect } from "react";

interface SavingsCalculatorProps {
  maxWidth?: string;
}

export default function SavingsCalculator({ maxWidth = "4xl" }: SavingsCalculatorProps) {
  const [teamSize, setTeamSize] = useState(25);
  const [avgSalary, setAvgSalary] = useState(140000);
  const [meetingLength, setMeetingLength] = useState(20);
  const [workingDays, setWorkingDays] = useState(20);
  
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [annualSavings, setAnnualSavings] = useState(0);
  const [hoursPerMonth, setHoursPerMonth] = useState(0);
  
  // Calculate savings whenever inputs change
  useEffect(() => {
    // Calculate hourly rate based on 260 working days per year, 8 hours per day
    const hourlyRate = avgSalary / (260 * 8);
    
    // Calculate hours spent in standup meetings per month
    const hours = (teamSize * meetingLength * workingDays) / 60;
    
    // Calculate monthly cost of standups
    const monthlyCost = hours * hourlyRate;
    
    // Set calculated values
    setHoursPerMonth(hours);
    setMonthlySavings(monthlyCost);
    setAnnualSavings(monthlyCost * 12);
  }, [teamSize, avgSalary, meetingLength, workingDays]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`mx-auto max-w-${maxWidth} bg-white p-6 rounded-lg shadow-md`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Adjust Your Team Parameters</h2>
          
          <div>
            <label htmlFor="team-size" className="block text-sm font-medium text-gray-700">
              Team Size: {teamSize} {teamSize === 1 ? 'person' : 'people'}
            </label>
            <input
              id="team-size"
              type="range"
              min="1"
              max="50"
              step="1"
              value={teamSize}
              onChange={(e) => setTeamSize(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>
          
          <div>
            <label htmlFor="avg-salary" className="block text-sm font-medium text-gray-700">
              Avg. Annual Salary: {formatCurrency(avgSalary)}
            </label>
            <input
              id="avg-salary"
              type="range"
              min="30000"
              max="250000"
              step="10000"
              value={avgSalary}
              onChange={(e) => setAvgSalary(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$30k</span>
              <span>$150k</span>
              <span>$250k</span>
            </div>
          </div>
          
          <div>
            <label htmlFor="meeting-length" className="block text-sm font-medium text-gray-700">
              Daily Standup Length: {meetingLength} minutes
            </label>
            <input
              id="meeting-length"
              type="range"
              min="5"
              max="30"
              step="5"
              value={meetingLength}
              onChange={(e) => setMeetingLength(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 min</span>
              <span>15 min</span>
              <span>30 min</span>
            </div>
          </div>
          
          <div>
            <label htmlFor="working-days" className="block text-sm font-medium text-gray-700">
              Working Days per Month: {workingDays} days
            </label>
            <input
              id="working-days"
              type="range"
              min="16"
              max="23"
              step="1"
              value={workingDays}
              onChange={(e) => setWorkingDays(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>16 days</span>
              <span>20 days</span>
              <span>23 days</span>
            </div>
          </div>
        </div>
        
        <div className="bg-indigo-50 p-6 rounded-lg flex flex-col justify-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Potential Savings</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Team time spent in standups monthly</p>
              <p className="text-2xl font-bold text-indigo-700">{hoursPerMonth.toFixed(1)} hours</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Monthly savings with AsyncStatus</p>
              <p className="text-3xl font-bold text-indigo-700">{formatCurrency(monthlySavings)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Annual savings with AsyncStatus</p>
              <p className="text-3xl font-bold text-indigo-700">{formatCurrency(annualSavings)}</p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-white rounded-lg border border-indigo-200">
            <p className="italic text-gray-700 text-sm">
              "Stand‑ups steal ~{meetingLength} min/day/person. On a {teamSize}‑dev team that's {hoursPerMonth.toFixed(0)} hrs/month = {formatCurrency(monthlySavings)} burn. Skip the call, keep the clarity."
            </p>
            <div className="mt-2 flex justify-between items-center">
              <button 
                onClick={() => {
                  const text = `Stand‑ups steal ~${meetingLength} min/day/person.\nOn a ${teamSize}‑dev team that's ${hoursPerMonth.toFixed(0)} hrs/month = ${formatCurrency(monthlySavings)} burn.\nSkip the call, keep the clarity.\n👉 asyncstatus.com`;
                  navigator.clipboard.writeText(text);
                }}
                className="text-indigo-600 text-sm hover:text-indigo-500 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy for X
              </button>
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Stand‑ups steal ~${meetingLength} min/day/person.\nOn a ${teamSize}‑dev team that's ${hoursPerMonth.toFixed(0)} hrs/month = ${formatCurrency(monthlySavings)} burn.\nSkip the call, keep the clarity.\n👉 asyncstatus.com`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 text-sm hover:text-indigo-500 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share on X
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 