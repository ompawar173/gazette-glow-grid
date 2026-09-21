import { createFileRoute } from "@tanstack/react-router";
import { ArticleForm } from "./admin.articles.new";

export const Route = createFileRoute("/admin/articles/$id")({
  ssr: false,
  component: () => {
    const { id } = Route.useParams();
    return <ArticleForm id={id} />;
  },
});
