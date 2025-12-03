import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useInvoiceSettings } from "@/context/InvoiceSettingsContext";
import { toast } from "sonner";

const PLACEHOLDERS = ["companyName", "email", "selectedBlocks", "selectedPixels", "total"];

const AdminInvoices = () => {
  const navigate = useNavigate();
  const { settings, loading, saveSettings } = useInvoiceSettings();
  const [subjectTemplate, setSubjectTemplate] = useState(settings.subjectTemplate);
  const [bodyTemplate, setBodyTemplate] = useState(settings.bodyTemplate);
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="min-h-screen bg-background px-5 py-8 md:px-10">
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
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Template"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInvoices;



