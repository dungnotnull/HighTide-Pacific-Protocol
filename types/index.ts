export type YearValue = { year: number; value: number };
export type DecadeValue = { decade: number; value: number };

export type SeaLevelCountry = {
  code: string;
  name: string;
  lat: number;
  lon: number;
  series: YearValue[];
};

export type GhgCountry = {
  code: string;
  name: string;
  lat: number;
  lon: number;
  latest_year: number;
  latest_value: number;
  series: YearValue[];
};

export type TempCountry = {
  code: string;
  name: string;
  lat: number;
  lon: number;
  latest_year: number;
  latest_value: number;
  decades: DecadeValue[];
  series: YearValue[];
};

export type EmitterContext = {
  label: string;
  value: number;
  group: "pacific" | "world";
  note?: string;
};

export type MigrationLink = { source: string; target: string; value: number };
export type MigrationData = {
  _note: string;
  nodes: { id: string }[];
  links: MigrationLink[];
  yearly_displacement: { _note: string; series: YearValue[] };
};