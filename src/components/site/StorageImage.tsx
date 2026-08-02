import { imageUrl } from "@/lib/seo";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
  /** Set on the LCP image so the browser fetches it first. */
  priority?: boolean;
};

/**
 * Renders stored media through the stable public image endpoint so the URL is
 * server-rendered, cacheable and crawlable (signed URLs expire and are invisible
 * to crawlers).
 */
export function StorageImage({ src, className, alt = "", width, height, priority, ...rest }: Props) {
  const url = imageUrl(src);
  if (!url) {
    return <div className={`bg-secondary ${className ?? ""}`} role="presentation" aria-hidden="true" />;
  }
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      width={width ?? 1200}
      height={height ?? 675}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      {...(priority ? { fetchPriority: "high" as const } : {})}
      {...rest}
    />
  );
}
