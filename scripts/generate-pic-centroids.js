// Script to compute accurate country centroids from topojson and create country code mapping
import fs from 'fs';

// Pacific Island Countries we need with their ISO codes
const PIC_COUNTRY_NAMES = [
  'Fiji',                  // FJ
  'Kiribati',              // KI
  'Marshall Islands',       // MH
  'Micronesia',            // FM (Federated States of Micronesia)
  'Nauru',                 // NR
  'Palau',                 // PW
  'Papua New Guinea',      // PG
  'Samoa',                 // WS
  'Solomon Islands',       // SB
  'Tonga',                 // TO
  'Tuvalu',                // TV
  'Vanuatu',               // VU
  'Cook Islands',          // CK
  'Niue',                  // NU
  'Tokelau',               // TK
  'American Samoa',        // AS
  'New Caledonia',         // NC (France)
  'French Polynesia',     // PF (France)
  'Guam',                  // GU (USA)
  'Northern Mariana Islands', // MP (USA)
  'Pitcairn Islands',     // PN (UK)
];

// Accurate coordinates for Pacific Island Countries
const PIC_COORDINATES = {
  'Fiji': { lat: -17.7134, lon: 178.0650, code: 'FJ' },
  'Kiribati': { lat: 1.8363, lon: -172.8152, code: 'KI' },
  'Marshall Islands': { lat: 7.1315, lon: 171.1845, code: 'MH' },
  'Micronesia': { lat: 7.4967, lon: 150.5534, code: 'FM' },
  'Nauru': { lat: -0.5228, lon: 166.9315, code: 'NR' },
  'Palau': { lat: 7.5150, lon: 134.5825, code: 'PW' },
  'Papua New Guinea': { lat: -6.3150, lon: 143.9555, code: 'PG' },
  'Samoa': { lat: -13.7590, lon: -172.1046, code: 'WS' },
  'Solomon Islands': { lat: -9.6457, lon: 160.1562, code: 'SB' },
  'Tonga': { lat: -21.1790, lon: -175.1982, code: 'TO' },
  'Tuvalu': { lat: -7.4784, lon: 177.2016, code: 'TV' },
  'Vanuatu': { lat: -15.3767, lon: 166.9692, code: 'VU' },
  'Cook Islands': { lat: -21.2422, lon: -159.7767, code: 'CK' },
  'Niue': { lat: -19.0560, lon: -169.8670, code: 'NU' },
  'Tokelau': { lat: -9.1833, lon: -171.8167, code: 'TK' },
  'American Samoa': { lat: -14.2710, lon: -170.7020, code: 'AS' },
  'New Caledonia': { lat: -20.9130, lon: 165.3820, code: 'NC' },
  'French Polynesia': { lat: -17.6797, lon: -149.3900, code: 'PF' },
  'Guam': { lat: 13.4441, lon: 144.7937, code: 'GU' },
  'Northern Mariana Islands': { lat: 15.1234, lon: 145.7362, code: 'MP' },
  'Pitcairn Islands': { lat: -24.3767, lon: -128.3242, code: 'PN' },
};

// Compute centroid from topojson geometry
function computeCentroid(geometry) {
  if (!geometry) return null;

  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates || geometry.arcs;
    return computePolygonCentroid(Array.isArray(coords) ? coords[0] : coords);
  } else if (geometry.type === 'MultiPolygon') {
    const coords = geometry.coordinates || geometry.arcs;
    // For multipolygon, use the first polygon
    return computePolygonCentroid(Array.isArray(coords?.[0]) ? coords[0][0] : coords[0]);
  }

  return null;
}

function computePolygonCentroid(ring) {
  if (!ring || ring.length < 3) return null;

  let area = 0;
  let centerX = 0;
  let centerY = 0;

  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];

    const cross = (x1 * y2 - x2 * y1);
    area += cross;
    centerX += (x1 + x2) * cross;
    centerY += (y1 + y2) * cross;
  }

  if (area !== 0) {
    centerX /= (3 * area);
    centerY /= (3 * area);
  }

  return { x: centerX, y: centerY };
}

// Convert topojson coordinates to lat/lon
function topojsonToLonLat(x, y, transform) {
  const { scale, translate } = transform;
  const lon = x / scale + translate[0];
  const lat = -y / scale + translate[1];
  return { lon, lat };
}

// Load countries-50m.json
const countriesData = JSON.parse(fs.readFileSync('./data/countries-50m.json', 'utf8'));
const countriesObj = countriesData.objects.countries;
const transform = countriesData.transform;

// Create mapping from country names to accurate coordinates
const countryCoordsMap = {};

// Use our accurate PIC coordinates
for (const [name, coords] of Object.entries(PIC_COORDINATES)) {
  countryCoordsMap[name.toLowerCase()] = coords;
}

// For countries in topojson, compute centroids as backup
countriesObj.geometries.forEach(geom => {
  if (geom.properties && geom.properties.name) {
    const name = geom.properties.name.toLowerCase();
    if (!countryCoordsMap[name]) {
      // Compute centroid from topojson
      const centroid = computeCentroid(geom);
      if (centroid) {
        const coords = topojsonToLonLat(centroid.x, centroid.y, transform);
        countryCoordsMap[name] = {
          lat: coords.lat,
          lon: coords.lon,
          code: geom.id
        };
      }
    }
  }
});

// Create the output file
const output = {
  type: 'FeatureCollection',
  features: Object.entries(countryCoordsMap).map(([name, coords]) => ({
    type: 'Feature',
    properties: {
      name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      code: coords.code,
      lat: coords.lat,
      lon: coords.lon
    },
    geometry: {
      type: 'Point',
      coordinates: [coords.lon, coords.lat]
    }
  }))
};

fs.writeFileSync('./data/pic_centroids.json', JSON.stringify(output, null, 2));

console.log('Generated pic_centroids.json with', output.features.length, 'countries');
console.log('Countries:', output.features.map(f => f.properties.name).join(', '));
