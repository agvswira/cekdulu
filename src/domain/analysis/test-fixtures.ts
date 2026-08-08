export const validResult = {
  version: "1" as const,
  riskLevel: "high" as const,
  summary: "Pesan menggunakan tekanan waktu dan tautan yang belum terverifikasi.",
  signals: [{
    quote: "klik [URL_1] sekarang",
    category: "urgency" as const,
    explanation: "Tekanan waktu dapat mendorong keputusan tergesa-gesa.",
  }],
  actions: [
    { priority: 1, title: "Jangan klik", instruction: "Tutup pesan dan jangan membuka tautannya." },
    { priority: 2, title: "Verifikasi", instruction: "Cari kanal resmi secara terpisah." },
  ],
  limitations: ["CekDulu tidak dapat memastikan identitas pengirim."],
};
