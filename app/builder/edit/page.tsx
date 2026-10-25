import type { Metadata } from "next";
import { EditorLoader } from "@/components/builder/Loaders";
export const metadata: Metadata = { title: "Editor", robots: { index: false } };
export default function EditPage() { return <EditorLoader />; }
