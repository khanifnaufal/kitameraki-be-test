# Kitameraki Task App Backend (`kitameraki-be-test`)

Repositori ini berisi backend berbasis **Azure Functions** dan **TypeScript** dengan database **Azure Cosmos DB** yang telah disempurnakan untuk aplikasi Task Management. 

---

## 🚀 Cara Menjalankan Backend

### 1. Prasyarat (Prerequisites)
Sebelum menjalankan backend, pastikan Anda telah menginstal tools berikut di mesin Anda:
*   [Node.js](https://nodejs.org/) (Sangat direkomendasikan versi `v18.x` atau `v20.x`).
*   [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) (Versi 4).
*   [Azure Cosmos DB Emulator](https://learn.microsoft.com/en-us/azure/cosmos-db/local-emulator) untuk lokal, atau akun Azure Cosmos DB aktif di cloud.

---

### 2. Langkah Instalasi & Konfigurasi

#### Langkah A: Masuk ke Direktori Proyek
Buka terminal dan arahkan ke direktori backend:
```bash
cd kitameraki-be-test
```

#### Langkah B: Instalasi Dependensi
Instal seluruh package node modules yang diperlukan:
```bash
npm install
```

#### Langkah C: Konfigurasi Environment Variables
Buat file bernama `.env` di root folder backend (`kitameraki-be-test/.env`) dengan variabel berikut:
```env
COSMOS_CONNECTION_STRING="AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
COSMOS_DATABASE_NAME="TaskApp"
COSMOS_CONTAINER_NAME="Tasks"
```
*(Catatan: Connection string di atas adalah default key bawaan Azure Cosmos DB Emulator lokal)*

Selain itu, pastikan konfigurasi lokal Azure Functions Anda pada file `local.settings.json` sudah sesuai:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_CONNECTION_STRING": "AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
    "COSMOS_DATABASE_NAME": "TaskApp",
    "COSMOS_CONTAINER_NAME": "Tasks",
    "NODE_TLS_REJECT_UNAUTHORIZED": "0"
  },
  "ConnectionStrings": {},
  "Host": {
    "CORS": "*"
  }
}
```

---

### 3. Menjalankan Server secara Lokal
Jalankan perintah berikut untuk mengompilasi TypeScript dan memulai runtime Azure Functions:
```bash
npm start
```
Perintah ini akan menjalankan script `"prestart"` (`npm run clean && npm run build`) untuk membersihkan build lama dan mengompilasi ulang kode ke direktori `dist/`, kemudian menjalankan local development server.

Jika sukses, terminal akan menampilkan daftar endpoint yang aktif, seperti:
*   `GetTasks` [GET]: `http://localhost:7071/api/GetTasks`
*   `GetTask` [GET]: `http://localhost:7071/api/GetTask`
*   `InsertTask` [POST]: `http://localhost:7071/api/InsertTask`
*   `UpdateTask` [PATCH]: `http://localhost:7071/api/UpdateTask`
*   `DeleteTask` [DELETE]: `http://localhost:7071/api/DeleteTask`
*   `BulkDeleteTasks` [DELETE]: `http://localhost:7071/api/BulkDeleteTasks`
*   `GetFormSettings` [GET]: `http://localhost:7071/api/GetFormSettings`
*   `SaveFormSettings` [POST]: `http://localhost:7071/api/SaveFormSettings`

---

## 📊 Perbandingan Detail Backend

Berikut adalah ringkasan perbedaan dan penyempurnaan antara backend asli (`kitameraki-be-perbandingan`) dan backend yang sudah selesai disempurnakan (`kitameraki-be-test`):

| Aspek Perbedaan | Backend Awal (`kitameraki-be-perbandingan`) | Backend Disempurnakan (`kitameraki-be-test`) | Penjelasan & Manfaat |
| :--- | :--- | :--- | :--- |
| **Keamanan Terhadap SQL Injection** | ❌ **Rentan**. Menggunakan string interpolation langsung: `c.organizationId = '${organizationId}'` |  **Aman**. Menggunakan **parameterized query**: `@organizationId` | Menghindari celah keamanan SQL injection saat melakukan kueri data ke Cosmos DB. |
| **Koneksi & Konfigurasi (Dry Run)** | ❌ **Hardcoded**. Instance `CosmosClient` dideklarasikan ulang dengan string koneksi mentah di setiap file function. |  **Terpusat & Dinamis**. Dikelola di `src/config/cosmosClient.ts` menggunakan environment variables (`.env`). | Mempermudah maintenance, meningkatkan keamanan kredensial, dan menghindari pembuatan instance client berlebih. |
| **Validasi Payload & Query** | ❌ **Tidak Ada**. Request body dan query parameter langsung digunakan tanpa verifikasi keberadaan nilai. |  **Ketat**. Memvalidasi keberadaan `id`, `organizationId`, validitas struktur JSON, dan mengembalikan `400 Bad Request`. | Mencegah error runtime akibat data bernilai `null` / `undefined` dan memperjelas feedback ke klien API. |
| **Penanganan Error (Crash Resilience)** | ❌ **Minim**. Tidak menggunakan blok `try-catch` sehingga jika terjadi kegagalan koneksi, proses akan langsung crash. |  **Resilien**. Menggunakan `try-catch` terstandarisasi untuk mengembalikan error `500 Internal Server Error`. | Menjamin backend tetap berjalan dan mengirimkan response error HTTP yang ramah kepada pengguna. |
| **Kekuatan Tipe Data (Typing)** | ❌ **Lemah**. Sebagian besar menggunakan tipe implisit `any` atau `object`. |  **Kuat (Strongly-Typed)**. Menggunakan model terdefinisi di folder `src/models/` (`Task` dan `FormSettings`). | Memanfaatkan fitur TypeScript secara maksimal, menghindari bug salah ketik property, dan mempermudah autocomplete IDE. |
| **Penanganan Asynchronous (Bulk Delete)** | ❌ **Buggy**. Menggunakan `forEach` yang tidak menunggu proses async selesai (`await` diabaikan), langsung return `200`. |  **Aman**. Menggunakan `Promise.all` dan `map` untuk menunggu seluruh penghapusan selesai secara konkuren. | Menjamin semua item terhapus sepenuhnya sebelum response sukses dikirim ke client. |
| **Pemisahan Dokumen (Multi-Type)** | ❌ **Campur Aduk**. Data disimpan tanpa atribut pembeda jenis dokumen. |  **Pembeda Tipe**. Menyertakan field `type: 'task'` atau `'formSettings'` dan menyaringnya pada query. | Memungkinkan penyimpanan beberapa jenis entitas dalam satu container Cosmos DB tanpa tercampur saat kueri dijalankan. |
| **Fitur Layout Dinamis (Form Settings)** | ❌ **Tidak Ada**. Form di frontend bersifat statis. |  **Ada**. Menambahkan endpoint `GetFormSettings` (dengan default layout fallback) dan `SaveFormSettings` (upsert). | Memberikan kontrol penuh bagi admin/organisasi untuk menyusun urutan, tipe, baris, dan kolom field form input tugas. |
| **Standardisasi Kode Status HTTP** | ❌ **Tidak Konsisten**. Mengembalikan `200` untuk pembuatan data baru dan tidak ada status `404` jika data tidak ditemukan. |  **Sesuai Standar REST**. Menggunakan `201 Created` untuk insert, `404 Not Found` untuk pencarian nihil, dsb. | Mengikuti best practice REST API untuk komunikasi status resource yang akurat. |

---

## 🛠️ Detail Berkas Kode yang Berubah

1.  **Konfigurasi Terpusat**:
    *   [NEW] [cosmosClient.ts](file:///d:/kuliah/Project After Lulus/kitameraki-test/kitameraki-be-test/src/config/cosmosClient.ts) — Mengatur inisiasi satu client Cosmos DB dan pemuatan variabel env secara global.
2.  **Model / Interface**:
    *   [NEW] [task.model.ts](file:///d:/kuliah/Project After Lulus/kitameraki-test/kitameraki-be-test/src/models/task.model.ts) — Definisi struktur data untuk Task (Tugas).
    *   [NEW] [formSettings.model.ts](file:///d:/kuliah/Project After Lulus/kitameraki-test/kitameraki-be-test/src/models/formSettings.model.ts) — Definisi skema dynamic layout form.
3.  **Endpoint Baru**:
    *   [NEW] [GetFormSettings.ts](file:///d:/kuliah/Project After Lulus/kitameraki-test/kitameraki-be-test/src/functions/GetFormSettings.ts) — Mengambil konfigurasi layout input berdasarkan ID Organisasi.
    *   [NEW] [SaveFormSettings.ts](file:///d:/kuliah/Project After Lulus/kitameraki-test/kitameraki-be-test/src/functions/SaveFormSettings.ts) — Menyimpan atau memperbarui konfigurasi layout.
4.  **Refaktor Endpoint Lama**:
    *   [MODIFY] [GetTasks.ts](file:///d:/kuliah/Project After Lulus/kitameraki-test/kitameraki-be-test/src/functions/GetTasks.ts) — Penambahan penanganan error, parameterized query, `.fetchAll()`, filter `type`, dan validasi parameter.
    *   [MODIFY] [GetTask.ts](file:///d:/kuliah/Project After Lulus/kitameraki-test/kitameraki-be-test/src/functions/GetTask.ts) — Validasi ID, penanganan error 404 (Not Found), dan query parameters check.
    *   [MODIFY] [InsertTask.ts](file:///d:/kuliah/Project After Lulus/kitameraki-test/kitameraki-be-test/src/functions/InsertTask.ts) — Set default `createdAt`/`updatedAt`, validasi payload, penetapan `type: 'task'`, dan status `201 Created`.
    *   [MODIFY] [UpdateTask.ts](file:///d:/kuliah/Project After Lulus/kitameraki-test/kitameraki-be-test/src/functions/UpdateTask.ts) — Mengubah metode dari `POST` menjadi `PATCH`, merubah operasi patch dari `"replace"` ke `"set"`, dan otomatis memperbarui timestamp `updatedAt`.
    *   [MODIFY] [DeleteTask.ts](file:///d:/kuliah/Project After Lulus/kitameraki-test/kitameraki-be-test/src/functions/DeleteTask.ts) — Validasi request query params, logging error terstandarisasi.
    *   [MODIFY] [BulkDeleteTasks.ts](file:///d:/kuliah/Project After Lulus/kitameraki-test/kitameraki-be-test/src/functions/BulkDeleteTasks.ts) — Menghapus bug `.forEach()` async dengan menggantinya ke `Promise.all` serta validasi array body.
