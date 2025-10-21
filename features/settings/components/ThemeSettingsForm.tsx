import React, { useState, useEffect } from "react";
import type { Settings } from "../../../types";

interface ThemeSettingsFormProps {
  settings: Settings;
  onSave: (formData: Settings, setStatus: (status: string) => void) => void;
}

export const ThemeSettingsForm: React.FC<ThemeSettingsFormProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<Settings>(settings);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // ✅ perbaikan utama: hanya di dalam komponen
  useEffect(() => {
    if (formData?.theme) {
      document.documentElement.setAttribute("data-theme", formData.theme);
    }
  }, [formData.theme]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value as Settings["theme"] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, setStatus);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Tema</label>
        <select
          name="theme"
          value={formData.theme}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="blue">Blue</option>
        </select>
      </div>

      <button
        type="submit"
        className="bg-accent-color text-white px-4 py-2 rounded-lg hover:bg-accent-color-hover"
      >
        Simpan
      </button>

      {status && <p className="text-sm text-secondary">{status}</p>}
    </form>
  );
};
