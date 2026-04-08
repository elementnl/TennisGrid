export const COUNTRY_LABELS = {
  USA: "United States", AUS: "Australia", GBR: "United Kingdom", FRA: "France",
  GER: "Germany", ESP: "Spain", ITA: "Italy", RSA: "South Africa",
  ARG: "Argentina", JPN: "Japan", SWE: "Sweden", CZE: "Czech Republic",
  RUS: "Russia", NED: "Netherlands", CAN: "Canada", BRA: "Brazil",
  SUI: "Switzerland", AUT: "Austria", CHN: "China", MEX: "Mexico",
  IND: "India", ROU: "Romania", COL: "Colombia", BEL: "Belgium",
  CRO: "Croatia", SRB: "Serbia", POL: "Poland", GRE: "Greece",
  CHI: "Chile", DEN: "Denmark", KOR: "South Korea", UKR: "Ukraine",
  NOR: "Norway", PER: "Peru", HUN: "Hungary", TPE: "Taiwan",
  NZL: "New Zealand", THA: "Thailand", ECU: "Ecuador", IRL: "Ireland",
  POR: "Portugal", FIN: "Finland", SVK: "Slovakia", BUL: "Bulgaria",
  SLO: "Slovenia", GEO: "Georgia", KAZ: "Kazakhstan", BLR: "Belarus",
  ISR: "Israel", TUR: "Turkey", URU: "Uruguay", VEN: "Venezuela",
  LAT: "Latvia", LTU: "Lithuania", EST: "Estonia", LUX: "Luxembourg",
  PHI: "Philippines", PAR: "Paraguay", DOM: "Dominican Republic",
  BOL: "Bolivia", PAK: "Pakistan", TUN: "Tunisia", MAR: "Morocco",
  EGY: "Egypt", NGR: "Nigeria", ZIM: "Zimbabwe", UZB: "Uzbekistan",
  MON: "Monaco", CYP: "Cyprus", BIH: "Bosnia", MNE: "Montenegro",
  INA: "Indonesia", TTO: "Trinidad & Tobago", CRC: "Costa Rica",
  HAI: "Haiti", CUB: "Cuba", PUR: "Puerto Rico", JAM: "Jamaica",
  BAR: "Barbados", BAH: "Bahamas", BER: "Bermuda",
};

const IOC_TO_ISO = {
  USA: "US", AUS: "AU", GBR: "GB", FRA: "FR", GER: "DE", ESP: "ES",
  ITA: "IT", RSA: "ZA", ARG: "AR", JPN: "JP", SWE: "SE", CZE: "CZ",
  RUS: "RU", NED: "NL", CAN: "CA", BRA: "BR", SUI: "CH", AUT: "AT",
  CHN: "CN", MEX: "MX", IND: "IN", ROU: "RO", COL: "CO", BEL: "BE",
  CRO: "HR", SRB: "RS", POL: "PL", GRE: "GR", CHI: "CL", DEN: "DK",
  KOR: "KR", UKR: "UA", NOR: "NO", PER: "PE", HUN: "HU", TPE: "TW",
  NZL: "NZ", THA: "TH", ECU: "EC", IRL: "IE", POR: "PT", FIN: "FI",
  SVK: "SK", BUL: "BG", SLO: "SI", GEO: "GE", KAZ: "KZ", BLR: "BY",
  ISR: "IL", TUR: "TR", URU: "UY", VEN: "VE", LAT: "LV", LTU: "LT",
  EST: "EE", LUX: "LU", PHI: "PH", PAR: "PY", DOM: "DO", BOL: "BO",
  PAK: "PK", TUN: "TN", MAR: "MA", EGY: "EG", NGR: "NG", ZIM: "ZW",
  UZB: "UZ", MON: "MC", CYP: "CY", BIH: "BA", MNE: "ME", INA: "ID",
  TTO: "TT", CRC: "CR", HAI: "HT", CUB: "CU", PUR: "PR", JAM: "JM",
  BAR: "BB", BAH: "BS", BER: "BM",
};

export function getFlagUrl(iocCode, size = 24) {
  const iso = IOC_TO_ISO[iocCode];
  if (!iso) return null;
  return `https://flagsapi.com/${iso}/flat/${size}.png`;
}
