import Link from "next/link";
import type { CategoryCollection } from "@/lib/types";
import { categoryPath } from "@/lib/routes";

type Props = {
  categories: CategoryCollection[];
  title?: string;
  description?: string;
};

export function CategoryCollections({
  categories,
  title = "カテゴリから探す",
  description = "カテゴリ名から、そのままカテゴリ別の記事一覧へ移動できます。"
}: Props) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="section-shell category-collections-shell">
      <div className="section-head">
        <div className="section-kicker">Categories</div>
        <h2>{title}</h2>
        <p className="category-collections-description">{description}</p>
      </div>

      <div className="category-collections-body">
        <div className="category-chip-list" aria-label="カテゴリ一覧">
          {categories.map((collection) => (
            <Link
              key={collection.category}
              href={categoryPath(collection.category)}
              className="category-chip"
            >
              <span>{collection.category}</span>
              <strong>{collection.articleCount}</strong>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
