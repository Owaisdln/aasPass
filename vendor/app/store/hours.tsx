import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import * as api from "../../src/features/vendor/api/vendor";
import { WEEK_DAYS, type StoreHourInput } from "../../src/features/vendor/model";
import {
  ActionButton,
  Card,
  ErrorNote,
  Field,
  Loading,
  palette,
  Screen,
  Section,
  Tag,
  TopBar,
  useVendorMutation,
} from "../../src/native/ui";

const dayName = (day: string) => day[0] + day.slice(1).toLowerCase();

export default function HoursScreen() {
  const hours = useQuery({ queryKey: ["vendor", "hours"], queryFn: api.getHours });
  const [rows, setRows] = useState<StoreHourInput[]>([]);
  const save = useVendorMutation(
    (value: StoreHourInput[]) => api.saveHours(value),
    "Opening hours saved",
  );

  useEffect(() => {
    if (!hours.data) return;
    setRows(
      WEEK_DAYS.map((weekDay) => {
        const saved = hours.data.find((row) => row.weekDay === weekDay);
        return {
          weekDay,
          isClosed: saved ? saved.isClosed : true,
          openingTime: saved?.openingTime ?? "09:00",
          closingTime: saved?.closingTime ?? "21:00",
        };
      }),
    );
  }, [hours.data]);

  const update = (index: number, patch: Partial<StoreHourInput>) => {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  const invalid = rows.find(
    (row) =>
      !row.isClosed && (!row.openingTime || !row.closingTime || row.openingTime >= row.closingTime),
  );

  return (
    <Screen>
      <TopBar title="Opening hours" back />
      {hours.isLoading ? (
        <Loading />
      ) : hours.error ? (
        <ErrorNote message={hours.error.message} />
      ) : (
        <>
          <Section>
            <Card style={{ padding: 0 }}>
              {rows.map((row, index) => (
                <View
                  key={row.weekDay}
                  style={{ padding: 12, borderBottomWidth: 1, borderColor: palette.border }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Pressable
                      onPress={() => update(index, { isClosed: !row.isClosed })}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: !row.isClosed }}
                      style={{
                        width: 45,
                        height: 27,
                        justifyContent: "center",
                        paddingHorizontal: 3,
                        borderRadius: 20,
                        backgroundColor: row.isClosed ? "#D9E0DB" : palette.primary,
                      }}
                    >
                      <View
                        style={{
                          width: 21,
                          height: 21,
                          borderRadius: 12,
                          backgroundColor: "#fff",
                          alignSelf: row.isClosed ? "flex-start" : "flex-end",
                        }}
                      />
                    </Pressable>
                    <Text
                      style={{ width: 92, color: palette.ink, fontSize: 13, fontWeight: "800" }}
                    >
                      {dayName(row.weekDay)}
                    </Text>
                    {row.isClosed ? <Tag text="Closed" /> : <Tag text="Open" tone="green" />}
                  </View>
                  {!row.isClosed ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        paddingLeft: 55,
                        marginTop: 10,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Field
                          label="Opens"
                          value={row.openingTime ?? ""}
                          placeholder="09:00"
                          onChangeText={(openingTime) => update(index, { openingTime })}
                        />
                      </View>
                      <Text style={{ marginBottom: 12, color: palette.muted }}>to</Text>
                      <View style={{ flex: 1 }}>
                        <Field
                          label="Closes"
                          value={row.closingTime ?? ""}
                          placeholder="21:00"
                          onChangeText={(closingTime) => update(index, { closingTime })}
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
              ))}
            </Card>
            {invalid ? (
              <Text
                style={{ marginTop: 9, color: palette.danger, fontSize: 12, fontWeight: "700" }}
              >
                {dayName(invalid.weekDay)}: enter a valid time range. Use HH:MM (24-hour time).
              </Text>
            ) : null}
          </Section>
          <Section>
            <ActionButton
              title={save.isPending ? "Saving…" : "Save hours"}
              disabled={save.isPending || Boolean(invalid)}
              onPress={() =>
                save.mutate(
                  rows.map((row) =>
                    row.isClosed ? { weekDay: row.weekDay, isClosed: true } : row,
                  ),
                )
              }
            />
          </Section>
        </>
      )}
    </Screen>
  );
}
