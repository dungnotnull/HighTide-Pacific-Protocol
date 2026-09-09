import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { countryCode } = await request.json();
    if (!countryCode) return NextResponse.json({ error: 'Missing country code' }, { status: 400 });

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in .env' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Load data
    const riskData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'protocol', 'risk_allocation.json'), 'utf8'));
    const forecastData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'protocol', 'forecasts.json'), 'utf8'));
    
    let prompt = '';

    if (countryCode === 'RP') {
      prompt = `
You are a highly acclaimed climate scientist and policy advisor specializing in the Pacific Island Countries.
Your task is to provide 3 specific, data-driven recommendations to mitigate WASH (Water, Sanitation, and Hygiene) damages and utilize Carbon Debt parametric insurance payouts for the entire Regional Pacific (all 13 nations collectively).

Context Data:
- The parametric insurance pool distributes a combined $10M reference payout across 13 vulnerable nations.
- The region faces unprecedented sea level rise and severe acute ENSO (La Niña) anomalies, leading to widespread salinization of freshwater lenses.

Instructions:
1. Provide a brief 1-sentence opening acknowledging the systemic regional risk based on the data.
2. Outline exactly 3 strategic, cross-border infrastructure or policy recommendations for WASH that could be funded cooperatively by the parametric insurance payouts.
3. Your recommendations must be grounded in real science. You MUST cite reputable sources (e.g., IPCC AR6 WGII, WHO/UNICEF JMP, World Bank, Pacific Data Hub) inline or at the end. Do not hallucinate data.
4. Format your response strictly in Markdown. Use bolding for emphasis. Do not include introductory pleasantries like "Sure, here are the recommendations:".
      `;
    } else {
      const countryRisk = riskData.countries[countryCode];
      const countryForecast = forecastData.countries[countryCode];

      if (!countryRisk || !countryForecast) {
        return NextResponse.json({ error: 'Country data not found' }, { status: 404 });
      }

      prompt = `
You are a highly acclaimed climate scientist and policy advisor specializing in the Pacific Island Countries.
Your task is to provide 3 specific, data-driven recommendations to mitigate WASH (Water, Sanitation, and Hygiene) damages and utilize Carbon Debt parametric insurance payouts for the country: ${countryRisk.name}.

Context Data:
- Long-term Sea Level Trend: ${countryRisk.trend_mm_yr} mm/year
- Sea Level Anomaly Exceedance Probability (Acute Risk): ${(countryRisk.exceedance_prob * 100).toFixed(2)}%
- Allocation Weight from $10M Pool: ${(countryRisk.allocation_weight * 100).toFixed(2)}% ($${(countryRisk.allocation_weight * 10000000).toLocaleString()})
- AI Predicted 2030 Sea Level Anomaly (Extreme Scenario hi95): ${countryForecast.trigger_forecast.hi95[4].toFixed(2)} standard deviations above normal.

Instructions:
1. Provide a brief 1-sentence opening acknowledging the specific risk level based on the data.
2. Outline exactly 3 strategic infrastructure or policy recommendations for WASH that could be funded by the parametric insurance payout mentioned above.
3. Your recommendations must be grounded in real science. You MUST cite reputable sources (e.g., IPCC AR6 WGII, WHO/UNICEF JMP, World Bank, Pacific Data Hub) inline or at the end. Do not hallucinate data.
4. Format your response strictly in Markdown. Use bolding for emphasis. Do not include introductory pleasantries like "Sure, here are the recommendations:".
`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt,
    });

    return NextResponse.json({ recommendation: response.text });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
