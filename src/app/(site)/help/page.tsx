import { CmsHtml } from "@/module/site/cms-html";
import { fetchSitePageBySlug } from "@/module/site/shopify-page-loader";
import Section from "@/shared/components/layout/section/section";
import Shell from "@/shared/components/layout/shell";
import { site } from "@/shared/config/site";
import { buildPageMetadata } from "@/shared/seo/metadata-builders";

export const metadata = buildPageMetadata({
  title: "Help",
  description: `About ${site.name}, FAQs, and how to contact us.`,
  canonicalPath: "/help",
  ogType: "website",
});

export default async function HelpPage() {
  const [about, faq, contact] = await Promise.all([
    fetchSitePageBySlug("about"),
    fetchSitePageBySlug("faq"),
    fetchSitePageBySlug("contact"),
  ]);

  return (
    <Shell>
      <Shell.Section>
        <div className="mx-auto flex max-w-3xl flex-col gap-16">
          <section id="about" className="scroll-mt-24">
            <Section title={about?.title ?? "About"} description={about?.metaDescription ?? `About ${site.name}.`}>
              {about?.bodyHtml ? (
                <CmsHtml html={about.bodyHtml} />
              ) : (
                <p className="text-muted-foreground text-sm">{site.description}</p>
              )}
            </Section>
          </section>

          <section id="faq" className="scroll-mt-24">
            <Section
              title={faq?.title ?? "FAQ"}
              description={faq?.metaDescription ?? "Orders, shipping, returns, and payments."}
            >
              {faq?.bodyHtml ? (
                <CmsHtml html={faq.bodyHtml} />
              ) : (
                <p className="text-muted-foreground text-sm">FAQ content will appear here when published.</p>
              )}
            </Section>
          </section>

          <section id="contact" className="scroll-mt-24">
            <Section
              title={contact?.title ?? "Contact"}
              description={contact?.metaDescription ?? `Reach ${site.name}.`}
            >
              {contact?.bodyHtml ? (
                <CmsHtml html={contact.bodyHtml} />
              ) : (
                <div className="text-muted-foreground space-y-2 text-sm">
                  <p>
                    Email:{" "}
                    <a className="text-foreground underline" href={`mailto:${site.email}`}>
                      {site.email}
                    </a>
                  </p>
                  <p>Phone: {site.phone}</p>
                  <p>{site.address}</p>
                </div>
              )}
            </Section>
          </section>
        </div>
      </Shell.Section>
    </Shell>
  );
}
