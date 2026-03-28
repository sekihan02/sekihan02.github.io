import type { MDXComponents } from "mdx/types";

export const mdxComponents: MDXComponents = {
  h2: (props) => <h2 {...props} className="article-heading" />,
  h3: (props) => <h3 {...props} className="article-subheading" />,
  p: (props) => <p {...props} className="article-paragraph" />,
  a: (props) => <a {...props} className="inline-link" />,
  ul: (props) => <ul {...props} className="article-list" />,
  ol: (props) => <ol {...props} className="article-list article-list-numbered" />,
  li: (props) => <li {...props} className="article-list-item" />,
  blockquote: (props) => <blockquote {...props} className="article-quote" />,
  code: (props) => <code {...props} className="inline-code" />,
  pre: (props) => <pre {...props} className="code-block" />,
  table: (props) => (
    <div className="article-table-wrap">
      <table {...props} className="article-table" />
    </div>
  ),
  img: (props) => <img {...props} className="article-image" loading="lazy" />,
  figure: (props) => <figure {...props} className="article-figure" />,
  figcaption: (props) => <figcaption {...props} className="article-figcaption" />
};
