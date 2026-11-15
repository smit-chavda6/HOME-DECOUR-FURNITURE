import { PageHeader } from "./page-header";

export type LegalSection = { title: string; paragraphs?: string[]; list?: string[] };

/** Shared layout for the privacy policy and terms of service. */
export function LegalPage({
  title,
  intro,
  updated,
  sections,
}: {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHeader title={title} description={intro} crumbs={[{ label: title }]} />
      <div className="container-page grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <ol className="space-y-2 text-sm text-muted">
            {sections.map((s, i) => (
              <li key={s.title}>
                <a href={`#s${i + 1}`} className="hover:text-ink">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="max-w-2xl space-y-10 leading-relaxed">
          {sections.map((s, i) => (
            <section key={s.title} id={`s${i + 1}`} className="scroll-mt-24">
              <h2 className="font-display text-2xl font-medium">
                {i + 1}. {s.title}
              </h2>
              {s.paragraphs?.map((p) => (
                <p key={p} className="mt-3 text-muted">{p}</p>
              ))}
              {s.list && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-muted marker:text-accent">
                  {s.list.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}
          <p className="border-t border-line pt-6 text-sm text-muted">Last updated: {updated}</p>
        </div>
      </div>
    </>
  );
}
