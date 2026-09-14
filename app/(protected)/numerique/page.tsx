'use client'
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
// `qrcode` ships no bundled types and @types/qrcode isn't installed.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, ExternalLink } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";
import { Restaurant } from "@/types";
import AppearanceSection from "./_components/AppearanceSection";
import DesignOrderSection from "./_components/DesignOrderSection";
import { useI18n } from "@/lib/i18n";

export default function NumeriquePage() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch("/api/magasin");
        const data = res.ok ? await res.json() : [];
        const list = Array.isArray(data) ? data : [];
        setRestaurants(list);
        if (list.length > 0) setSelectedId(list[0].id);
      } catch {
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const selected = restaurants.find((r) => r.id === selectedId);
  const qrUrl = selected?.qrUrl ?? "";

  useEffect(() => {
    if (!qrUrl) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(ensureHttp(qrUrl), { width: 320, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [qrUrl]);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(ensureHttp(qrUrl))
      .then(() => toast.success(t("numerique.copySuccess")))
      .catch(() => toast.error(t("numerique.copyError")));
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-${selected?.name ?? "menu"}.png`;
    link.click();
  };

  return (
    <ContentLayout title={t("nav.numerique")}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard" className="flex mx-auto justify-center items-center gap-2">
                <Logo className="max-md:hidden" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("nav.numerique")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="rounded-lg border-none  mt-6">
        <CardContent className="p-6">
          {/* Editorial header */}
          <div className="mb-8 border-b border-border pb-6">
            <h2 className="font-serif-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              {t("numerique.heading")}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t("numerique.subheading")}
            </p>
          </div>
          <Tabs defaultValue="qr" className="w-full">
            <TabsList>
              <TabsTrigger value="qr">{t("numerique.tab.qr")}</TabsTrigger>
              <TabsTrigger value="appearance">{t("numerique.tab.appearance")}</TabsTrigger>
              <TabsTrigger value="design">{t("numerique.tab.design")}</TabsTrigger>
            </TabsList>

            <TabsContent value="qr">
          <div className="mt-6">
            {loading ? (
              <div className="text-center text-muted-foreground py-16">{t("common.loading")}</div>
            ) : restaurants.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                <div className="flex justify-center">
                  <Image
                    className={`${theme === "dark" ? "dark:invert" : ""}`}
                    src="/images/empty-numerique.png"
                    alt="Empty folder"
                    width={400}
                    height={400}
                    priority
                  />
                </div>
                <p className="text-lg  font-semibold mt-4 text-foreground">{t("numerique.empty.title")}</p>
                <p className="mt-2">{t("numerique.empty.subtitle")}</p>
              </div>
            ) : (
              <div className="mx-auto max-w-md space-y-6">
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.chooseRestaurant")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {restaurants.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt="QR code" className="h-56 w-56" />
                  ) : (
                    <div className="flex h-56 w-56 items-center justify-center text-sm text-muted-foreground">
                      {t("numerique.qrUnavailable")}
                    </div>
                  )}

                  <TooltipProvider disableHoverableContent>
                  <div className="flex w-full items-center gap-2">
                    <Input readOnly value={ensureHttp(qrUrl)} />
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button size="icon" onClick={handleCopy} className="shrink-0 bg-yellow-400 text-black hover:bg-yellow-400/90" aria-label={t("tooltip.copyLink")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("tooltip.copyLink")}</TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:flex-row">
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button onClick={handleDownloadPng} className="flex-1 bg-yellow-400 text-black hover:bg-yellow-400/90">
                          <Download className="mr-2 h-4 w-4" /> {t("numerique.downloadQr")}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("tooltip.downloadQr")}</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button asChild variant="outline" className="flex-1">
                          <a href={ensureHttp(qrUrl)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" /> {t("numerique.previewMenu")}
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("tooltip.previewMenu")}</TooltipContent>
                    </Tooltip>
                  </div>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>
            </TabsContent>

            <TabsContent value="appearance">
              <div className="mt-6">
                <AppearanceSection />
              </div>
            </TabsContent>

            <TabsContent value="design">
              <div className="mt-6">
                <DesignOrderSection />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </ContentLayout>
  );
}

function ensureHttp(url: string) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
