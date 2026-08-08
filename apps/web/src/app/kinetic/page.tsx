import type { Metadata } from "next";
import { KineticExperience } from "@/components/kinetic/KineticExperience";
import "./kinetic.css";

export const metadata: Metadata = {
  title: "Mote — makes motion · Tell specimen",
  description:
    "Interactive motion portfolio template: pointer-driven characters and scroll-scrubbed explode sequence.",
};

export default function KineticPage() {
  return <KineticExperience />;
}
