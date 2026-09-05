import json

targets = [
    'Cook Islands','Federated States of Micronesia','Fiji','Kiribati',
    'Nauru','Niue','Palau','Republic of Marshall Islands','Samoa',
    'Solomon Islands','Tonga','Tuvalu','Vanuatu'
]

print('=== Audit: JSON files vs 13 target countries ===')

files = {
    'ghg_per_capita.json': None,
    'sea_level.json': None,
    'temperature_anomaly.json': None,
    'clean_water.json': None,
}

# GHG
with open('data/ghg_per_capita.json') as f:
    ghg = json.load(f)
ghg_names = {d['name'] for d in ghg}
print(f'\n[ghg_per_capita.json] {len(ghg_names)} countries:')
for t in targets:
    status = 'OK  ' if t in ghg_names else 'MISS'
    print(f'  {status} {t}')

# Sea Level
with open('data/sea_level.json') as f:
    sea = json.load(f)
sea_names = set(sea.keys())
print(f'\n[sea_level.json] {len(sea_names)} countries:')
for t in targets:
    status = 'OK  ' if t in sea_names else 'MISS'
    print(f'  {status} {t}')

# Temperature
with open('data/temperature_anomaly.json') as f:
    temp = json.load(f)
temp_names = {d['name'] for d in temp}
print(f'\n[temperature_anomaly.json] {len(temp_names)} countries:')
for t in targets:
    status = 'OK  ' if t in temp_names else 'MISS'
    print(f'  {status} {t}')

# Clean water
with open('data/clean_water.json') as f:
    water = json.load(f)
water_names = set(water.keys())
print(f'\n[clean_water.json] {len(water_names)} countries:')
for t in targets:
    status = 'OK  ' if t in water_names else 'MISS'
    print(f'  {status} {t}')

# Check raw Excel for missing countries
print('\n=== Checking raw data for MISS countries ===')
import pandas as pd
df = pd.read_excel('data/pacific_data_all_final.xlsx', sheet_name='Sheet1')

# Marshall Islands GHG - what code?
mh_ghg = df[(df['dataset']=='pacific_ghg_yearly_worlddata') & (df['indicator_id']=='total_ghg')]
print(f'\nGHG total_ghg countries in raw: {sorted(mh_ghg["geo_pict"].unique())}')
mh_all = df[df['geo_pict']=='MH']['dataset'].unique()
print(f'MH datasets available: {list(mh_all)}')

# Clean water - what codes exist
cw = df[df['dataset']=='CLEAN_WATER']
print(f'\nCLEAN_WATER all codes: {sorted(cw["geo_pict"].unique())}')
# Check CK, SB, FM, MH in clean water
for code in ['CK','SB','FM','MH']:
    rows = cw[cw['geo_pict']==code]
    print(f'  {code}: {len(rows)} rows, indicators: {sorted(rows["indicator_id"].unique())}')
