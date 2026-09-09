'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const COUNTRIES = [
  { code: 'CK', name: 'Cook Islands' },
  { code: 'FJ', name: 'Fiji' },
  { code: 'FM', name: 'Federated States of Micronesia' },
  { code: 'KI', name: 'Kiribati' },
  { code: 'MH', name: 'Republic of Marshall Islands' },
  { code: 'NR', name: 'Nauru' },
  { code: 'NU', name: 'Niue' },
  { code: 'PW', name: 'Palau' },
  { code: 'SB', name: 'Solomon Islands' },
  { code: 'TO', name: 'Tonga' },
  { code: 'TV', name: 'Tuvalu' },
  { code: 'VU', name: 'Vanuatu' },
  { code: 'WS', name: 'Samoa' },
  { code: 'RP', name: 'Regional Pacific (All 13 Nations)' }
];

export default function AIRecommendationSection() {
  const [selectedCountry, setSelectedCountry] = useState('TV');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setRecommendation('');

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode: selectedCountry })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch recommendation');
      }

      setRecommendation(data.recommendation);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative bg-foam px-6 py-14 md:px-16" id="ai-recommendation">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
           <p className="eyebrow">Recommendation</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-emerald-600 mb-4 mt-4">
            AI Strategy & Recovery
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl">
            Leveraging AI model, our system dynamically generates scientific, data-driven strategies for WASH recovery utilizing the parametric Carbon Debt payouts.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 bg-[#112240] p-6 rounded-xl border border-emerald-900/50 h-fit">
            <h3 className="text-xl font-semibold text-slate-200 mb-4">Select Target Nation</h3>
            <select 
              className="w-full bg-[#0a192f] border border-emerald-800 text-slate-200 rounded p-3 mb-6 focus:outline-none focus:border-emerald-400 transition-colors"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-slate-500 text-white font-semibold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Data...
                </>
              ) : (
                'Generate Scientific Strategy'
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 text-red-200 rounded text-sm">
                ⚠️ {error}
              </div>
            )}
          </div>

          <div className="w-full md:w-2/3 bg-[#112240] p-6 sm:p-8 rounded-xl border border-emerald-900/50 min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-emerald-500/70 space-y-4 animate-pulse pt-10">
                <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-sm">Gemini is synthesizing climate models...</p>
              </div>
            ) : recommendation ? (
              <div className="prose prose-invert prose-emerald max-w-none text-slate-200">
                <ReactMarkdown>{recommendation}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 italic pt-10">
                Select a nation and generate to view AI-driven recommendations.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
