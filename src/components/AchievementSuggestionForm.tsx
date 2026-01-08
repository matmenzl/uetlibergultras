import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Lightbulb, Send } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(3, "Titel muss mindestens 3 Zeichen haben").max(100, "Titel darf maximal 100 Zeichen haben"),
  description: z
    .string()
    .min(10, "Beschreibung muss mindestens 10 Zeichen haben")
    .max(500, "Beschreibung darf maximal 500 Zeichen haben"),
  howToEarn: z
    .string()
    .min(20, "Erklärung muss mindestens 20 Zeichen haben")
    .max(1000, "Erklärung darf maximal 1000 Zeichen haben"),
  email: z.string().trim().min(1, "E-Mail ist erforderlich").max(255, "E-Mail darf maximal 255 Zeichen haben").email("Bitte gib eine gültige E-Mail-Adresse ein"),
  wantsUpdates: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface AchievementSuggestionFormProps {
  userId: string | null;
}

export function AchievementSuggestionForm({ userId }: AchievementSuggestionFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      howToEarn: "",
      email: "",
      wantsUpdates: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!userId) {
      toast.error("Du musst angemeldet sein, um einen Vorschlag einzureichen.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("achievement_suggestions").insert({
        user_id: userId,
        title: data.title,
        description: data.description,
        how_to_earn: data.howToEarn,
        email: data.email,
        wants_updates: data.wantsUpdates,
      });

      if (error) throw error;

      toast.success("Danke für deinen Vorschlag! Wir werden ihn prüfen.");
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error submitting achievement suggestion:", error);
      toast.error("Fehler beim Einreichen des Vorschlags.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Lightbulb className="h-4 w-4" />
          Badge vorschlagen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Badge vorschlagen
          </DialogTitle>
          <DialogDescription>Hast du eine Idee für ein neues Badge?</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Gipfelstürmer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kurzbeschreibung</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. 100x den Gipfel erreicht" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="howToEarn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wie verdient man es?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Beschreibe detailliert, wie man dieses Achievement verdienen kann..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail</FormLabel>
                  <FormControl>
                    <Input placeholder="deine@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wantsUpdates"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Benachrichtige mich über Status-Updates
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
              <Send className="h-4 w-4" />
              {isSubmitting ? "Wird eingereicht..." : "Vorschlag einreichen"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
