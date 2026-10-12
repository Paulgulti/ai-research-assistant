'use client'
import { useState } from "react";

type UploadResult = {
  filename: string;
  text: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) {
      setError("Please select a PDF first.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process PDF.");
      }
      setResult(data)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong while uploading."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">
        AI Research Assistant
      </h1>

      <p className="mt-2 text-gray-600">
        Upload a PDF and extract its text.
      </p>
      <section className="mt-8 rounded-xl border p-6">
        <label
          htmlFor="pdf"
          className="mb-2 block font-medium"
        >
          Choose a PDF document
        </label>

        <input
          id="pdf"
          type="file"
          accept=".pdf,application/pdf"
          className="block w-full text-sm"
           disabled={loading}
           onChange={(event) => {
            setFile(event.target.files?.[0] ?? null)
            setResult(null)
            setError("")
           }}
        />
        {file && (
          <p className="mt-3 text-sm text-gray-600">
            Selected: {file.name} (
            {(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || loading}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing PDF..." : "Upload & Extract Text"}
        </button>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
      </section>
      {result && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            Extracted Text
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Successfully processed: {result.filename}
          </p>

          <pre className="mt-4 max-h-[500px] overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-gray-50 p-4 text-sm text-gray-800">
            {result.text}
          </pre>

          <p className="mt-3 text-sm text-gray-500">
            Extracted {result.text.length.toLocaleString()} characters.
          </p>
        </section>
      )}
    </div>
  );
}
