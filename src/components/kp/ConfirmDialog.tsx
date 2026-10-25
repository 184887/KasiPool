"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, inputCls } from "./admin";

type Ask = {
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button, for things that can't be undone */
  danger?: boolean;
  /** Ask for a note as well; `required` keeps the button off until something is typed */
  input?: { label: string; placeholder?: string; required?: boolean };
};

/**
 * In-app replacement for window.confirm / window.prompt, in the KasiPool style.
 * `ask()` resolves to the typed note ("" when there is no input) or `false` when cancelled.
 * Render the returned `dialog` once in the page.
 */
export function useConfirm() {
  const [req, setReq] = useState<Ask | null>(null);
  const [text, setText] = useState("");
  const resolver = useRef<(v: string | false) => void>(undefined);

  const ask = useCallback((opts: Ask) => {
    setText("");
    setReq(opts);
    return new Promise<string | false>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const finish = (v: string | false) => {
    resolver.current?.(v);
    resolver.current = undefined;
    setReq(null);
  };

  const blocked = !!req?.input?.required && !text.trim();
  const dialog = (
    <Dialog open={!!req} onOpenChange={(o) => !o && finish(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">{req?.title}</DialogTitle>
          {req?.body && <DialogDescription className="text-base">{req.body}</DialogDescription>}
        </DialogHeader>
        {req?.input && (
          <Field label={req.input.label}>
            <textarea
              className={inputCls + " h-24 py-2"}
              rows={3}
              autoFocus
              placeholder={req.input.placeholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </Field>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => finish(false)}>
            {req?.cancelLabel ?? "Go back"}
          </Button>
          <Button
            variant={req?.danger ? "destructive" : "default"}
            disabled={blocked}
            onClick={() => finish(text.trim())}
          >
            {req?.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  return [ask, dialog] as const;
}
