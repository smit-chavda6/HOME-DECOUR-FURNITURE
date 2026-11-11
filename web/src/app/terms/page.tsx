import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { FREE_SHIPPING_FROM, SHIPPING_FEE } from "@/lib/pricing";
import { site } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="Please read these terms before using our website or placing an order."
      updated="11 November 2026"
      sections={[
        {
          title: "Acceptance",
          paragraphs: [
            `By using the ${site.name} website you agree to these terms and our Privacy Policy. If you do not agree, please do not use the site.`,
          ],
        },
        {
          title: "Accounts",
          paragraphs: ["You are responsible for keeping your password safe and for activity on your account. Tell us straight away if you suspect unauthorised use."],
        },
        {
          title: "Orders and prices",
          list: [
            "Orders are subject to acceptance and stock availability.",
            "Prices are in Indian rupees and exclude 18% GST, which is shown and added at checkout.",
            "Prices, offers and availability can change without notice, but never after your order is placed.",
          ],
        },
        {
          title: "Payment",
          paragraphs: ["You can pay cash on delivery, or online through Razorpay where offered. We do not store card details."],
        },
        {
          title: "Shipping and delivery",
          paragraphs: [
            `Shipping costs ${formatPrice(SHIPPING_FEE)} per order and is free from ${formatPrice(FREE_SHIPPING_FROM)}. Most orders arrive within 7 to 14 business days; dates are estimates. Ownership and risk pass to you on delivery.`,
          ],
        },
        {
          title: "Returns and refunds",
          paragraphs: ["Unused, undamaged items in their original packaging can be returned within 7 days of delivery. Custom-made pieces may not be returnable. Approved refunds go back to the original payment method."],
        },
        {
          title: "Warranty",
          paragraphs: ["Products may carry a limited warranty against manufacturing defects. Misuse, normal wear and accidental damage are not covered."],
        },
        {
          title: "AR previews and AI suggestions",
          paragraphs: ["3D models, AR placement and AI suggestions are guides to help you decide. Colours, sizes and textures of the real product may differ slightly; always check the listed dimensions."],
        },
        {
          title: "Intellectual property",
          paragraphs: ["The text, images, logos and 3D models on this site belong to us or are used with permission, and may not be reused without our written consent."],
        },
        {
          title: "Liability",
          paragraphs: ["To the extent the law allows, we are not liable for indirect or consequential losses arising from use of the site or products."],
        },
        {
          title: "Governing law and contact",
          paragraphs: [`These terms are governed by the laws of India, with courts in Ahmedabad, Gujarat having jurisdiction. Questions? Email ${site.contact.email}.`],
        },
      ]}
    />
  );
}
