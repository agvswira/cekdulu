import Image from "next/image";
import Link from "next/link";

export function BrandHeader() {
  return (
    <header className="brandHeader">
      <Link className="brand" href="/" aria-label="CekDulu — beranda">
        <Image
          className="brandLogo"
          src="/brand/logo.svg"
          alt=""
          width={400}
          height={99}
        />
      </Link>
      <span className="privacyCue">
        <span aria-hidden="true">◇</span> Diproses secara privat
      </span>
    </header>
  );
}
