import { cn } from "@/lib/utils";

// Eagerly import all stock SVGs as URLs at build time.
const logoModules = import.meta.glob("../assets/stocks/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const logoMap: Record<string, string> = Object.fromEntries(
  Object.entries(logoModules).map(([path, url]) => {
    const symbol = path
      .split("/")
      .pop()!
      .replace(/\.svg$/, "")
      .toUpperCase();
    return [symbol, url];
  }),
);

interface StockLogoProps {
  symbol: string;
  className?: string;
  size?: number;
}

export function StockLogo({ symbol, className, size = 32 }: StockLogoProps) {
  const url = logoMap[symbol.toUpperCase()];
  const dim = { width: size, height: size };
  console.log({ url });
  if (url) {
    return (
      <img
        src={url}
        alt={`${symbol} logo`}
        style={dim}
        className={cn("rounded-lg shrink-0 ring-1 ring-border/50", className)}
        loading="lazy"
      />
    );
  }

  // Fallback: monogram tile
  return (
    <div
      style={dim}
      className={cn(
        "rounded-lg bg-accent grid place-items-center text-[10px] font-bold shrink-0 ring-1 ring-border/50",
        className,
      )}
    >
      {symbol.slice(0, 3)}
    </div>
  );
}
