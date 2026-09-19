import { useState } from "react";
import { imageUrl } from "@/lib/seo";
import articlePlaceholderAsset from "@/assets/article-placeholder.png.asset.json";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
  /** Set on the LCP image so the browser fetches it first. */
  priority?: boolean;
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK = "/article-placeholder.svg";


/**
 * Renders stored media through the stable public image endpoint so the URL is
 * server-rendered, cacheable and crawlable (signed URLs expire and are invisible
 * to crawlers).
 */
export function StorageImage({
  src,
  className,
  alt = "",
  width,
  height,
  priority,
  fallbackSrc = DEFAULT_FALLBACK,
  onError,
  ...rest
}: Props) {
  const [hasError, setHasError] = useState(false);
  const url = imageUrl(src);

  const displayUrl = hasError || !url ? fallbackSrc : url;

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={className}
      width={width ?? 1200}
      height={height ?? 675}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      {...(priority ? { fetchPriority: "high" as const } : {})}
      onError={(e) => {
        if (!hasError) {
          setHasError(true);
        }
        onError?.(e);
      }}
      {...rest}
    />
  );
}
