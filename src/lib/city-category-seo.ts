import overridesData from "@/data/city-category-overrides.json";
import type { Category, City } from "./types";

export interface CityCategoryFaq {
  q: string;
  a: string;
}

export interface CityCategoryOverride {
  title?: string;
  description?: string;
  intro?: string;
  extraParagraph?: string;
  faq?: CityCategoryFaq[];
}

type OverridesMap = Record<string, CityCategoryOverride>;

const overrides = overridesData as OverridesMap;

export function cityCategoryKey(citySlug: string, categorySlug: string): string {
  return `${citySlug}:${categorySlug}`;
}

export function getCityCategoryOverride(
  citySlug: string,
  categorySlug: string,
): CityCategoryOverride | undefined {
  return overrides[cityCategoryKey(citySlug, categorySlug)];
}

export function cityCategoryTitle(city: City, category: Category): string {
  const custom = getCityCategoryOverride(city.slug, category.slug);
  if (custom?.title) return custom.title;
  return `${category.name} в ${city.name} — купить с доставкой`;
}

export function cityCategoryDescription(city: City, category: Category): string {
  const custom = getCityCategoryOverride(city.slug, category.slug);
  if (custom?.description) return custom.description;
  return `${category.name} в ${city.name}: ${category.description} ${city.delivery} Каталог ${category.count} позиций, расчёт и заявка онлайн.`;
}

export function cityCategoryH1(city: City, category: Category): string {
  return `${category.name} в ${city.name}`;
}

export function cityCategoryIntro(city: City, category: Category): string[] {
  const custom = getCityCategoryOverride(city.slug, category.slug);
  const paragraphs: string[] = [];
  if (custom?.intro) paragraphs.push(custom.intro);
  else paragraphs.push(category.seoText);
  if (custom?.extraParagraph) paragraphs.push(custom.extraParagraph);
  else paragraphs.push(city.text);
  return paragraphs;
}

export function cityCategoryFaq(city: City, category: Category): CityCategoryFaq[] {
  const custom = getCityCategoryOverride(city.slug, category.slug);
  if (custom?.faq?.length) return custom.faq;
  return [
    {
      q: `${category.name} в ${city.name} — как заказать?`,
      a: "Выберите позиции в каталоге ниже или оставьте заявку — менеджер уточнит наличие, цену и сроки доставки.",
    },
    {
      q: `Доставка ${category.name.toLowerCase()} в ${city.name}`,
      a: city.delivery,
    },
    {
      q: "Работаете с организациями?",
      a: "Да — счёт, закрывающие документы, поставка партиями под объект.",
    },
  ];
}
