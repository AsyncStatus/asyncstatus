"use client";

import { useRouter } from "next/navigation";

import { fancyPeopleNames, peopleSummary } from "./people-summary";

export function PersonSelect(props: { value: string; defaultValue: string }) {
  const router = useRouter();

  return (
    <select
      className="inline-block text-lg max-sm:text-lg"
      value={props.value}
      onChange={(e) => {
        const params = new URLSearchParams();
        if (e.target.value !== props.defaultValue) {
          params.set("person", e.target.value);
          router.replace(`/?${params.toString()}`, { scroll: false });
        } else {
          router.replace("/", { scroll: false });
        }
      }}
    >
      {Object.keys(peopleSummary).map((person) => (
        <option key={person} value={person}>
          {fancyPeopleNames[person]}
        </option>
      ))}
    </select>
  );
}
