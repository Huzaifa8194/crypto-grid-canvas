import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/SEO";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useFAQ } from "@/context/FAQContext";
import { type FAQItem } from "@/types/faq";
import { toast } from "sonner";
import { HelpCircle, ArrowUp, ArrowDown, Edit2, Trash2, HelpCircle as HelpIcon } from "lucide-react";

const AdminFAQ = () => {
  const navigate = useNavigate();
  const { items, loading, error, addItem, updateItem, deleteItem, moveItem } = useFAQ();
  
  const [form, setForm] = useState({
    question: "",
    answer: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.question || !form.answer) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await updateItem(editingId, {
          question: form.question,
          answer: form.answer,
        });
        setEditingId(null);
      } else {
        await addItem({
          question: form.question,
          answer: form.answer,
        });
      }
      setForm({ question: "", answer: "" });
    } catch (err) {
      console.error("Failed to save FAQ", err);
      toast.error("An error occurred. Check console for details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditInit = (item: FAQItem) => {
    setEditingId(item.id);
    setForm({
      question: item.question,
      answer: item.answer,
    });
    toast.info(`Editing FAQ: "${item.question.slice(0, 30)}..."`);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ question: "", answer: "" });
  };

  const handleDelete = async (item: FAQItem) => {
    const confirmed = window.confirm(`Remove FAQ: "${item.question}"?`);
    if (!confirmed) return;
    setDeletingId(item.id);
    try {
      await deleteItem(item.id);
      if (editingId === item.id) {
        handleCancelEdit();
      }
    } catch (err) {
      console.error("Failed to delete FAQ", err);
    } finally {
      setDeletingId((prev) => (prev === item.id ? null : prev));
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 py-8 md:px-10">
      <SEO title="Manage FAQ" noIndex />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Million Dollar Crypto Page</p>
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase">Manage FAQ</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Admin
          </Button>
          <Button variant="secondary" onClick={() => navigate("/faq")}>
            View FAQ Page
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Left Side: Form */}
        <Card className="border-border/60 bg-card/70 h-fit">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              {editingId ? "Edit FAQ Item" : "Add FAQ Item"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="faq-question">Question *</Label>
                <Input
                  id="faq-question"
                  value={form.question}
                  onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                  placeholder="e.g. How does pixel purchasing work?"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faq-answer">Answer *</Label>
                <Textarea
                  id="faq-answer"
                  rows={8}
                  value={form.answer}
                  onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))}
                  placeholder="Provide a detailed, clear answer. Markdown or linebreaks are supported."
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Saving..." : editingId ? "Save Changes" : "Add FAQ Item"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleCancelEdit}
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right Side: List */}
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              FAQ Questions ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-sm text-muted-foreground">Loading FAQ items…</p>}
            {error && <p className="text-sm text-red-400">Unable to load: {error.toLowerCase()}</p>}
            {!loading && items.length === 0 && (
              <div className="text-center py-8">
                <HelpIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No FAQ items yet. Add your first one using the form!</p>
              </div>
            )}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {items.map((item, index) => {
                const isItemEditing = editingId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded border p-4 transition-all duration-200 ${
                      isItemEditing
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/60 bg-card/40 hover:border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base leading-snug">
                          {item.question}
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border/40 pt-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={index === 0}
                        onClick={() => moveItem(item.id, "up")}
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5 mr-1" />
                        Up
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={index === items.length - 1}
                        onClick={() => moveItem(item.id, "down")}
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5 mr-1" />
                        Down
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditInit(item)}
                        title="Edit Question"
                        disabled={isItemEditing}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="ml-auto"
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        {deletingId === item.id ? "Removing..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminFAQ;
