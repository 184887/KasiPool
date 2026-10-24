import { permanentRedirect } from "next/navigation";

// The catalogue was merged into Deals (/offers).
export default function Page() {
  permanentRedirect("/offers");
}
