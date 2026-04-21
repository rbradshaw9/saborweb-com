import Link from 'next/link';

type BrandMarkProps = {
  compact?: boolean;
  href?: string;
};

export default function BrandMark({ compact = false, href = '/' }: BrandMarkProps) {
  return (
    <Link href={href} className="brand-mark" aria-label="Sabor Web home">
      <span className="brand-mark__symbol">SW</span>
      {!compact && (
        <span className="brand-mark__text">
          Sabor<span>Web</span>
        </span>
      )}
    </Link>
  );
}
