/**
 * Text Link Component
 * Styled link for external resources
 */

interface TextLinkProps {
  label: string;
  href: string;
  accentColor: string;
}

export function TextLink({ label, href, accentColor }: TextLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        fontSize: '13px',
        color: accentColor,
        textDecoration: 'none',
        padding: '8px 0',
        display: 'block',
        borderBottom: `1px solid ${accentColor}20`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecoration = 'none';
      }}
    >
      {label} →
    </a>
  );
}
