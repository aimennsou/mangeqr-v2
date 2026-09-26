"use client";

import { CookieIcon } from "lucide-react";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export default function CookieConsent({
    variant = "default",
    demo = false,
    onAcceptCallback = () => { },
    onDeclineCallback = () => { },
}) {
    const pathname = usePathname();
    const { t } = useI18n();
    // Never show the cookie banner inside embedded/utility views or on in-store
    // hardware:
    //  - /embed  the review badge iframe and /m the lead-menu preview are meant
    //            to be chrome-free, so the banner leaking into them (e.g. the
    //            badge Aperçu) is a bug.
    //  - /borne  the self-order kiosk and /tv the menu board run unattended on
    //            a screen the diner does not own. Nobody is there to dismiss a
    //            consent dialog, and it sat on top of the kiosk flow.
    const SUPPRESSED_PREFIXES = ["/embed", "/m", "/borne", "/tv"];
    const suppressed =
        !!pathname &&
        SUPPRESSED_PREFIXES.some(
            (p) => pathname === p || pathname.startsWith(`${p}/`)
        );
    const [isOpen, setIsOpen] = useState(false);
    const [hide, setHide] = useState(false);

    const accept = () => {
        setIsOpen(false);
        document.cookie = "cookieConsent=true; expires=Fri, 31 Dec 9999 23:59:59 GMT";
        setTimeout(() => {
            setHide(true);
        }, 700);
        onAcceptCallback();
    };

    const decline = () => {
        setIsOpen(false);
        setTimeout(() => {
            setHide(true);
        }, 700);
        onDeclineCallback();
    };

    useEffect(() => {
        try {
            setIsOpen(true);
            if (document.cookie.includes("cookieConsent=true")) {
                if (!demo) {
                    setIsOpen(false);
                    setTimeout(() => {
                        setHide(true);
                    }, 700);
                }
            }
        }
        catch (e) {
            // console.log("Error: ", e);
        }
    }, [demo]);

    if (suppressed) return null;

    // Logical inset/start so the banner sits bottom-left in LTR and
    // bottom-right in Arabic instead of overlapping the RTL content flow.
    const shellClass = cn(
        "fixed z-[200] bottom-0 inset-x-0 sm:inset-x-auto sm:start-4 sm:bottom-4 w-full sm:max-w-md duration-700",
        !isOpen
            ? "transition-[opacity,transform] translate-y-8 opacity-0"
            : "transition-[opacity,transform] translate-y-0 opacity-100",
        hide && "hidden"
    );

    return (
        variant == "default" ? (
            <div className={shellClass}>
                <div className="dark:bg-card bg-background rounded-md m-3 border border-border shadow-lg">
                    <div className="grid gap-2">
                        <div className="border-b border-border h-14 flex items-center justify-between p-4">
                            <h1 className="text-lg font-medium">{t("cookies.title")}</h1>
                            <CookieIcon className="h-[1.2rem] w-[1.2rem]" />
                        </div>
                        <div className="p-4">
                            <p className="text-sm font-normal text-start">
                                {t("cookies.body")}
                                <br />
                                <br />
                                <span className="text-xs">
                                    {t("cookies.noteLead")}
                                    <span className="font-medium opacity-80">{t("cookies.accept")}</span>
                                    {t("cookies.noteRest")}
                                </span>
                                <br />
                                {/* Restored now that /cgu exists — this link used
                                    to 404, so it was removed. */}
                                <a href="/cgu" className="text-xs underline">
                                    {t("cookies.learnMore")}
                                </a>
                            </p>
                        </div>
                        <div className="flex gap-2 p-4 py-5 border-t border-border dark:bg-background/20">
                            <Button onClick={accept} className="w-full">{t("cookies.accept")}</Button>
                            <Button onClick={decline} className="w-full" variant="secondary">{t("cookies.decline")}</Button>
                        </div>
                    </div>
                </div>
            </div>
        ) : variant == "small" && (
            <div className={shellClass}>
                <div className="m-3 dark:bg-card bg-background border border-border rounded-lg">
                    <div className="flex items-center justify-between p-3">
                        <h1 className="text-lg font-medium">{t("cookies.title")}</h1>
                        <CookieIcon className="h-[1.2rem] w-[1.2rem]" />
                    </div>
                    <div className="p-3 -mt-2">
                        <p className="text-sm text-start text-muted-foreground">
                            {t("cookies.bodyShort")}
                        </p>
                    </div>
                    <div className="p-3 flex items-center gap-2 mt-2 border-t">
                        <Button onClick={accept} className="w-full h-9 rounded-full">{t("cookies.accept")}</Button>
                        <Button onClick={decline} className="w-full h-9 rounded-full" variant="outline">{t("cookies.decline")}</Button>
                    </div>
                </div>
            </div>
        )
    )

}
