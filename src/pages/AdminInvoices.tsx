import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useInvoiceSettings } from "@/context/InvoiceSettingsContext";
import { toast } from "sonner";
import type { BuyRequest } from "@/types/buy";

const PLACEHOLDERS = ["companyName", "email", "selectedBlocks", "selectedPixels", "total"];

// Sample data for testing templates
const SAMPLE_BUY_REQUEST: BuyRequest = {
  id: "test-request",
  companyName: "Test Company Inc.",
  email: "test@example.com",
  selectedBlocks: 5,
  selectedPixels: 500,
  createdAt: Date.now(),
  paid: false,
};

const renderTemplate = (template: string, request: BuyRequest) => {
  const tokenMap: Record<string, string> = {
    companyName: request.companyName ?? "",
    email: request.email ?? "",
    selectedBlocks: request.selectedBlocks.toString(),
    selectedPixels: request.selectedPixels.toString(),
    total: `$${(request.selectedBlocks * 100).toLocaleString()}`,
  };
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, token) => tokenMap[token] ?? "");
};

const AdminInvoices = () => {
  const navigate = useNavigate();
  const { settings, loading, saveSettings } = useInvoiceSettings();
  const [subjectTemplate, setSubjectTemplate] = useState(settings.subjectTemplate);
  const [bodyTemplate, setBodyTemplate] = useState(settings.bodyTemplate);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("huzaifa8195@gmail.com");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setSubjectTemplate(settings.subjectTemplate);
    setBodyTemplate(settings.bodyTemplate);
  }, [settings]);

  const onSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveSettings({
        subjectTemplate,
        bodyTemplate,
        updatedAt: Date.now(),
      });
      toast.success("Invoice template saved.");
    } catch (err) {
      console.error("Failed to save invoice settings", err);
      toast.error("Unable to save template.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setTesting(true);
    try {
      const subject = renderTemplate(subjectTemplate, SAMPLE_BUY_REQUEST);
      const html = renderTemplate(bodyTemplate, SAMPLE_BUY_REQUEST);

      const response = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail, subject, html }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send test email");
      }

      toast.success(`Test email sent to ${testEmail}`);
    } catch (err) {
      console.error("Failed to send test email", err);
      toast.error(err instanceof Error ? err.message : "Unable to send test email. Check console for details.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 py-8 md:px-10">
      <SEO title="Invoice Settings" noIndex />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Million Dollar Crypto Page</p>
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase">Invoice Template</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Admin
          </Button>
        </div>
      </div>

      <Card className="mt-8 border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Customize Email</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading settings…</p>
          ) : (
            <form className="space-y-4" onSubmit={onSave}>
              <div className="space-y-2">
                <Label htmlFor="invoice-subject">Subject Template</Label>
                <Input
                  id="invoice-subject"
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-body">HTML Body Template</Label>
                <Textarea
                  id="invoice-body"
                  rows={10}
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Available placeholders:{" "}
                  {PLACEHOLDERS.map((token) => (
                    <span key={token} className="mr-2 inline-flex rounded bg-muted px-1.5 py-0.5 font-mono text-[0.65rem]">
                      {"{{"}{token}{"}}"}
                    </span>
                  ))}
                </p>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Template"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Test Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email address to send test email"
              />
              <p className="text-xs text-muted-foreground">
                This will send a test email using the current template with sample data:
                <br />
                Company: {SAMPLE_BUY_REQUEST.companyName}, Blocks: {SAMPLE_BUY_REQUEST.selectedBlocks}, Pixels: {SAMPLE_BUY_REQUEST.selectedPixels}
              </p>
            </div>
            <Button 
              onClick={handleTestEmail} 
              disabled={testing || loading}
              variant="outline"
            >
              {testing ? "Sending Test Email…" : "Send Test Email"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInvoices;





