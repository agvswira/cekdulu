import { BrandHeader } from "@/components/brand-header";

export default function Home() {
  return (
    <div className="appShell">
      <BrandHeader />
      <main className="hero" id="main-content">
        <p className="eyebrow">Asisten pemeriksa risiko pesan</p>
        <h1>Cek pesannya. Lindungi keputusanmu.</h1>
        <p className="heroCopy">
          Kenali tanda yang perlu diwaspadai sebelum membuka tautan, membagikan data,
          atau mentransfer uang.
        </p>
        <aside className="privacyNote" aria-label="Privasi CekDulu">
          <span className="privacyNoteMark" aria-hidden="true">◇</span>
          <p>
            Gambar tetap di perangkat Anda. Hanya teks yang sudah disamarkan dan Anda
            setujui yang akan dikirim untuk dianalisis.
          </p>
        </aside>
      </main>
    </div>
  );
}
