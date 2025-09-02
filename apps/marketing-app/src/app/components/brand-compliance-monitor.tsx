/**
 * Brand Compliance Monitor
 * 
 * Development component that displays brand voice compliance in real-time.
 * Only shown in development mode to help maintain marketing culture guidelines.
 */

'use client';

import React, { useState } from 'react';
import { validateCopy, type CopyValidationResult } from '../lib/copy-validator';

interface BrandComplianceMonitorProps {
  enabled?: boolean; // Only show in development
}

export function BrandComplianceMonitor({ enabled = process.env.NODE_ENV === 'development' }: BrandComplianceMonitorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [testText, setTestText] = useState('');
  const [validation, setValidation] = useState<CopyValidationResult | null>(null);

  if (!enabled) return null;

  const handleTestCopy = () => {
    if (testText.trim()) {
      const result = validateCopy(testText);
      setValidation(result);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error': return '🚫';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
        >
          Brand Check
        </button>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-96 max-h-96 overflow-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Brand Voice Checker</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <label htmlFor="test-copy" className="block text-sm font-medium text-gray-700 mb-2">
                Test Your Copy:
              </label>
              <textarea
                id="test-copy"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter marketing copy to validate..."
                className="w-full p-2 border border-gray-300 rounded text-sm"
                rows={3}
              />
              <button
                onClick={handleTestCopy}
                disabled={!testText.trim()}
                className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
              >
                Validate
              </button>
            </div>

            {validation && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Brand Score:</span>
                  <span className={`font-bold ${getScoreColor(validation.score)}`}>
                    {validation.score}/100
                  </span>
                </div>

                {validation.issues.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Issues:</h4>
                    <div className="space-y-1">
                      {validation.issues.map((issue, index) => (
                        <div key={index} className="text-xs">
                          <div className="flex items-start space-x-1">
                            <span>{getSeverityIcon(issue.severity)}</span>
                            <span className="text-gray-600">{issue.message}</span>
                          </div>
                          {issue.suggestion && (
                            <div className="ml-4 text-blue-600">💡 {issue.suggestion}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {validation.suggestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestions:</h4>
                    <div className="space-y-1">
                      {validation.suggestions.map((suggestion, index) => (
                        <div key={index} className="text-xs text-blue-600">
                          💡 {suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Brand Guidelines:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>✅ Problem-first approach</div>
                <div>✅ Direct, honest language</div>
                <div>✅ No marketing jargon</div>
                <div>✅ Action-oriented CTAs</div>
                <div>✅ Respect for time</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
