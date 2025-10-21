
import React, { useState, useEffect } from 'react';
import type { Settings } from '../../../types';

interface ThemeSettingsFormProps {
    settings: Settings;
    onSave: (formData: Settings, setStatus: (status: string) => void) => void;
}

export const GeneralSettingsForm: React.FC<GeneralSettingsFormProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState(settings);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, setStatus);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nama Aplikasi</label>
        <input
          type="text"
          name="appName"
          value={formData.appName}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Versi</label>
        <input
          type="text"
          name="version"
          value={formData.version}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
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

