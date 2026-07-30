import { useEffect, useState } from "react";
import { resolveStorageUrl } from "@/lib/storage";

export function useStorageUrl(value: string | null | undefined) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let alive = true;
    resolveStorageUrl(value).then((u) => alive && setUrl(u));
    return () => { alive = false; };
  }, [value]);
  return url;
}

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
};

export function StorageImage({ src, className, alt = "", ...rest }: Props) {
  const url = useStorageUrl(src);
  if (!url) {
    return <div className={`bg-secondary ${className ?? ""}`} aria-hidden />;
  }
  return <img src={url} alt={alt} className={className} {...rest} />;
}
