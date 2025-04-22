import Hero from "@/components/ui/Hero";
import Features from "@/components/ui/Features";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<div>Yükleniyor...</div>}>
        <Hero />
        <Features />
      </Suspense>
    </main>
  );
}
