export interface UzBank {
  code: string;
  name: string;
  mfo: string;
}

export const UZ_BANKS: readonly UzBank[] = [
  { code: 'nbu', name: 'Национальный банк Узбекистана', mfo: '00440' },
  { code: 'asaka', name: 'Асака банк', mfo: '00084' },
  { code: 'ipoteka', name: 'Ипотека-банк', mfo: '00257' },
  { code: 'uzpsb', name: 'Узпромстройбанк', mfo: '00380' },
  { code: 'hamkor', name: 'Хамкорбанк', mfo: '00404' },
  { code: 'kapital', name: 'Капиталбанк', mfo: '00251' },
  { code: 'agro', name: 'Агробанк', mfo: '00425' },
  { code: 'aloqa', name: 'Алокабанк', mfo: '00408' },
  { code: 'davr', name: 'Давр банк', mfo: '00415' },
  { code: 'trust', name: 'Трастбанк', mfo: '00216' },
  { code: 'asia-alliance', name: 'Азия Альянс банк', mfo: '01069' },
  { code: 'anor', name: 'Anor Bank', mfo: '01097' },
  { code: 'tenge', name: 'Tenge Bank', mfo: '00081' },
  { code: 'tbc-uz', name: 'TBC Bank UZ', mfo: '01100' },
  { code: 'infin', name: 'InfinBANK', mfo: '00373' },
  { code: 'orient-finans', name: 'Orient Finans Bank', mfo: '00485' },
  { code: 'ipak-yuli', name: 'Ипак Йули', mfo: '00417' },
  { code: 'turkiston', name: 'Туркистон банк', mfo: '00427' },
  { code: 'universal', name: 'Универсал банк', mfo: '00992' },
  { code: 'ravnaq', name: 'Равнак банк', mfo: '00420' },
] as const;
