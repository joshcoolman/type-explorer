"use client";

import type { SpecimenMeta } from "@/lib/types";
import type { SpecimenControl } from "@/lib/specimen-control";
import ProgressPanel from "./ProgressPanel";
import SpecimenViewer, { DeleteButton } from "./SpecimenViewer";

interface LibraryViewProps {
  specimens: SpecimenMeta[];
  activeId: string | null;
  onJobDone: () => void;
  onDeleted: (id: string) => void;
  control: SpecimenControl;
}

export default function LibraryView({
  specimens,
  activeId,
  onJobDone,
  onDeleted,
  control,
}: LibraryViewProps) {
  const active = specimens.find((s) => s.id === activeId) ?? null;

  if (!active) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <p className="max-w-md text-center text-sm text-muted">
          Select a specimen from the library, or generate one from Browse or Brief.
        </p>
      </div>
    );
  }

  if (active.status === "running") {
    return <ProgressPanel key={active.id} meta={active} onDone={onJobDone} />;
  }

  if (active.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
        <p className="max-w-lg text-center text-sm text-bad">
          {active.title} failed: {active.error ?? "unknown error"}
        </p>
        <DeleteButton id={active.id} onDeleted={onDeleted} />
      </div>
    );
  }

  return <SpecimenViewer meta={active} onDeleted={onDeleted} control={control} />;
}
