import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useContactSettings } from "@/context/ContactSettingsContext";
import { toast } from "sonner";
import { Mail, ExternalLink } from "lucide-react";
import SEO from "@/components/SEO";

const AdminContact = () => {
  const navigate = useNavigate();
  const { settings, loading, updateSettings } = useContactSettings();
  
  const [form, setForm] = useState({
    email: "",
    xLink: "",
    xHandle: "",
    responseTime: "",
    additionalInfo: "",
  });
  const [saving, setSaving] = useState(false);

  // Sync form with loaded settings
  useEffect(() => {
    if (!loading) {
      setForm({
        email: settings.email,
        xLink: settings.xLink,
        xHandle: settings.xHandle,
        responseTime: settings.responseTime,
        additionalInfo: settings.additionalInfo || "",
      });
    }
  }, [loading, settings]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.email || !form.xLink) {
      toast.error("Email and X link are required.");
      return;
    }
    setSaving(true);
    try {
      await updateSettings({
        email: form.email.trim(),
        xLink: form.xLink.trim(),
        xHandle: form.xHandle.trim(),
        responseTime: form.responseTime.trim(),
        additionalInfo: form.additionalInfo.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 py-8 md:px-10">
      <SEO title="Contact Settings" noIndex />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Million Dollar Crypto Page</p>
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase">Contact Settings</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Admin
          </Button>
          <Button variant="secondary" onClick={() => navigate("/contact")}>
            View Contact Page
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Edit Contact Info</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading settings…</p>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email *</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="hello@themilliondollarcryptopage.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This email appears on the Contact page and is used for inquiries.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-xlink">X (Twitter) Profile URL *</Label>
                  <Input
                    id="contact-xlink"
                    type="url"
                    value={form.xLink}
                    onChange={(e) => setForm((prev) => ({ ...prev, xLink: e.target.value }))}
                    placeholder="https://x.com/YourHandle"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This link is used in the header X logo and on the Contact page.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-xhandle">X Handle (Display Name)</Label>
                  <Input
                    id="contact-xhandle"
                    value={form.xHandle}
                    onChange={(e) => setForm((prev) => ({ ...prev, xHandle: e.target.value }))}
                    placeholder="@MillionDollarCryptoPage"
                  />
                  <p className="text-xs text-muted-foreground">
                    The handle shown on the Contact page (e.g., @YourHandle).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-response">Response Time</Label>
                  <Input
                    id="contact-response"
                    value={form.responseTime}
                    onChange={(e) => setForm((prev) => ({ ...prev, responseTime: e.target.value }))}
                    placeholder="24 hours"
                  />
                  <p className="text-xs text-muted-foreground">
                    How quickly you aim to respond (e.g., "24 hours", "48 hours").
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-additional">Additional Info (optional)</Label>
                  <Textarea
                    id="contact-additional"
                    rows={3}
                    value={form.additionalInfo}
                    onChange={(e) => setForm((prev) => ({ ...prev, additionalInfo: e.target.value }))}
                    placeholder="Any additional message to display on the contact page..."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-secondary/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <a
                href={`mailto:${form.email}`}
                className="block text-foreground hover:text-primary transition-colors break-all"
              >
                {form.email || "Not set"}
              </a>
            </div>

            <div className="rounded-lg border border-border/60 bg-secondary/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <img src="/x-logo.png" alt="X" className="h-4 w-4" />
                X (Twitter)
              </div>
              <a
                href={form.xLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              >
                {form.xHandle || form.xLink || "Not set"}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="rounded-lg border border-border/60 bg-secondary/30 p-4 space-y-2">
              <div className="text-sm font-semibold text-primary">Response Time</div>
              <p className="text-foreground">{form.responseTime || "Not set"}</p>
            </div>

            {form.additionalInfo && (
              <div className="rounded-lg border border-border/60 bg-secondary/30 p-4 space-y-2">
                <div className="text-sm font-semibold text-primary">Additional Info</div>
                <p className="text-sm text-muted-foreground">{form.additionalInfo}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              The X link will also appear in the site header (the X logo).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminContact;




