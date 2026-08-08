# Privacy boundary CekDulu

Dokumen ini mencatat behavior yang ada dan sudah dapat diuji. Ini bukan janji keamanan di luar implementasi.

## Data flow yang diimplementasikan

| Tahap | Data | Lokasi | Melewati network aplikasi? |
|---|---|---|---|
| Upload | PNG/JPEG maksimal 5 MiB | File input browser | Tidak dikirim oleh CekDulu. |
| OCR | Screenshot dan hasil OCR mentah | Tesseract worker/browser | Screenshot tidak masuk request `/api/analyze`. |
| Review | Editable raw text | React component memory | Belum dikirim. |
| Redaction | Preview dengan `[PHONE_n]`, `[ACCOUNT_n]`, `[EMAIL_n]`, dan `[URL_n]` | Browser | Belum dikirim. |
| Confirmation | Confirmed redacted text | Browser → same-origin `/api/analyze` | Ya, hanya field `message` yang tersamarkan. |
| Analysis | Confirmed redacted text dan structured response | Server-side Gemini adapter | Provider menerima teks tersamarkan, bukan screenshot. |
| Result | Risk heading, evidence, actions, limitations | Browser | Ditahan sementara di state UI; tidak dipersist atau disimpan sebagai history oleh aplikasi. |

Raw text berada dalam component state selama flow aktif. Reset/unmount membuang referensi state aplikasi, tetapi CekDulu tidak mengklaim secure erasure atau permanent deletion pada browser, operating system, provider, proxy, atau hosting infrastructure.

## Fakta yang sudah diuji

- `e2e/privacy-boundary.spec.ts` mencegat request same-origin dan membuktikan `[PHONE_1]` serta `[URL_1]` ada, sedangkan nilai asli tidak ada.
- `src/features/message-input/ocr.test.ts` memverifikasi adapter meneruskan file ke interface worker dan selalu menerminasi worker; penempatan di browser berasal dari arsitektur client component.
- `src/features/message-input/message-review.test.tsx` memverifikasi callback konfirmasi menerima redacted text.
- `src/features/check-message/check-message-flow.test.tsx` memverifikasi upload, paste, sample, retry, reset, timeout, dan body API redacted-only.
- `src/app/api/analyze/route.test.ts` memverifikasi request invalid, structured success, dan classification-free unavailable response.

## Penyimpanan dan logging

CekDulu tidak memiliki account, database, message history, analytics store, atau automatic report. Application code tidak mencatat request body, screenshot, atau raw message ke console/log. Hosting dan model provider dapat memiliki infrastructure metadata atau kebijakan retensi sendiri; dokumen ini tidak membuat klaim tentang sistem pihak ketiga yang belum diverifikasi.

## URL dan kanal resmi

CekDulu tidak membuka, mengambil, atau merayapi URL yang ditemukan dalam pesan. URL tersebut diganti token sebelum request. Link IASC yang dirender adalah link resmi statis yang dibuka hanya setelah tindakan eksplisit pengguna.

## Failure path

Timeout, network failure, provider outage, dan invalid schema menggunakan state unavailable yang sama: panduan aman umum, Retry, dan **tanpa** risk level. Jalur ini tidak mengklasifikasikan pesan dengan aturan lokal.

## Klaim yang tidak dibuat

CekDulu tidak mengklaim:

- end-to-end encryption;
- anonymous processing;
- permanent deletion atau secure erasure;
- bahwa provider/hosting tidak memiliki metadata;
- bahwa sebuah pesan pasti aman atau pasti penipuan;
- identitas pemilik nomor, rekening, atau URL;
- bahwa report sudah dikirim ke IASC, OJK, bank, atau penegak hukum.

Gunakan pesan sintetis untuk demo dan development. Jangan memasukkan screenshot pribadi, raw private message, secret, atau private holdout ke prompt log maupun artefak publik.
