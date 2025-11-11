import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Edit this array to manually add companies in the order they purchased.
// Display order is the array order (top to bottom).
const firstBuyers: Array<{ company: string; website?: string; logoUrl?: string }> = [
  // Example:
  // { company: "Acme Inc.", website: "https://acme.com", logoUrl: "https://acme.com/logo.png" },
];

const FirstBuyers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="px-5 md:px-10 pt-36 pb-12">
        <div className="mx-auto w-full max-w-5xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">First Buyers</CardTitle>
            </CardHeader>
            <CardContent>
              {firstBuyers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No buyers listed yet. Add entries to the list to display them here.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {firstBuyers.map((b, idx) => (
                    <li key={idx} className="flex items-center gap-4 py-3">
                      {b.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.logoUrl}
                          alt={`${b.company} logo`}
                          className="h-8 w-8 rounded object-cover border border-border"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted border border-border" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium">{b.company}</span>
                        {b.website ? (
                          <a
                            href={b.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {b.website}
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FirstBuyers;


