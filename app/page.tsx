import RandomPattern from "./components/RandomPattern";

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
      <RandomPattern />
    </main>
  );
}
