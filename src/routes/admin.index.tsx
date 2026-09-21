import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  component: () => {
    const navigate = useNavigate();
    useEffect(() => { navigate({ to: "/admin/dashboard" }); }, [navigate]);
    return <div className="p-8">Redirecting…</div>;
  },
});
