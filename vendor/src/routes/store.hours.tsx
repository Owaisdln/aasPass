import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import * as api from "@/features/vendor/api/vendor";
import { Card, ErrorNote, Loading, Section, TopBar, VendorScreen } from "@/features/vendor/components";
import { WEEK_DAYS, type StoreHourInput } from "@/features/vendor/model";
import { q, useVendorMutation } from "@/features/vendor/queries";

export const Route = createFileRoute("/store/hours")({
  head: () => ({
    meta: [
      { title: "Opening hours · aasPass Partner" },
      { name: "description", content: "Set the days and times your store takes orders." },
      { property: "og:title", content: "Opening hours · aasPass Partner" },
      { property: "og:description", content: "Set the days and times your store takes orders." },
    ],
  }),
  component: () => <VendorScreen tabs={false}><HoursScreen /></VendorScreen>,
});

const label = (d: string) => d[0] + d.slice(1).toLowerCase();

function HoursScreen() {
  const hours = useQuery(q.hours);
  const [rows, setRows] = useState<StoreHourInput[]>([]);
  const save = useVendorMutation((h: StoreHourInput[]) => api.saveHours(h), "Opening hours saved");

  useEffect(() => {
    if (!hours.data) return;
    setRows(WEEK_DAYS.map((weekDay) => {
      const h = hours.data.find((x) => x.weekDay === weekDay);
      return { weekDay, isClosed: h ? h.isClosed : true, openingTime: h?.openingTime ?? "09:00", closingTime: h?.closingTime ?? "21:00" };
    }));
  }, [hours.data]);

  const invalid = rows.find((r) => !r.isClosed && (!r.openingTime || !r.closingTime || r.openingTime >= r.closingTime));
  const update = (i: number, patch: Partial<StoreHourInput>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <>
      <TopBar title="Opening hours" back="/store" />
      {hours.isLoading ? <Loading /> : hours.error ? <ErrorNote error={hours.error} /> : (
        <Section>
          <Card className="divide-y p-0">
            {rows.map((r, i) => (
              <div key={r.weekDay} className="flex items-center gap-2 p-3">
                <Switch checked={!r.isClosed} onCheckedChange={(c) => update(i, { isClosed: !c })} aria-label={`Open on ${label(r.weekDay)}`} />
                <span className="w-24 text-sm font-bold">{label(r.weekDay)}</span>
                {r.isClosed ? <span className="text-sm text-muted-foreground">Closed</span> : (
                  <div className="flex flex-1 items-center gap-1.5">
                    <Input type="time" className="h-9 px-2" value={r.openingTime} onChange={(e) => update(i, { openingTime: e.target.value })} />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input type="time" className="h-9 px-2" value={r.closingTime} onChange={(e) => update(i, { closingTime: e.target.value })} />
                  </div>
                )}
              </div>
            ))}
          </Card>
          {invalid && <p className="mt-2 text-xs font-bold text-destructive">{label(invalid.weekDay)}: closing time must be after opening time.</p>}
          <Button size="lg" className="mt-4 w-full font-bold" disabled={!!invalid || save.isPending}
            onClick={() => save.mutate(rows.map((r) => r.isClosed ? { weekDay: r.weekDay, isClosed: true } : r))}>Save hours</Button>
        </Section>
      )}
    </>
  );
}
