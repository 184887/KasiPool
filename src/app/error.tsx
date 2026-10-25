"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <h1 className="font-headline text-4xl">This page didn&apos;t load</h1>
      <p className="mt-2 text-muted-foreground">
        It may be your connection. Check your data or Wi-Fi, then try again.
      </p>
      <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button variant="gold" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
