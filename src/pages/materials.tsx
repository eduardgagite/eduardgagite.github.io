import { useTranslation } from 'react-i18next';

export function Materials() {
  const { t } = useTranslation();
  return (
    <section className="h-full w-full">
      <div className="mx-auto max-w-5xl h-full px-4 py-6 grid items-center">
        <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-primary/30 to-white/10 blur opacity-30 pointer-events-none" aria-hidden />
          <div className="relative">
            <h1 className="text-2xl font-semibold">Educational materials</h1>
            <p className="mt-2 opacity-85">
              Coming soon. Curated backend notes, diagrams, and hands-on guides (Go, Kafka, gRPC, Microservices).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


