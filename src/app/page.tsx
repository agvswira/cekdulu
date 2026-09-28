import Image from "next/image";
import { BrandHeader } from "@/components/brand-header";
import { CheckMessageFlow } from "@/features/check-message/check-message-flow";

export default function Home() {
  return (
    <div className="appShell">
      <BrandHeader />
      <main id="main-content">
        <section className="hero" aria-label="Periksa pesan">
          <div className="heroIntro">
            <h1>Cek pesannya. Lindungi keputusanmu.</h1>
            <p className="heroCopy">
              Kenali tanda risiko sebelum membuka tautan, membagikan data, atau
              mentransfer uang.
            </p>
            <aside className="privacyNote" aria-label="Privasi CekDulu">
              <Image
                className="privacyNoteMark"
                src="/brand/logo-mark.svg"
                alt=""
                width={28}
                height={28}
              />
              <p>
                Gambar tetap di perangkat. Hanya teks tersamarkan yang Anda setujui
                dikirim untuk analisis.
              </p>
            </aside>
          </div>
          <CheckMessageFlow />
        </section>

        <section className="processGuide" aria-labelledby="process-heading">
          <div className="processIntro">
            <h2 id="process-heading">Cara kerja CekDulu</h2>
          </div>
          <ol className="processSteps">
            <li>
              <span aria-hidden="true">01</span>
              <h3>Masukkan pesan</h3>
              <p>Unggah tangkapan layar atau tempel teks pesan.</p>
            </li>
            <li>
              <span aria-hidden="true">02</span>
              <h3>Tinjau dan samarkan</h3>
              <p>Periksa teks dan data yang disamarkan sebelum menyetujui.</p>
            </li>
            <li>
              <span aria-hidden="true">03</span>
              <h3>Pahami hasilnya</h3>
              <p>Baca tanda risiko dan langkah aman untuk memverifikasi.</p>
            </li>
          </ol>
        </section>
      </main>
      <footer className="siteFooter">
        <span>Sebelum klik atau transfer, CekDulu.</span>
        <a href="https://iasc.ojk.go.id/" target="_blank" rel="noreferrer">
          Panduan resmi IASC
        </a>
      </footer>
    </div>
  );
}
