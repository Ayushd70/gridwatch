import Image from "next/image";

export function LogoMark({
  size = 36,
  alt = "",
  priority = false,
  className = "",
}: {
  size?: number;
  alt?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={`rounded-[22%] shadow-[0_0_0_1px_var(--border)] ${className}`}
    />
  );
}

export function BrandLockup({
  compact = false,
  priority = false,
}: {
  compact?: boolean;
  priority?: boolean;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <LogoMark size={compact ? 32 : 36} alt="" priority={priority} />
      <span className="min-w-0">
        <span className="block font-display text-xl leading-none tracking-tight text-foreground sm:text-2xl">
          GRIDWATCH
        </span>
        {compact ? null : (
          <span className="mt-0.5 hidden text-[10px] uppercase tracking-[0.18em] text-subtle sm:block">
            Unofficial fan timing
          </span>
        )}
      </span>
    </span>
  );
}
