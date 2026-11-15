import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Your privacy matters to us. This policy explains what we collect, why, and the choices you have."
      updated="11 November 2026"
      sections={[
        {
          title: "Information we collect",
          list: [
            "Account details: name, username, email, phone number and a securely hashed password.",
            "Order details: delivery address, items bought and payment method. Online payments are handled by Razorpay; we never see or store full card numbers.",
            "Messages you send through the contact form or the shopping assistant.",
            "Photos you upload to the room advisor, which are sent to our AI provider only to make suggestions and are not stored by us.",
          ],
        },
        {
          title: "How we use it",
          list: [
            "To process and deliver your orders and keep you updated.",
            "To answer your questions and support requests.",
            "To keep the site secure and improve how it works.",
          ],
        },
        {
          title: "Cookies and local storage",
          paragraphs: [
            "We use one essential cookie to keep you signed in. Your cart, wishlist and light or dark theme are saved in your own browser's storage and are not sent to us until you place an order.",
          ],
        },
        {
          title: "Sharing",
          paragraphs: [
            "We share information only as needed to run the service: with payment processors, delivery partners and service providers bound by confidentiality, or where the law requires it. We do not sell your data.",
          ],
        },
        {
          title: "Security and retention",
          paragraphs: [
            "We use reasonable technical and organisational safeguards. We keep personal data while your account is active or as needed for legal, accounting and dispute purposes.",
          ],
        },
        {
          title: "Your rights",
          paragraphs: [
            `You can view and update your details from your account at any time, and ask us to access, correct or delete your data by writing to ${site.contact.email}.`,
          ],
        },
        {
          title: "Children",
          paragraphs: ["Our services are not directed to children under 13, and we do not knowingly collect their data."],
        },
        {
          title: "Changes and contact",
          paragraphs: [
            `We may update this policy and will change the date below when we do. Questions? Email ${site.contact.email}.`,
          ],
        },
      ]}
    />
  );
}
