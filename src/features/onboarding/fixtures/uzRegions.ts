export interface UzRegion {
  code: string;
  nameRu: string;
  nameUz: string;
}

export const UZ_REGIONS: readonly UzRegion[] = [
  { code: 'tashkent-city', nameRu: 'Город Ташкент', nameUz: 'Toshkent shahri' },
  { code: 'tashkent-region', nameRu: 'Ташкентская область', nameUz: 'Toshkent viloyati' },
  { code: 'samarkand', nameRu: 'Самаркандская область', nameUz: 'Samarqand viloyati' },
  { code: 'bukhara', nameRu: 'Бухарская область', nameUz: 'Buxoro viloyati' },
  { code: 'andijan', nameRu: 'Андижанская область', nameUz: 'Andijon viloyati' },
  { code: 'fergana', nameRu: 'Ферганская область', nameUz: 'Farg`ona viloyati' },
  { code: 'namangan', nameRu: 'Наманганская область', nameUz: 'Namangan viloyati' },
  { code: 'khorezm', nameRu: 'Хорезмская область', nameUz: 'Xorazm viloyati' },
  { code: 'surkhandarya', nameRu: 'Сурхандарьинская область', nameUz: 'Surxondaryo viloyati' },
  { code: 'kashkadarya', nameRu: 'Кашкадарьинская область', nameUz: 'Qashqadaryo viloyati' },
  { code: 'navoi', nameRu: 'Навоийская область', nameUz: 'Navoiy viloyati' },
  { code: 'jizzakh', nameRu: 'Джизакская область', nameUz: 'Jizzax viloyati' },
  { code: 'sirdarya', nameRu: 'Сырдарьинская область', nameUz: 'Sirdaryo viloyati' },
  { code: 'karakalpakstan', nameRu: 'Каракалпакстан', nameUz: 'Qoraqalpog`iston' },
] as const;
