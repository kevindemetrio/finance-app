"use client";

import { useState } from "react";
import { Entry, todayStr, uid } from "../lib/data";
import { PrimaryButton, TextInput } from "./ui";

interface Props {
  placeholder?: string;
  onAdd: (entry: Entry) => void;
}

export function AddEntryForm({ placeholder = "Descripción", onAdd }: Props) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());

  function handleAdd() {
    const a = parseFloat(amount);
    if (!name.trim() || isNaN(a) || a <= 0) return;
    onAdd({ id: uid(), name: name.trim(), amount: a, date });
    setName("");
    setAmount("");
    setDate(todayStr());
  }

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
      <TextInput
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-[120px]"
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
      />
      <TextInput
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Importe €"
        min="0"
        step="0.01"
        className="w-28"
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
      />
      <TextInput
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-36"
      />
      <PrimaryButton onClick={handleAdd}>Añadir</PrimaryButton>
    </div>
  );
}
