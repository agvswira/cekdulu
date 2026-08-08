import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandHeader } from "./brand-header";

describe("BrandHeader", () => {
  it("shows the approved brand and privacy cue", () => {
    render(<BrandHeader />);
    expect(screen.getByText("CekDulu")).toBeInTheDocument();
    expect(screen.getByText("Diproses secara privat")).toBeInTheDocument();
  });
});
