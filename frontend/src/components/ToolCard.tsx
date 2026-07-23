import { Link } from "react-router-dom";

type ToolCardProps = {
  id: string;
  category: string;
  title: string;
  description: string;
  formatsLabel: string;
  formats: readonly string[];
  actionLabel: string;
  to: string;
};

export function ToolCard({
  id,
  category,
  title,
  description,
  formatsLabel,
  formats,
  actionLabel,
  to,
}: ToolCardProps) {
  const titleId = `${id}-title`;

  return (
    <article className="tool-card" aria-labelledby={titleId}>
      <div className="tool-card-content">
        <p className="eyebrow">{category}</p>
        <h3 id={titleId}>{title}</h3>
        <p>{description}</p>
        <div className="tool-formats">
          <span>{formatsLabel}</span>
          <ul aria-label={formatsLabel}>
            {formats.map((format) => (
              <li key={format}>{format}</li>
            ))}
          </ul>
        </div>
      </div>
      <Link className="button-link" to={to}>
        {actionLabel}
      </Link>
    </article>
  );
}
