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
      toast.error("Veuillez remplir tous les champs obligatoires.");
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
        toast.error("Impossible de créer la campagne.");
        return;
      }

      toast.success("Campagne créée avec succès.");
      resetForm();
      setDialogOpen(false);
      await loadCampaigns();
    } catch {
      toast.error("Une erreur est survenue lors de la création.");
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
        toast.error(data?.error || "Échec de l'envoi de la campagne.");
        return;
      }

      if (typeof data?.sent === "number") {
        toast.success(`Campagne envoyée à ${data.sent} destinataire(s).`);
      } else {
        toast.success(data?.message || "Campagne envoyée.");
      }

      await loadCampaigns();
    } catch {
      toast.error("Une erreur est survenue lors de l'envoi.");
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
        toast.error("Impossible de supprimer la campagne.");
        return;
      }

      toast.success("Campagne supprimée.");
      await loadCampaigns();
    } catch {
      toast.error("Une erreur est survenue lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ContentLayout title="Campagnes marketing">
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
            <BreadcrumbPage>Campagne marketing</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Campagnes marketing</h2>
              <p className="text-sm text-muted-foreground">
                Créez et envoyez des campagnes email à vos clients.
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className={PRIMARY_BUTTON}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une campagne
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Créer une campagne</DialogTitle>
                  <DialogDescription>
                    Composez votre email et ajoutez vos destinataires.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nom de la campagne</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex : Offre de printemps"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="restaurant">Restaurant</Label>
                    <Select
                      value={restaurantId}
                      onValueChange={setRestaurantId}
                    >
                      <SelectTrigger id="restaurant">
                        <SelectValue placeholder="Sélectionnez un restaurant" />
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
                    <Label htmlFor="subject">Objet de l&apos;email</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ex : Découvrez notre nouveau menu"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="body">Message</Label>
                    <Textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Le contenu de votre email..."
                      rows={5}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="recipients">Destinataires</Label>
                    <Textarea
                      id="recipients"
                      value={recipientsRaw}
                      onChange={(e) => setRecipientsRaw(e.target.value)}
                      placeholder="Collez les adresses email séparées par une virgule ou un retour à la ligne"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      {parseRecipients(recipientsRaw).length} adresse(s) valide(s)
                      détectée(s).
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
                    Créer la campagne
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
                  Aucune campagne pour le moment.
                </p>
                <p className="mt-2">
                  Créez une campagne email pour réengager vos clients et les
                  inviter à revenir dans votre restaurant.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Destinataires</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                          <Badge variant="success">Envoyée</Badge>
                        ) : (
                          <Badge variant="secondary">Brouillon</Badge>
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
                              <span className="ml-2">Envoyer</span>
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
