import pkg from 'xlsx';
const { readFile: XLSX_readFile, utils: XLSX_utils } = pkg;
import * as fs from 'fs';
import * as path from 'path';
import _ from 'lodash';

const EXCEL_FILE = './data/all_data_v1.xlsx';
const OUTPUT_DIR = './data';

const workbook = XLSX_readFile(EXCEL_FILE);
const sheetNames = workbook.SheetNames;

console.log('Found sheets:', sheetNames);

// Helper to read a sheet as JSON
function readSheet(sheetName, options = {}) {
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX_utils.sheet_to_json(worksheet, options);
  return data;
}

// 1. sea_level.json - Sea level data by country
function createSeaLevelData() {
  console.log('Creating sea_level.json...');

  // Check if sheet exists
  const seaLevelSheet = sheetNames.find(s => s.toLowerCase().includes('sea') || s.toLowerCase().includes('level'));

  if (!seaLevelSheet) {
    console.log('  Sheet not found, creating dummy data...');
    return createDummySeaLevel();
  }

  const data = readSheet(seaLevelSheet);
  // Transform to expected format
  // Expected: SeaLevelCountry[] with code, name, lat, lon, series: YearValue[]
  // This is placeholder - actual transformation depends on Excel structure
  return createDummySeaLevel();
}

// 2. sea_level_pacific_avg.json - Pacific average sea level
function createSeaLevelAvg() {
  console.log('Creating sea_level_pacific_avg.json...');
  return [
    { year: 1993, value: 0 },
    { year: 1994, value: 3.2 },
    { year: 1995, value: 6.5 },
    { year: 1996, value: 9.8 },
    { year: 1997, value: 12.1 },
    { year: 1998, value: 15.4 },
    { year: 1999, value: 18.7 },
    { year: 2000, value: 22.0 },
    { year: 2001, value: 25.3 },
    { year: 2002, value: 28.6 },
    { year: 2003, value: 31.9 },
    { year: 2004, value: 35.2 },
    { year: 2005, value: 38.5 },
    { year: 2006, value: 41.8 },
    { year: 2007, value: 45.1 },
    { year: 2008, value: 48.4 },
    { year: 2009, value: 51.7 },
    { year: 2010, value: 55.0 },
    { year: 2011, value: 58.3 },
    { year: 2012, value: 61.6 },
    { year: 2013, value: 64.9 },
    { year: 2014, value: 68.2 },
    { year: 2015, value: 71.5 },
    { year: 2016, value: 74.8 },
    { year: 2017, value: 78.1 },
    { year: 2018, value: 81.4 },
    { year: 2019, value: 84.7 },
    { year: 2020, value: 88.0 },
    { year: 2021, value: 91.3 },
    { year: 2022, value: 94.6 },
    { year: 2023, value: 97.9 }
  ];
}

// 3. ghg_per_capita.json - GHG emissions per capita
function createGHGData() {
  console.log('Creating ghg_per_capita.json...');
  return createDummyGHG();
}

// 4. temperature_anomaly.json - Temperature anomaly by country
function createTemperatureAnomaly() {
  console.log('Creating temperature_anomaly.json...');
  return createDummyTemperature();
}

// 5. temperature_pacific_avg.json - Pacific average temperature
function createTemperatureAvg() {
  console.log('Creating temperature_pacific_avg.json...');
  const years = _.range(1850, 2026);
  return years.map(year => ({
    year,
    value: 0.8 + (year - 1850) * 0.015 + (year > 1970 ? (year - 1970) * 0.02 : 0)
  }));
}

// 6. emitters_context.json - Context data for emitters comparison
function createEmittersContext() {
  console.log('Creating emitters_context.json...');
  return {
    pacific_avg: 1.2,
    major_emitters: [
      { label: "Qatar", value: 35.1, group: "world" },
      { label: "Kuwait", value: 21.5, group: "world" },
      { label: "United Arab Emirates", value: 19.3, group: "world" },
      { label: "Bahrain", value: 18.2, group: "world" },
      { label: "Saudi Arabia", value: 17.1, group: "world" },
      { label: "Australia", value: 14.9, group: "world" },
      { label: "United States", value: 14.2, group: "world" },
      { label: "Canada", value: 14.1, group: "world" },
      { label: "Russia", value: 11.8, group: "world" },
      { label: "Germany", value: 8.8, group: "world" },
      { label: "Japan", value: 8.7, group: "world" },
      { label: "South Korea", value: 11.6, group: "world" },
      { label: "China", value: 7.9, group: "world" }
    ],
    pacific_countries: [
      { label: "Kiribati", value: 0.6, group: "pacific", lat: -3.37, lon: -168.73 },
      { label: "Marshall Islands", value: 0.5, group: "pacific", lat: 7.13, lon: 171.18 },
      { label: "Federated States of Micronesia", value: 0.7, group: "pacific", lat: 7.43, lon: 150.55 },
      { label: "Nauru", value: 0.4, group: "pacific", lat: -0.52, lon: 166.93 },
      { label: "Palau", value: 86.7, group: "pacific", lat: 7.52, lon: 134.58, note: "International shipping registry" },
      { label: "Papua New Guinea", value: 0.9, group: "pacific", lat: -6.31, lon: 143.95 },
      { label: "Solomon Islands", value: 0.5, group: "pacific", lat: -9.64, lon: 160.16 },
      { label: "Tonga", value: 1.8, group: "pacific", lat: -21.18, lon: -175.20 },
      { label: "Tuvalu", value: 0.4, group: "pacific", lat: -7.47, lon: 177.65 },
      { label: "Vanuatu", value: 0.6, group: "pacific", lat: -15.38, lon: 166.96 },
      { label: "Samoa", value: 1.2, group: "pacific", lat: -13.76, lon: -172.10 },
      { label: "Fiji", value: 1.9, group: "pacific", lat: -17.71, lon: 178.07 },
      { label: "New Caledonia", value: 18.4, group: "pacific", lat: -20.91, lon: 165.40, note: "Nickel processing industry" }
    ]
  };
}

// 7. migration_placeholder.json - Placeholder migration data
function createMigrationData() {
  console.log('Creating migration_placeholder.json...');
  return {
    _note: "This is fully placeholder data. Replace with actual analysis before submission.",
    nodes: [
      { id: "Kiribati" },
      { id: "Marshall Islands" },
      { id: "Federated States of Micronesia" },
      { id: "Nauru" },
      { id: "Palau" },
      { id: "Papua New Guinea" },
      { id: "Solomon Islands" },
      { id: "Tonga" },
      { id: "Tuvalu" },
      { id: "Vanuatu" },
      { id: "Samoa" },
      { id: "Fiji" },
      { id: "New Zealand" },
      { id: "Australia" },
      { id: "United States" }
    ],
    links: [
      { source: "Kiribati", target: "New Zealand", value: 2500 },
      { source: "Kiribati", target: "Australia", value: 1800 },
      { source: "Marshall Islands", target: "United States", value: 3200 },
      { source: "Marshall Islands", target: "New Zealand", value: 400 },
      { source: "Federated States of Micronesia", target: "United States", value: 2800 },
      { source: "Federated States of Micronesia", target: "New Zealand", value: 500 },
      { source: "Tuvalu", target: "New Zealand", value: 1200 },
      { source: "Tuvalu", target: "Australia", value: 300 },
      { source: "Nauru", target: "Australia", value: 400 },
      { source: "Tonga", target: "New Zealand", value: 4500 },
      { source: "Tonga", target: "Australia", value: 1500 },
      { source: "Samoa", target: "New Zealand", value: 3500 },
      { source: "Samoa", target: "Australia", value: 800 },
      { source: "Fiji", target: "New Zealand", value: 2500 },
      { source: "Fiji", target: "Australia", value: 1200 }
    ],
    yearly_displacement: {
      _note: "Placeholder cumulative displacement estimate (persons)",
      series: [
        { year: 2000, value: 5000 },
        { year: 2005, value: 12000 },
        { year: 2010, value: 25000 },
        { year: 2015, value: 42000 },
        { year: 2020, value: 68000 },
        { year: 2023, value: 85000 }
      ]
    }
  };
}

// Dummy data functions
function createDummySeaLevel() {
  const countries = [
    { code: "FJI", name: "Fiji", lat: -17.71, lon: 178.07 },
    { code: "KIR", name: "Kiribati", lat: -3.37, lon: -168.73 },
    { code: "MHL", name: "Marshall Islands", lat: 7.13, lon: 171.18 },
    { code: "FSM", name: "Micronesia", lat: 7.43, lon: 150.55 },
    { code: "NRU", name: "Nauru", lat: -0.52, lon: 166.93 },
    { code: "PLW", name: "Palau", lat: 7.52, lon: 134.58 },
    { code: "PNG", name: "Papua New Guinea", lat: -6.31, lon: 143.95 },
    { code: "SLB", name: "Solomon Islands", lat: -9.64, lon: 160.16 },
    { code: "TON", name: "Tonga", lat: -21.18, lon: -175.20 },
    { code: "TUV", name: "Tuvalu", lat: -7.47, lon: 177.65 },
    { code: "VUT", name: "Vanuatu", lat: -15.38, lon: 166.96 },
    { code: "WSM", name: "Samoa", lat: -13.76, lon: -172.10 },
    { code: "COK", name: "Cook Islands", lat: -21.24, lon: -159.78 },
    { code: "NIU", name: "Niue", lat: -19.05, lon: -169.87 },
    { code: "TKL", name: "Tokelau", lat: -9.17, lon: -171.82 },
    { code: "PYF", name: "French Polynesia", lat: -17.66, lon: -149.43 },
    { code: "NCL", name: "New Caledonia", lat: -20.91, lon: 165.40 },
    { code: "GUM", name: "Guam", lat: 13.44, lon: 144.79 },
    { code: "MNP", name: "Northern Mariana Islands", lat: 15.19, lon: 145.75 },
    { code: "ASM", name: "American Samoa", lat: -14.27, lon: -170.71 },
    { code: "NFK", name: "Norfolk Island", lat: -29.03, lon: 167.96 }
  ];

  const years = _.range(1993, 2024);

  return countries.map(country => {
    const baseValue = _.random(40, 90);
    const series = years.map((year, i) => ({
      year,
      value: baseValue + (i * 2.5) + _.random(-2, 2)
    }));

    return {
      code: country.code,
      name: country.name,
      lat: country.lat,
      lon: country.lon,
      latest_year: _.last(series)?.year,
      latest_value: _.last(series)?.value,
      series
    };
  });
}

function createDummyGHG() {
  const countries = [
    { code: "KIR", name: "Kiribati", lat: -3.37, lon: -168.73, value: 0.6 },
    { code: "MHL", name: "Marshall Islands", lat: 7.13, lon: 171.18, value: 0.5 },
    { code: "FSM", name: "Micronesia", lat: 7.43, lon: 150.55, value: 0.7 },
    { code: "NRU", name: "Nauru", lat: -0.52, lon: 166.93, value: 0.4 },
    { code: "PLW", name: "Palau", lat: 7.52, lon: 134.58, value: 86.7, note: "International shipping registry" },
    { code: "PNG", name: "Papua New Guinea", lat: -6.31, lon: 143.95, value: 0.9 },
    { code: "SLB", name: "Solomon Islands", lat: -9.64, lon: 160.16, value: 0.5 },
    { code: "TON", name: "Tonga", lat: -21.18, lon: -175.20, value: 1.8 },
    { code: "TUV", name: "Tuvalu", lat: -7.47, lon: 177.65, value: 0.4 },
    { code: "VUT", name: "Vanuatu", lat: -15.38, lon: 166.96, value: 0.6 },
    { code: "WSM", name: "Samoa", lat: -13.76, lon: -172.10, value: 1.2 },
    { code: "FJI", name: "Fiji", lat: -17.71, lon: 178.07, value: 1.9 },
    { code: "NCL", name: "New Caledonia", lat: -20.91, lon: 165.40, value: 18.4, note: "Nickel processing industry" },
    { code: "COK", name: "Cook Islands", lat: -21.24, lon: -159.78, value: 1.5 },
    { code: "NIU", name: "Niue", lat: -19.05, lon: -169.87, value: 0.8 },
    { code: "PYF", name: "French Polynesia", lat: -17.66, lon: -149.43, value: 2.1 },
    { code: "GUM", name: "Guam", lat: 13.44, lon: 144.79, value: 8.5 },
    { code: "ASM", name: "American Samoa", lat: -14.27, lon: -170.71, value: 3.2 }
  ];

  const years = _.range(1970, 2025);

  return countries.map(country => {
    const baseValue = country.value;
    const series = years.map((year, i) => ({
      year,
      value: baseValue * (0.3 + (i / years.length) * 0.7) + _.random(-0.1, 0.1, true)
    }));

    return {
      code: country.code,
      name: country.name,
      lat: country.lat,
      lon: country.lon,
      latest_year: _.last(series)?.year,
      latest_value: _.last(series)?.value,
      series,
      note: country.note
    };
  });
}

function createDummyTemperature() {
  const countries = [
    { code: "KIR", name: "Kiribati", lat: -3.37, lon: -168.73 },
    { code: "MHL", name: "Marshall Islands", lat: 7.13, lon: 171.18 },
    { code: "FSM", name: "Micronesia", lat: 7.43, lon: 150.55 },
    { code: "NRU", name: "Nauru", lat: -0.52, lon: 166.93 },
    { code: "PLW", name: "Palau", lat: 7.52, lon: 134.58 },
    { code: "PNG", name: "Papua New Guinea", lat: -6.31, lon: 143.95 },
    { code: "SLB", name: "Solomon Islands", lat: -9.64, lon: 160.16 },
    { code: "TON", name: "Tonga", lat: -21.18, lon: -175.20 },
    { code: "TUV", name: "Tuvalu", lat: -7.47, lon: 177.65 },
    { code: "VUT", name: "Vanuatu", lat: -15.38, lon: 166.96 },
    { code: "WSM", name: "Samoa", lat: -13.76, lon: -172.10 },
    { code: "FJI", name: "Fiji", lat: -17.71, lon: 178.07 },
    { code: "COK", name: "Cook Islands", lat: -21.24, lon: -159.78 },
    { code: "NIU", name: "Niue", lat: -19.05, lon: -169.87 },
    { code: "PYF", name: "French Polynesia", lat: -17.66, lon: -149.43 },
    { code: "NCL", name: "New Caledonia", lat: -20.91, lon: 165.40 },
    { code: "GUM", name: "Guam", lat: 13.44, lon: 144.79 },
    { code: "ASM", name: "American Samoa", lat: -14.27, lon: -170.71 },
    { code: "MNP", name: "Northern Mariana Islands", lat: 15.19, lon: 145.75 },
    { code: "TKL", name: "Tokelau", lat: -9.17, lon: -171.82 },
    { code: "TOK", name: "Tokelau", lat: -9.17, lon: -171.82 },
    { code: "NFK", name: "Norfolk Island", lat: -29.03, lon: 167.96 }
  ];

  const years = _.range(1850, 2026);
  const decades = _.range(1850, 2030, 10);

  return countries.map(country => {
    const baseAnomaly = _.random(0.7, 1.2, true);
    const series = years.map((year, i) => ({
      year,
      value: baseAnomaly + (i * 0.01) + (year > 1970 ? (year - 1970) * 0.02 : 0) + _.random(-0.05, 0.05, true)
    }));

    const decadeValues = decades.map(decade => {
      const decadeData = _.filter(series, d => d.year >= decade && d.year < decade + 10);
      const avgValue = _.meanBy(decadeData, 'value');
      return { decade, value: avgValue || 0 };
    });

    return {
      code: country.code,
      name: country.name,
      lat: country.lat,
      lon: country.lon,
      latest_year: _.last(series)?.year,
      latest_value: _.last(series)?.value,
      decades: decadeValues,
      series
    };
  });
}

// Write JSON file with comment
function writeJsonWithComment(filename, data, comment) {
  const filepath = path.join(OUTPUT_DIR, filename);
  const json = JSON.stringify(data, null, 2);
  const content = `// ${comment}\n${json}`;
  fs.writeFileSync(filepath, content);
  console.log(`  Created: ${filename}`);
}

// Main execution
console.log('Starting data file generation...\n');

const files = [
  { filename: 'sea_level.json', data: createDummySeaLevel(), comment: 'DUMMY DATA - Replace with actual data from all_data_v1.xlsx (CLIMATE_CHANGE_SEA_INDICATORS)' },
  { filename: 'sea_level_pacific_avg.json', data: createSeaLevelAvg(), comment: 'DUMMY DATA - Replace with actual data from all_data_v1.xlsx (CLIMATE_CHANGE_SEA_INDICATORS - unweighted Pacific average)' },
  { filename: 'ghg_per_capita.json', data: createDummyGHG(), comment: 'DUMMY DATA - Replace with actual data from all_data_v1.xlsx (CLIMATE_CHANGE_GHG_INDICATORS)' },
  { filename: 'temperature_anomaly.json', data: createDummyTemperature(), comment: 'DUMMY DATA - Replace with actual data from all_data_v1.xlsx (CLIMATE_CHANGE_TEMP_INDICATORS)' },
  { filename: 'temperature_pacific_avg.json', data: createTemperatureAvg(), comment: 'DUMMY DATA - Replace with actual data from all_data_v1.xlsx (CLIMATE_CHANGE_TEMP_INDICATORS - unweighted Pacific average)' },
  { filename: 'emitters_context.json', data: createEmittersContext(), comment: 'ILLUSTRATIVE DATA - Approximate global emitter comparisons for context. Replace with verified data before submission.' },
  { filename: 'migration_placeholder.json', data: createMigrationData(), comment: 'FULLY PLACEHOLDER DATA - DO NOT USE - Replace with actual migration analysis before submission' }
];

files.forEach(file => {
  writeJsonWithComment(file.filename, file.data, file.comment);
});

console.log('\nData file generation complete!');
console.log('NOTE: All files marked as DUMMY or PLACEHOLDER must be replaced with actual data before submission.');
