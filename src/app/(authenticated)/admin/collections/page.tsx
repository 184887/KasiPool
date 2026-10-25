import { permanentRedirect } from "next/navigation";

// Collection points were replaced by delivery on 2026-10-25
export default function Page() {
  permanentRedirect("/admin/deliveries");
}
