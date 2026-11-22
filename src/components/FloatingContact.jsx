import { MessageCircle } from "lucide-react";
import { useMatch } from "react-router-dom";
import { SITE } from "../lib/format";
import InstagramIcon from "./InstagramIcon";

export default function FloatingContact() {
  const isProduct = useMatch("/produit/:id");
  const isAdmin = useMatch("/miro");

  if (isAdmin) return null;

  return (
    <nav className={`floating-contact${isProduct ? " floating-contact-product" : ""}`} aria-label="Contacter MIROTECH">
      <a className="floating-contact-whatsapp" href={`https://wa.me/${SITE.whatsappNumber}`} target="_blank" rel="noopener noreferrer" aria-label="Contacter MIROTECH sur WhatsApp">
        <MessageCircle size={22} aria-hidden="true" />
      </a>
      <a className="floating-contact-instagram" href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Voir MIROTECH sur Instagram">
        <InstagramIcon size={22} />
      </a>
    </nav>
  );
}
