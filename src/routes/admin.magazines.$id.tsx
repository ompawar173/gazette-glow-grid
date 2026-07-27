import { createFileRoute } from "@tanstack/react-router";
import { MagazineForm } from "./admin.magazines.new";

export const Route = createFileRoute("/admin/magazines/$id")({
  ssr: false,
  component: () => {
    const { id } = Route.useParams();
    return <MagazineForm id={id} />;
  },
});
