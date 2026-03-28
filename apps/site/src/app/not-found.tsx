import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-stack">
      <section className="section-shell">
        <div className="section-head">
          <div className="section-kicker">Not Found</div>
          <h1>ページが見つかりません。</h1>
          <p>URL を確認するか、記事一覧から探してください。</p>
          <Link href="/articles" className="primary-button">
            記事一覧へ
          </Link>
        </div>
      </section>
    </div>
  );
}
