import type { City } from "./types";

export interface CityFaqItem {
  q: string;
  a: string;
}

export function cityMetaTitle(city: City, siteName: string): string {
  return `${city.title} — металлопрокат с доставкой | ${siteName}`;
}

export function cityMetaDescription(city: City): string {
  const highlights = city.highlights?.[0];
  const extra = highlights ? ` ${highlights}.` : "";
  return `${city.text}${extra} ${city.delivery} Каталог, расчёт и заявка онлайн.`.slice(0, 160);
}

export function cityFaq(city: City): CityFaqItem[] {
  const items: CityFaqItem[] = [
    {
      q: `Как заказать металлопрокат в ${city.name}?`,
      a: "Выберите позиции в каталоге, добавьте в заявку или позвоните — уточним наличие и подготовим расчёт.",
    },
    {
      q: `Доставка в ${city.name}`,
      a: city.delivery,
    },
    {
      q: "Работаете с организациями?",
      a: "Да: счёт, закрывающие документы, поставка партиями под объект.",
    },
  ];
  if (city.highlights?.[1]) {
    items.push({
      q: `Что чаще заказывают в ${city.name}?`,
      a: city.highlights[1],
    });
  }
  return items;
}
