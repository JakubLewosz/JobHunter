// Directions are search proposals, never evidence or candidate skills.
const sectors = [
  'logistyka i transport',
  'produkcja i przemysł',
  'edukacja',
  'handel internetowy',
  'dokumenty i księgowość',
  'usługi biznesowe',
  'budownictwo',
  'obsługa klienta',
];
const regions = [
  'podlaskie',
  'warmińsko-mazurskie',
  'lubelskie',
  'podkarpackie',
  'świętokrzyskie',
  'łódzkie',
  'kujawsko-pomorskie',
  'zachodniopomorskie',
  'lubuskie',
  'opolskie',
  'wielkopolskie',
  'pomorskie',
  'śląskie',
  'dolnośląskie',
  'małopolskie',
  'mazowieckie',
];
const teams = [
  'małe zespoły SaaS',
  'producenci oprogramowania B2B',
  'software house’y',
  'firmy z własnymi narzędziami wewnętrznymi',
];
const topics: Record<string, string> = {
  fixdesk: 'aplikacje webowe i obsługa zgłoszeń',
  autorelay: 'integracje API, webhooki i automatyzacje',
  elektroscan: 'przetwarzanie dokumentów PDF i analiza obrazu',
  codefabric: 'narzędzia LLM i lokalne modele',
};
export function sessionQueries(
  base: string[],
  seed: string | undefined,
  factKeys: string[],
  cursor = 0,
  limit = 128,
) {
  const technology = Object.keys(topics)
    .filter((k) => factKeys.includes(k))
    .map((k) => topics[k]);
  if (!technology.length) technology.push('aplikacje i narzędzia programistyczne');
  const total = base.length + sectors.length * regions.length * teams.length * technology.length;
  const queries: string[] = [];
  while (cursor < total && queries.length < limit) {
    let direction: string;
    if (cursor < base.length) direction = base[cursor];
    else {
      let n = cursor - base.length;
      const pick = (values: string[]) => {
        const value = values[n % values.length];
        n = Math.floor(n / values.length);
        return value;
      };
      const sectorIndex = n % sectors.length;
      const sector = pick(sectors);
      // Rotate each axis by earlier axes: early cycles cover different projects,
      // regions and team types while the complete catalog stays one-to-one.
      const regionIndex = ((n % regions.length) + sectorIndex) % regions.length;
      pick(regions);
      const region = regions[regionIndex];
      const topicIndex = ((n % technology.length) + regionIndex + sectorIndex) % technology.length;
      pick(technology);
      const topic = technology[topicIndex],
        team = teams[((n % teams.length) + sectorIndex) % teams.length];
      direction = `Polska, województwo ${region}; ${team}; ${sector}; ${topic}. Szukaj nowych firm, także poza największymi miastami, z oficjalnym opisem działalności i kontaktem. Preferuj rekrutację i otwarte kandydatury; kontakt ogólny zachowuje typ GENERAL. Bez zgadywania adresów i bez wymogu wakatu. Region i branża są kierunkiem wyszukiwania, nie potwierdzonym faktem o firmie.`;
    }
    queries.push(seed ? `${seed}\nKolejny kierunek: ${direction}` : direction);
    cursor++;
  }
  return { queries, cursor };
}
