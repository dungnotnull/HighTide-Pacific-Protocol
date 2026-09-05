import { isTargetPic } from "./data";

// Country name to 2-letter ISO code mapping (matches ghg_per_capita.json from new dataset)
export function getCountryCode(countryName: string): string {
  const nameToCode: Record<string, string> = {
    // 13 Pacific Island Countries (2-letter codes matching new dataset)
    "Cook Islands": "CK",
    "Federated States of Micronesia": "FM",
    "Micronesia": "FM",
    "Micronesia, Federated State of": "FM",
    "Fiji": "FJ",
    "Kiribati": "KI",
    "Nauru": "NR",
    "Niue": "NU",
    "Palau": "PW",
    "Republic of Marshall Islands": "MH",
    "Marshall Islands": "MH",
    "Samoa": "WS",
    "Solomon Islands": "SB",
    "Tonga": "TO",
    "Tuvalu": "TV",
    "Vanuatu": "VU",
  };
  return nameToCode[countryName] || "";
}

// Check if a country is a Pacific Island Country
export function isPacificCountry(countryName: string): boolean {
  return isTargetPic(countryName);
}
