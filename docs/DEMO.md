# Demo CekDulu — 2 menit 40 detik

Choreography ini memakai screenshot sintetis, bukan pesan pengguna atau private holdout. Public deployment dan fresh-browser rehearsal masih **pending** sampai URL dan credential tersedia.

## Persiapan

- Gunakan browser incognito/fresh profile pada commit yang sama dengan backup video.
- Siapkan PNG/JPEG sintetis maksimal 5 MiB dengan isi pesan kurir CekDulu; jangan memakai nomor, URL, nama, atau rekening nyata.
- Rehearse file sampai OCR menghasilkan satu salah baca yang konsisten dan aman untuk dikoreksi. Jangan menyebut typo manual sebagai OCR error.
- Siapkan built-in sample sebagai recovery bila file demo bermasalah.
- Pastikan API key hanya berada pada server/deployment dashboard.
- Jangan memakai development evaluation case sebagai pengganti private holdout claim, dan jangan membuka private holdout saat demo.

## Main choreography

| Waktu | Aksi layar | Narasi inti | Bukti yang ditunjukkan |
|---|---|---|---|
| 0:00–0:20 | Tampilkan halaman utama. | “Ibu Rina menerima pesan mendesak dan diminta bertindak sebelum sempat bertanya kepada keluarga. CekDulu membantu berhenti sejenak, melihat sinyal, dan menentukan apa yang harus diverifikasi.” | Headline, privacy cue, dan intake. |
| 0:20–0:45 | Pilih **Unggah gambar**, upload screenshot sintetis, tunggu local OCR progress. | “Screenshot dibaca di browser. File ini tidak dikirim ke endpoint analisis.” | Status OCR dan teks bahwa gambar tidak dikirim ke server. |
| 0:45–1:05 | Pada **Tinjau dan samarkan**, koreksi satu salah baca OCR yang sudah direhearse; tunjukkan token redaksi lalu konfirmasi. | “Pengguna tetap mengendalikan teks. Phone, account, email, dan URL ditokenisasi; hanya versi yang sudah diperiksa dan dikonfirmasi yang diteruskan.” | Editor, redaction counts, dan redacted preview. |
| 1:05–1:35 | Klik **Konfirmasi dan periksa**, tunggu analyzing state, lalu tunjukkan risk heading. | “Risk level adalah bantuan membaca sinyal, bukan vonis pasti aman atau penipuan.” | Live status, focus ke heading baru, dan risk summary. |
| 1:35–2:05 | Sorot dua evidence quotes dan explanations. | “CekDulu mengutip bagian pesan yang benar-benar ada dan menjelaskan mengapa tekanan waktu atau tautan belum terverifikasi perlu diwaspadai.” | Dua evidence cards; bila response hanya memiliki satu signal, gunakan built-in sample/response yang sudah direhearse dan jangan mengarang signal kedua. |
| 2:05–2:25 | Tunjukkan prioritized actions dan buka official IASC guidance pada tab baru. | “Langkah berikutnya adalah menahan tindakan, mencari kanal resmi secara terpisah, dan memakai panduan resmi bila perlu.” | Action cards dan link `iasc.ojk.go.id`. |
| 2:25–2:40 | Tunjukkan limitations lalu **Periksa pesan lain**. | “CekDulu tidak memastikan identitas pengirim dan tidak dapat menyatakan pesan pasti aman atau pasti penipuan. Screenshot tetap pada alur browser; hanya confirmed redacted text yang dikirim. Tidak ada database atau history.” | Limitations dan reset ke intake. |

Target selesai: `2:40`, menyisakan 20 detik dari slot tiga menit untuk transisi atau recovery.

## Timeout rehearsal terpisah

Jangan merusak credential production untuk membuat failure. Pada local/rehearsal environment, muat aplikasi lalu tempel interception berikut di browser DevTools Console. Interception menahan hanya `/api/analyze` dan menolak promise ketika `AbortController` aplikasi membatalkannya setelah 15 detik.

```js
const cekDuluOriginalFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const url = new URL(String(input), window.location.href);

  if (url.pathname !== "/api/analyze") {
    return cekDuluOriginalFetch(input, init);
  }

  return new Promise((_, reject) => {
    const rejectAsAborted = () =>
      reject(new DOMException("Aborted", "AbortError"));

    if (init.signal?.aborted) {
      rejectAsAborted();
      return;
    }

    init.signal?.addEventListener("abort", rejectAsAborted, { once: true });
  });
};
```

1. Pilih built-in sample atau siapkan paste flow sampai sebelum konfirmasi.
2. Mulai analisis, hitung sekitar 15 detik, lalu tunggu **Analisis belum tersedia**.
3. Tunjukkan bahwa tidak ada heading `Risiko rendah`, `Risiko sedang`, atau `Risiko tinggi`.
4. Baca dua general safety steps dan tunjukkan **Coba lagi**.
5. Reload halaman untuk memulihkan `fetch` sebelum rehearsal berikutnya.

Network **Offline** hanya membuktikan immediate network-unavailable path, bukan timer 15 detik. Jangan menyebut rehearsal Offline sebagai timeout proof. Timer-specific behavior juga dibuktikan oleh fake-timer test di `src/features/check-message/check-message-flow.test.tsx`.

Narasi: “Ketika AI tidak tersedia, CekDulu tidak menebak klasifikasi. Pengguna tetap mendapat panduan aman umum dan dapat mencoba lagi.”

## Fresh-browser release checklist — pending deployment

- [ ] Built-in sample mencapai schema-valid result.
- [ ] Screenshot → OCR → correction → redaction → result selesai.
- [ ] Paste path mengirim confirmed redacted text saja.
- [ ] Timeout rehearsal tidak menampilkan risk classification.
- [ ] Mobile layout tidak overflow dan target sentuh tetap dapat digunakan.
- [ ] Official IASC link membuka domain `iasc.ojk.go.id` di tab baru.
- [ ] Reset kembali ke intake tanpa menampilkan pesan sebelumnya.
- [ ] Flow utama selesai dalam ≤60 detik pada demo network.
- [ ] Backup video memakai URL dan release commit yang sama.

Checklist ini belum boleh dicentang berdasarkan E2E interception atau build lokal saja.
