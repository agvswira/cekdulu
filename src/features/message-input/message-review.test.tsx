import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MessageReview } from "./message-review";

afterEach(() => {
  cleanup();
});

describe("MessageReview", () => {
  it("keeps text editable and updates the redaction preview with token counts", async () => {
    const user = userEvent.setup();

    render(
      <MessageReview
        initialText="Hubungi 0812-3456-7890 sekarang juga"
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Pratinjau teks tersamarkan")).toHaveTextContent(
      "Hubungi [PHONE_1] sekarang juga",
    );
    expect(screen.getByText("Nomor telepon: 1")).toBeInTheDocument();

    const editor = screen.getByLabelText("Teks pesan untuk diperiksa");
    await user.clear(editor);
    await user.type(editor, "Email dana@contoh.id untuk verifikasi sekarang");

    expect(screen.getByLabelText("Pratinjau teks tersamarkan")).toHaveTextContent(
      "Email [EMAIL_1] untuk verifikasi sekarang",
    );
    expect(screen.getByText("Alamat email: 1")).toBeInTheDocument();
    expect(screen.queryByText("Nomor telepon: 1")).not.toBeInTheDocument();
  });

  it("blocks short text and emits only confirmed redacted text", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<MessageReview initialText="Pendek" onConfirm={onConfirm} />);

    const editor = screen.getByLabelText("Teks pesan untuk diperiksa");
    const confirm = screen.getByRole("button", { name: "Konfirmasi dan periksa" });
    expect(confirm).toBeDisabled();
    await user.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();

    await user.clear(editor);
    await user.type(editor, "Hubungi 0812-3456-7890 sekarang juga");
    expect(confirm).toBeEnabled();
    await user.click(confirm);

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledWith("Hubungi [PHONE_1] sekarang juga");
    const submittedValue = onConfirm.mock.calls[0]?.[0];
    expect(typeof submittedValue).toBe("string");
    expect(submittedValue).not.toContain("0812-3456-7890");
  });
});
