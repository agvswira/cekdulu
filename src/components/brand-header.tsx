import Link from "next/link";

export function BrandHeader() {
  return (
    <header className="brandHeader">
      <Link className="brand" href="/" aria-label="CekDulu — beranda">
        <span className="brandMark" aria-hidden="true">✓</span>
        <span>CekDulu</span>
      </Link>
      <span className="privacyCue">
        <span aria-hidden="true">◇</span> Diproses secara privat
      </span>
    </header>
  );
}
