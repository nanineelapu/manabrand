import { CategoriesManager } from "@/components/admin/categories-manager";
import { PageHeader } from "@/components/shared/blocks";
import { getCategories, getSubcategoryMap } from "@/lib/data";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const cats = await getCategories();
  return (
    <>
      <PageHeader title="Categories" subtitle="Organise the catalogue shoppers browse" />
      <CategoriesManager categories={cats} subs={await getSubcategoryMap()} />
    </>
  );
}
