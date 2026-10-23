import Link from "./link";
import { CREDITS } from "@/lib/credits";
import { ExternalLink } from "lucide-react";

const base = import.meta.env.BASE_URL;

export default function Credits() {
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">CREDITS</div>
        <h1>The photographs on this site.</h1>
        <p>
          Every photograph is from Wikimedia Commons under a public-domain dedication or a free license. We resized, cropped and warmed the
          color slightly so they sit together. Thank you to the photographers.
        </p>
      </div>
      <div className="credit-grid">
        {CREDITS.map((c) => (
          <figure key={c.slug} className="credit">
            <img src={`${base}images/${c.slug}-sm.jpg`} alt={c.alt} loading="lazy" width="360" height="240" />
            <figcaption>
              <strong>{c.alt}</strong>
              <br />
              Photo: {c.author}. {c.license}
              {c.licenseUrl && (
                <>
                  {" "}
                  (<a href={c.licenseUrl} target="_blank" rel="noreferrer">license</a>)
                </>
              )}
              .{" "}
              <a href={c.source} target="_blank" rel="noreferrer">
                Original <ExternalLink size={12} />
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
      <p>
        <Link href="/">Back to the home page</Link>
      </p>
    </>
  );
}
