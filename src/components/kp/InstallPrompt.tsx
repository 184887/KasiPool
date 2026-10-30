"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { installApp, registerServiceWorker, useInstall } from "@/lib/install";
import { useT } from "@/i18n";

const DISMISSED = "kp-install-dismissed";

/** A small card that offers to put KasiPool on the home screen, until it is installed or closed */
export function InstallBanner() {
  const { installed, canPrompt, ios, iosSafari } = useInstall();
  const [dismissed, setDismissed] = useState(true);
  const pathname = usePathname();
  const { t, rich } = useT();

  useEffect(() => {
    registerServiceWorker();
    try {
      setDismissed(localStorage.getItem(DISMISSED) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  // Keep sign-up and log-in free of extras
  if (installed || dismissed || pathname === "/auth" || !(canPrompt || ios)) return null;

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {
      // Private browsing: the card just comes back next time
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <div className="flex items-start gap-3 rounded-md border-2 border-ink bg-card p-3">
        <img src="/icons/icon-192.png" alt="" className="size-12 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold">{t("Get the KasiPool app")}</p>
          {canPrompt ? (
            <>
              <p className="text-sm text-muted-foreground">
                {t("Open KasiPool from your home screen, like any app.")}
              </p>
              <Button variant="gold" className="mt-2" onClick={() => installApp()}>
                <Download aria-hidden="true" />
                {t("Install")}
              </Button>
            </>
          ) : iosSafari ? (
            <IosSteps />
          ) : (
            <p className="text-sm text-muted-foreground">
              {rich("Open this page in <b>Safari</b> to add KasiPool to your home screen.", {
                b: (c) => <b className="text-ink">{c}</b>,
              })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={t("Close")}
          className="-m-2 grid size-12 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-ink/5 hover:text-ink"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function IosSteps() {
  const { rich } = useT();
  return (
    <p className="text-sm text-muted-foreground">
      {rich("Tap <share>Share</share> in Safari, then <b>Add to Home Screen</b> <plus>+</plus>.", {
        share: (c) => (
          <Share
            className="inline size-4 align-text-bottom text-ink"
            role="img"
            aria-label={String(c)}
          />
        ),
        b: (c) => <b className="text-ink">{c}</b>,
        plus: () => (
          <SquarePlus className="inline size-4 align-text-bottom text-ink" aria-hidden="true" />
        ),
      })}
    </p>
  );
}

/** Install steps for every phone, for the Help page */
export function InstallSteps() {
  const { installed, canPrompt } = useInstall();
  const { t, rich } = useT();
  const b = (c: ReactNode) => <b>{c}</b>;
  if (installed) return <p>{t("You are using the KasiPool app. It is on your home screen.")}</p>;
  return (
    <>
      <p>
        {t(
          "Put KasiPool on your phone's home screen and open it like any other app. It is free and you do not need the Play Store or App Store.",
        )}
      </p>
      {canPrompt && (
        <Button variant="gold" onClick={() => installApp()}>
          <Download aria-hidden="true" />
          {t("Install KasiPool")}
        </Button>
      )}
      <p className="font-semibold">Android (Chrome)</p>
      <ol className="list-decimal pl-5">
        <li>{t("Open KasiPool in Chrome.")}</li>
        <li>{t("Tap the menu (three dots) at the top right.")}</li>
        <li>{rich("Tap <b>Install app</b> or <b>Add to Home screen</b>.", { b })}</li>
      </ol>
      <p className="font-semibold">iPhone (Safari)</p>
      <ol className="list-decimal pl-5">
        <li>{t("Open KasiPool in Safari.")}</li>
        <li>
          {rich("Tap the Share button <share>Share</share> at the bottom.", {
            share: (c) => (
              <Share
                className="inline size-4 align-text-bottom"
                role="img"
                aria-label={String(c)}
              />
            ),
          })}
        </li>
        <li>{rich("Tap <b>Add to Home Screen</b>, then <b>Add</b>.", { b })}</li>
      </ol>
    </>
  );
}
