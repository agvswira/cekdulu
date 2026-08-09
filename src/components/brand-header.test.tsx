import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandHeader } from "./brand-header";

describe("BrandHeader", () => {
  it("uses the official horizontal logo for the home link", () => {
    render(<BrandHeader />);

    const homeLink = screen.getByRole("link", { name: "CekDulu — beranda" });
    const logo = homeLink.querySelector("img");

    expect(homeLink).toHaveAttribute("href", "/");
    expect(logo).toHaveAttribute("src", "/brand/logo.svg");
    expect(logo).toHaveAttribute("alt", "");
    expect(logo).toHaveAttribute("width", "400");
    expect(logo).toHaveAttribute("height", "99");
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
    expect(screen.getByText("Diproses secara privat")).toBeInTheDocument();
  });
});
