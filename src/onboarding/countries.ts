// Countries for the nationality question and the phone number.
// [ISO code, country, nationality, dial code]

export type Country = {
  code: string;
  name: string;
  nationality: string;
  dial: string;
};

const RAW: [string, string, string, string][] = [
  ["AF", "Afghanistan", "Afghan", "93"],
  ["AL", "Albania", "Albanian", "355"],
  ["DZ", "Algeria", "Algerian", "213"],
  ["AR", "Argentina", "Argentine", "54"],
  ["AM", "Armenia", "Armenian", "374"],
  ["AU", "Australia", "Australian", "61"],
  ["AT", "Austria", "Austrian", "43"],
  ["AZ", "Azerbaijan", "Azerbaijani", "994"],
  ["BH", "Bahrain", "Bahraini", "973"],
  ["BD", "Bangladesh", "Bangladeshi", "880"],
  ["BY", "Belarus", "Belarusian", "375"],
  ["BE", "Belgium", "Belgian", "32"],
  ["BA", "Bosnia and Herzegovina", "Bosnian", "387"],
  ["BR", "Brazil", "Brazilian", "55"],
  ["BG", "Bulgaria", "Bulgarian", "359"],
  ["CM", "Cameroon", "Cameroonian", "237"],
  ["CA", "Canada", "Canadian", "1"],
  ["CL", "Chile", "Chilean", "56"],
  ["CN", "China", "Chinese", "86"],
  ["CO", "Colombia", "Colombian", "57"],
  ["CI", "Côte d’Ivoire", "Ivorian", "225"],
  ["HR", "Croatia", "Croatian", "385"],
  ["CU", "Cuba", "Cuban", "53"],
  ["CY", "Cyprus", "Cypriot", "357"],
  ["CZ", "Czechia", "Czech", "420"],
  ["DK", "Denmark", "Danish", "45"],
  ["DO", "Dominican Republic", "Dominican", "1"],
  ["EC", "Ecuador", "Ecuadorian", "593"],
  ["EG", "Egypt", "Egyptian", "20"],
  ["EE", "Estonia", "Estonian", "372"],
  ["ET", "Ethiopia", "Ethiopian", "251"],
  ["FI", "Finland", "Finnish", "358"],
  ["FR", "France", "French", "33"],
  ["GE", "Georgia", "Georgian", "995"],
  ["DE", "Germany", "German", "49"],
  ["GH", "Ghana", "Ghanaian", "233"],
  ["GR", "Greece", "Greek", "30"],
  ["HU", "Hungary", "Hungarian", "36"],
  ["IS", "Iceland", "Icelandic", "354"],
  ["IN", "India", "Indian", "91"],
  ["ID", "Indonesia", "Indonesian", "62"],
  ["IR", "Iran", "Iranian", "98"],
  ["IQ", "Iraq", "Iraqi", "964"],
  ["IE", "Ireland", "Irish", "353"],
  ["IL", "Israel", "Israeli", "972"],
  ["IT", "Italy", "Italian", "39"],
  ["JM", "Jamaica", "Jamaican", "1"],
  ["JP", "Japan", "Japanese", "81"],
  ["JO", "Jordan", "Jordanian", "962"],
  ["KZ", "Kazakhstan", "Kazakh", "7"],
  ["KE", "Kenya", "Kenyan", "254"],
  ["KW", "Kuwait", "Kuwaiti", "965"],
  ["LV", "Latvia", "Latvian", "371"],
  ["LB", "Lebanon", "Lebanese", "961"],
  ["LY", "Libya", "Libyan", "218"],
  ["LT", "Lithuania", "Lithuanian", "370"],
  ["LU", "Luxembourg", "Luxembourgish", "352"],
  ["MY", "Malaysia", "Malaysian", "60"],
  ["MT", "Malta", "Maltese", "356"],
  ["MX", "Mexico", "Mexican", "52"],
  ["MD", "Moldova", "Moldovan", "373"],
  ["MA", "Morocco", "Moroccan", "212"],
  ["NL", "Netherlands", "Dutch", "31"],
  ["NZ", "New Zealand", "New Zealander", "64"],
  ["NG", "Nigeria", "Nigerian", "234"],
  ["MK", "North Macedonia", "Macedonian", "389"],
  ["NO", "Norway", "Norwegian", "47"],
  ["OM", "Oman", "Omani", "968"],
  ["PK", "Pakistan", "Pakistani", "92"],
  ["PS", "Palestine", "Palestinian", "970"],
  ["PE", "Peru", "Peruvian", "51"],
  ["PH", "Philippines", "Filipino", "63"],
  ["PL", "Poland", "Polish", "48"],
  ["PT", "Portugal", "Portuguese", "351"],
  ["QA", "Qatar", "Qatari", "974"],
  ["RO", "Romania", "Romanian", "40"],
  ["RU", "Russia", "Russian", "7"],
  ["SA", "Saudi Arabia", "Saudi", "966"],
  ["SN", "Senegal", "Senegalese", "221"],
  ["RS", "Serbia", "Serbian", "381"],
  ["SG", "Singapore", "Singaporean", "65"],
  ["SK", "Slovakia", "Slovak", "421"],
  ["SI", "Slovenia", "Slovenian", "386"],
  ["SO", "Somalia", "Somali", "252"],
  ["ZA", "South Africa", "South African", "27"],
  ["KR", "South Korea", "Korean", "82"],
  ["ES", "Spain", "Spanish", "34"],
  ["LK", "Sri Lanka", "Sri Lankan", "94"],
  ["SD", "Sudan", "Sudanese", "249"],
  ["SE", "Sweden", "Swedish", "46"],
  ["CH", "Switzerland", "Swiss", "41"],
  ["SY", "Syria", "Syrian", "963"],
  ["TW", "Taiwan", "Taiwanese", "886"],
  ["TZ", "Tanzania", "Tanzanian", "255"],
  ["TH", "Thailand", "Thai", "66"],
  ["TN", "Tunisia", "Tunisian", "216"],
  ["TR", "Türkiye", "Turkish", "90"],
  ["UA", "Ukraine", "Ukrainian", "380"],
  ["AE", "United Arab Emirates", "Emirati", "971"],
  ["GB", "United Kingdom", "British", "44"],
  ["US", "United States", "American", "1"],
  ["UY", "Uruguay", "Uruguayan", "598"],
  ["UZ", "Uzbekistan", "Uzbek", "998"],
  ["VE", "Venezuela", "Venezuelan", "58"],
  ["VN", "Vietnam", "Vietnamese", "84"],
  ["YE", "Yemen", "Yemeni", "967"],
];

export const COUNTRIES: Country[] = RAW.map(
  ([code, name, nationality, dial]) => ({ code, name, nationality, dial }),
);

export const COUNTRIES_BY_NATIONALITY = [...COUNTRIES].sort((a, b) =>
  a.nationality.localeCompare(b.nationality),
);

export function countryByCode(code: string | null | undefined) {
  if (!code) return undefined;
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}

// "MA" → 🇲🇦 (regional indicator letters; Android shows them as colour flags)
export function flagOf(code: string) {
  return code
    .toUpperCase()
    .split("")
    .map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
    .join("");
}
