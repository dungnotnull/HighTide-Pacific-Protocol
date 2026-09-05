// Create accurate Pacific Island Countries centroid coordinates
import fs from 'fs';

// Accurate coordinates for Pacific Island Countries (centroids)
const PIC_COORDINATES = [
  { code: 'FJ', name: 'Fiji', lat: -17.7134, lon: 178.0650 },
  { code: 'KI', name: 'Kiribati', lat: 1.8363, lon: -172.8152 },
  { code: 'MH', name: 'Marshall Islands', lat: 7.1315, lon: 171.1845 },
  { code: 'FM', name: 'Micronesia', lat: 7.4967, lon: 150.5534 },
  { code: 'NR', name: 'Nauru', lat: -0.5228, lon: 166.9315 },
  { code: 'PW', name: 'Palau', lat: 7.5150, lon: 134.5825 },
  { code: 'PG', name: 'Papua New Guinea', lat: -6.3150, lon: 143.9555 },
  { code: 'WS', name: 'Samoa', lat: -13.7590, lon: -172.1046 },
  { code: 'SB', name: 'Solomon Islands', lat: -9.6457, lon: 160.1562 },
  { code: 'TO', name: 'Tonga', lat: -21.1790, lon: -175.1982 },
  { code: 'TV', name: 'Tuvalu', lat: -7.4784, lon: 177.2016 },
  { code: 'VU', name: 'Vanuatu', lat: -15.3767, lon: 166.9692 },
  { code: 'CK', name: 'Cook Islands', lat: -21.2422, lon: -159.7767 },
  { code: 'NU', name: 'Niue', lat: -19.0560, lon: -169.8670 },
  { code: 'TK', name: 'Tokelau', lat: -9.1833, lon: -171.8167 },
  { code: 'AS', name: 'American Samoa', lat: -14.2710, lon: -170.7020 },
  { code: 'NC', name: 'New Caledonia', lat: -20.9130, lon: 165.3820 },
  { code: 'PF', name: 'French Polynesia', lat: -17.6797, lon: -149.3900 },
  { code: 'GU', name: 'Guam', lat: 13.4441, lon: 144.7937 },
  { code: 'MP', name: 'Northern Mariana Islands', lat: 15.1234, lon: 145.7362 },
];

// Create output JSON with accurate coordinates
const output = PIC_COORDINATES.map(country => ({
  code: country.code,
  name: country.name,
  lat: country.lat,
  lon: country.lon,
  latest_year: 2024,
  latest_value: 1.5, // Placeholder value, will be replaced with real data
  series: [] // Empty series for now
}));

fs.writeFileSync('./data/pic_countries.json', JSON.stringify(output, null, 2));

console.log('Generated pic_countries.json with', output.length, 'Pacific Island Countries');
console.log('Countries:', output.map(c => `${c.name} (${c.code})`).join(', '));
console.log('Using accurate lat/lon coordinates for precise map positioning');
