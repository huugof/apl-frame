import RandomPattern from "./components/RandomPattern";
import { Suspense } from "react";

export default function Home() {
  // Format today's date in a clean way
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <main className="min-h-screen">
      <Suspense fallback={<div>Loading pattern...</div>}>
        <RandomPattern />
      </Suspense>
    </main>
  );
}
