'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Loader2, Plus, Send, Trash2 } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { notFound } from "next/navigation";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";
import { MARKETING_ENABLED } from "@/config";
import { useI18n } from "@/lib/i18n";

const PRIMARY_BUTTON = "bg-yellow-400 hover:bg-yellow-400 text-black";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Restaurant {
  id: string;
  name: string;
}

interface EmailRecipient {
  id: string;
  email: string;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  description: string | null;
  sent: boolean;
  restaurant: { id: string; name: string } | null;
  emailRecipients: EmailRecipient[];
}

function parseRecipients(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\n,;]+/)
        .map((email) => email.trim())
        .filter((email) => EMAIL_REGEX.test(email))
    )
  );
}

export default function MarketingPage() {
  // Feature-flagged off until we ship marketing campaigns to production.
  // Blocks direct URL access (the nav entry is already hidden).
  if (!MARKETING_ENABLED) {
    notFound();
  }

  const { theme } = useTheme();
  const { t } = useI18n();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientsRaw, setRecipientsRaw] = useState("");

  async function loadCampaigns() {
    try {
      const res = await fetch("/api/campaign");
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch {
      setCampaigns([]);
    }
  }

  async function loadRestaurants() {
    try {
      const res = await fetch("/api/magasin");
      const data = await res.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch {
      setRestaurants([]);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadCampaigns(), loadRestaurants()]);
      setLoading(false);
    })();
  }, []);

  function resetForm() {
    setName("");
    setRestaurantId("");
    setSubject("");
    setBody("");
    setRecipientsRaw("");
  }

  async function handleCreate() {
    if (!name.trim() || !restaurantId || !subject.trim() || !body.trim()) {
      toast.error(t("marketing.requiredFields"));
      return;
    }

    const recipients = parseRecipients(recipientsRaw);

    setSubmitting(true);
    try {
      const res = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subject: subject.trim(),
          body,
          restaurantId,
          recipients,
        }),
      });

      if (!res.ok) {
        toast.error(t("marketing.toast.createError"));
        return;
      }

      toast.success(t("marketing.toast.created"));
      resetForm();
      setDialogOpen(false);
      await loadCampaigns();
    } catch {
      toast.error(t("marketing.toast.createException"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSend(id: string) {
    setSendingId(id);
    try {
      const res = await fetch("/api/campaign/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || t("marketing.toast.sendError"));
        return;
      }

      if (typeof data?.sent === "number") {
        toast.success(
          t("marketing.toast.sentCount").replace("{count}", String(data.sent))
        );
      } else {
        toast.success(data?.message || t("marketing.toast.sent"));
      }

      await loadCampaigns();
    } catch {
      toast.error(t("marketing.toast.sendException"));
    } finally {
      setSendingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/campaign", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        toast.error(t("marketing.toast.deleteError"));
        return;
      }

      toast.success(t("marketing.toast.deleted"));
      await loadCampaigns();
    } catch {
      toast.error(t("marketing.toast.deleteException"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ContentLayout title={t("marketing.heading")}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href="/dashboard"
                className="flex mx-auto justify-center items-center gap-2"
              >
                <Logo className="max-md:hidden" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("nav.marketing")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{t("marketing.heading")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("marketing.subtitle")}
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className={PRIMARY_BUTTON}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("marketing.create")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>{t("marketing.create")}</DialogTitle>
                  <DialogDescription>
                    {t("marketing.create.desc")}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">{t("marketing.field.name")}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("marketing.field.namePlaceholder")}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="restaurant">{t("common.restaurant")}</Label>
                    <Select
                      value={restaurantId}
                      onValueChange={setRestaurantId}
                    >
                      <SelectTrigger id="restaurant">
                        <SelectValue placeholder={t("marketing.field.restaurantPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {restaurants.map((restaurant) => (
                          <SelectItem key={restaurant.id} value={restaurant.id}>
                            {restaurant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="subject">{t("marketing.field.subject")}</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t("marketing.field.subjectPlaceholder")}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="body">{t("marketing.field.message")}</Label>
                    <Textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder={t("marketing.field.messagePlaceholder")}
                      rows={5}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="recipients">{t("marketing.field.recipients")}</Label>
                    <Textarea
                      id="recipients"
                      value={recipientsRaw}
                      onChange={(e) => setRecipientsRaw(e.target.value)}
                      placeholder={t("marketing.field.recipientsPlaceholder")}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      {parseRecipients(recipientsRaw).length} {t("marketing.recipientsDetected")}
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    className={PRIMARY_BUTTON}
                    onClick={handleCreate}
                    disabled={submitting}
                  >
                    {submitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("marketing.submit")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center text-gray-500 py-6">
                <div className="flex justify-center">
                  <Image
                    className={`${theme === "dark" ? "dark:invert" : ""}`}
                    src={"/images/empty-campaign.png"}
                    alt="Aucune campagne"
                    width={400}
                    height={400}
                    priority
                  />
                </div>
                <p className="text-lg text-gray-700 font-semibold mt-4">
                  {t("marketing.empty.title")}
                </p>
                <p className="mt-2">
                  {t("marketing.empty.subtitle")}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("marketing.col.name")}</TableHead>
                    <TableHead>{t("common.restaurant")}</TableHead>
                    <TableHead>{t("marketing.col.subject")}</TableHead>
                    <TableHead>{t("marketing.col.recipients")}</TableHead>
                    <TableHead>{t("marketing.col.status")}</TableHead>
                    <TableHead className="text-right">{t("marketing.col.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        {campaign.name}
                      </TableCell>
                      <TableCell>{campaign.restaurant?.name ?? "—"}</TableCell>
                      <TableCell>{campaign.subject}</TableCell>
                      <TableCell>{campaign.emailRecipients.length}</TableCell>
                      <TableCell>
                        {campaign.sent ? (
                          <Badge variant="success">{t("marketing.status.sent")}</Badge>
                        ) : (
                          <Badge variant="secondary">{t("marketing.status.draft")}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!campaign.sent && (
                            <Button
                              size="sm"
                              className={PRIMARY_BUTTON}
                              onClick={() => handleSend(campaign.id)}
                              disabled={sendingId === campaign.id}
                            >
                              {sendingId === campaign.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                              <span className="ml-2">{t("marketing.send")}</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(campaign.id)}
                            disabled={deletingId === campaign.id}
                          >
                            {deletingId === campaign.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
