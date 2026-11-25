/** GeoJSON ST_NM values are normalized to the protected CSV State_UT keys. */
export const GEOJSON_TO_CSV_NAME: Record<string, string> = {
  'Andaman & Nicobar': 'ANDAMAN & NICOBAR ISLANDS',
  'Andhra Pradesh': 'ANDHRA PRADESH',
  'Arunachal Pradesh': 'ARUNACHAL PRADESH',
  Assam: 'ASSAM',
  Bihar: 'BIHAR',
  Chandigarh: 'CHANDIGARH',
  Chhattisgarh: 'CHHATTISGARH',
  'Dadra and Nagar Haveli and Daman and Diu': 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
  Delhi: 'DELHI',
  Goa: 'GOA',
  Gujarat: 'GUJARAT',
  Haryana: 'HARYANA',
  'Himachal Pradesh': 'HIMACHAL PRADESH',
  'Jammu & Kashmir': 'JAMMU & KASHMIR',
  Jharkhand: 'JHARKHAND',
  Karnataka: 'KARNATAKA',
  Kerala: 'KERALA',
  Ladakh: 'LADAKH',
  Lakshadweep: 'LAKSHADWEEP',
  'Madhya Pradesh': 'MADHYA PRADESH',
  Maharashtra: 'MAHARASHTRA',
  Manipur: 'MANIPUR',
  Meghalaya: 'MEGHALAYA',
  Mizoram: 'MIZORAM',
  Nagaland: 'NAGALAND',
  Odisha: 'ODISHA',
  Puducherry: 'PUDUCHERRY',
  Punjab: 'PUNJAB',
  Rajasthan: 'RAJASTHAN',
  Sikkim: 'SIKKIM',
  'Tamil Nadu': 'TAMIL NADU',
  Telangana: 'TELANGANA',
  Tripura: 'TRIPURA',
  'Uttar Pradesh': 'UTTAR PRADESH',
  Uttarakhand: 'UTTARAKHAND',
  'West Bengal': 'WEST BENGAL',
};

export function getStateForGeoJsonName<T>(
  geoJsonName: string | undefined,
  stateLookup: ReadonlyMap<string, T>,
): T | undefined {
  if (!geoJsonName) return undefined;
  const csvName = GEOJSON_TO_CSV_NAME[geoJsonName];
  return csvName ? stateLookup.get(csvName) : undefined;
}
