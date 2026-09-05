// Script to generate countries-50m.json from world-atlas
import pkg from 'world-atlas';
const { countries } = pkg;
import * as fs from 'fs';

const data = JSON.stringify(countries, null, 2);

fs.writeFileSync('./data/countries-50m.json', data);
console.log('Generated countries-50m.json successfully');
