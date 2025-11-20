/**
 * Список популярных торговых центров Москвы
 * Используется для выбора места встречи при бронировании
 */

// Интерфейс торгового центра с координатами
export interface Mall {
  name: string;
  latitude: number;
  longitude: number;
  address: string; // Точный адрес для справки
}

// Торговые центры с точными координатами для отображения на карте
// Только ТЦ из топ-20 по версии Комсомольской правды
// Источник: https://www.kp.ru/afisha/msk/obzory/moj-gorod/luchshie-torgovye-czentry-moskvy/
export const MOSCOW_MALLS_WITH_COORDS: Mall[] = [
  { 
    name: 'ТЦ Авиапарк',
    latitude: 55.790491,
    longitude: 37.531373,
    address: 'Ходынский бульвар, 4'
  },
  { 
    name: 'ТЦ Метрополис',
    latitude: 55.823558,
    longitude: 37.498203,
    address: 'Ленинградское шоссе, 16А, стр. 4'
  },
  { 
    name: 'ТЦ Европолис',
    latitude: 55.845855,
    longitude: 37.662093,
    address: 'проспект Мира, 211, корп. 2'
  },
  { 
    name: 'ТЦ Европейский',
    latitude: 55.744263,
    longitude: 37.565527,
    address: 'площадь Киевского Вокзала, 2'
  },
  { 
    name: 'Афимолл',
    latitude: 55.748963,
    longitude: 37.539035,
    address: 'Пресненская набережная, 2'
  },
  { 
    name: 'Охотный ряд',
    latitude: 55.755804,
    longitude: 37.614608,
    address: 'Манежная площадь, 1'
  },
  { 
    name: 'Vegas',
    latitude: 55.585051,
    longitude: 37.723202,
    address: '66-й км МКАД, владение 1'
  },
  { 
    name: 'Columbus',
    latitude: 55.612228,
    longitude: 37.606924,
    address: 'Ленинский проспект, 109'
  },
];

// Список названий для выбора в формах (обратная совместимость)
export const MOSCOW_MALLS = MOSCOW_MALLS_WITH_COORDS.map(mall => mall.name);

export const getDefaultMall = () => MOSCOW_MALLS[0];

/**
 * Популярные бренды одежды для тэгов в профиле стилиста
 */
export const POPULAR_BRANDS = [
  // Масс-маркет
  'Zara',
  'H&M',
  'Mango',
  'Uniqlo',
  'Bershka',
  'Pull&Bear',
  'Stradivarius',
  'Reserved',
  'Massimo Dutti',
  
  // Средний сегмент
  'COS',
  'Marks & Spencer',
  'Sandro',
  'Maje',
  'Ted Baker',
  'AllSaints',
  
  // Премиум
  'Armani',
  'Hugo Boss',
  'Tommy Hilfiger',
  'Calvin Klein',
  'Ralph Lauren',
  'Lacoste',
  
  // Люкс
  'Gucci',
  'Prada',
  'Louis Vuitton',
  'Chanel',
  'Dior',
  'Versace',
  
  // Спортивные
  'Nike',
  'Adidas',
  'Puma',
  'Reebok',
  'New Balance',
  
  // Российские
  'OSTIN',
  '12 Storeez',
  'Lime',
  'Love Republic',
];

