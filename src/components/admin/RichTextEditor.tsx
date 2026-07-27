import { lazy, Suspense } from "react";
import "react-quill-new/dist/quill.snow.css";

// react-quill uses browser-only APIs (document); load client-only
const ReactQuill = lazy(() => import("react-quill-new"));

interface Props { value: string; onChange: (v: string) => void; }

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "link", "image"],
    ["clean"],
  ],
};

export function RichTextEditor({ value, onChange }: Props) {
  if (typeof window === "undefined") return <div className="border border-border min-h-[300px]" />;
  return (
    <Suspense fallback={<div className="border border-border p-4 min-h-[300px] text-muted-foreground">Loading editor…</div>}>
      <div className="bg-background">
        <ReactQuill theme="snow" value={value} onChange={onChange} modules={modules} />
      </div>
    </Suspense>
  );
}
