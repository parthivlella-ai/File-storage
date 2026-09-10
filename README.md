# SECURE FILE HUB 🛡️☁️
### Next-Gen Cloud Storage, File Management & Sharing Platform (MERN Stack)

**Secure File Hub** is a full-featured, production-quality cloud storage and file management web application inspired by Google Drive, built from the ground up using the modern **MERN (MongoDB, Express, React, Node.js)** architecture.

---

## 🌟 Key Features

### 👤 User Authentication & Security
- **JWT (JSON Web Token) Authentication**: Stateless, encrypted tokens stored securely with request interceptors.
- **Bcrypt Password Hashing**: Passwords are salted and hashed (pre-save hook) before reaching the database.
- **Role-Based Access Control (RBAC)**: Distinct permissions for standard users and system administrators.
- **Per-User Isolated File System**: Physical disk storage is strictly compartmentalized per user ID.
- **Safe Sanitized Filenames**: Automatic elimination of path traversal (`../`) and illegal character injection.
- **Rate Limiting & Helmet Headers**: API brute-force protection and Cross-Origin Resource Policy (CORP).

### 📁 File Management & Explorer
- **Drag & Drop Upload Zone**: Multi-file drag and drop with real-time percentage progress bars.
- **File Validation**: Strict client and server-side checks on file size (up to 50MB) and blocking of dangerous executables (`.exe`, `.bat`, `.sh`, `.msi`, `.vbs`, etc.).
- **Categorization Engine**: Automatic categorization of uploaded files into **Documents**, **Images**, **Videos**, **Audio**, **PDFs**, and **Other**.
- **Interactive Multi-Level Folders**: Create nested folder hierarchies with custom colors and breadcrumb trail navigation (`My Files > Projects > 2026`).
- **File Operations**: Instant rename, move between folders, toggle star/favorites, view detailed metadata drawer, download, and soft delete.
- **Multi-Select & Batch Actions**: Select multiple files for batch starring or moving to trash.
- **Live Search & Filtering**: Real-time debounce search across files and directories with category filters.
- **Grid & List Views**: Seamlessly switch between rich visual card grids and detailed data table rows with sort options (Date, Name, Size).

### 👁️ Rich Media Preview & Streaming
- **Image Lightbox**: Zoom in/out, 90° rotation, and full-screen view.
- **Video & Audio Streaming**: Byte-range request support (`HTTP 206 Partial Content`) for instant seeking.
- **PDF Viewer**: Embedded native PDF reader.
- **Code & Text Preview**: Inline monospace syntax preview for `.txt`, `.md`, `.json`, `.js`, `.py`, `.html`, `.css`, etc.
- **Tokenized Share Links**: Generate secure public links for direct preview and download without exposing login sessions.

### 🗑️ Trash Bin & Storage Quota
- **Soft Delete & Restore**: Trashed items remain safely isolated in the Trash Bin until explicitly restored or purged.
- **Permanent Purge & Empty Trash**: Deletes records from MongoDB and unlinks physical disk files to free up quota.
- **Live Storage Breakdown**: Visual multi-color gauge displaying exact disk usage per category.

### 👑 Administrator Control Center
- **System-Wide Telemetry**: Total registered users, total files, and physical disk consumption.
- **User Governance**: Search users, toggle account suspension (block/unblock), and adjust storage quotas.
- **Safe Metadata Inspector**: Monitor file metadata (sizes, types, owners) without exposing private file contents.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Axios, Tailwind CSS, Lucide React, React Dropzone |
| **Backend** | Node.js, Express.js, Multer, Helmet, Morgan, Express Rate Limit |
| **Database** | MongoDB, Mongoose ODM (Indexes, Schemas, Aggregation Pipelines) |
| **Storage Engine** | Modular Local Disk Storage with User Isolation (Easily extensible to AWS S3 / Cloudinary) |
| **Authentication** | JWT (JSON Web Tokens) & Bcrypt.js |

---

## 📂 Project Structure

```
secure-file-hub/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection handler
│   │   └── storage.js            # Storage disk abstraction engine
│   ├── controllers/
│   │   ├── authController.js     # Register, login, profile, password
│   │   ├── fileController.js     # Upload, list, preview, stream, download, move
│   │   ├── folderController.js   # Folder creation, hierarchy, breadcrumbs
│   │   ├── trashController.js    # Soft delete, restore, permanent purge
│   │   ├── statsController.js    # Aggregations for storage breakdown
│   │   └── adminController.js    # User management & telemetry
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT bearer & token validation
│   │   ├── adminMiddleware.js    # Admin role guard
│   │   ├── uploadMiddleware.js   # Multer file size & security filter
│   │   └── errorMiddleware.js    # Centralized JSON error handler
│   ├── models/
│   │   ├── User.js               # User schema & password hashing
│   │   ├── File.js               # File metadata schema & indexes
│   │   ├── Folder.js             # Folder schema & hierarchy index
│   │   └── ActivityLog.js        # Audit trail schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── fileRoutes.js
│   │   ├── folderRoutes.js
│   │   ├── trashRoutes.js
│   │   ├── statsRoutes.js
│   │   └── adminRoutes.js
│   ├── utils/
│   │   ├── fileHelpers.js        # Sanitizer & category detector
│   │   └── seedData.js           # Database & sample files seeder
│   ├── uploads/                  # Isolated user file storage
│   ├── .env                      # Environment configuration
│   ├── package.json
│   └── server.js                 # Express application entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Modal, ConfirmModal, Toast, EmptyState
│   │   │   ├── layout/           # Sidebar, Navbar, MainLayout, ProtectedRoute
│   │   │   ├── files/            # FileCard, FileRow, FileIcon, PreviewModal, DetailsDrawer
│   │   │   ├── folders/          # FolderCard, CreateFolderModal, Breadcrumbs
│   │   │   ├── upload/           # UploadDropzone, UploadProgressModal
│   │   │   └── dashboard/        # StorageBar, CategoryCards, QuickStats, RecentActivity
│   │   ├── context/              # AuthContext, FileContext, ThemeContext, ToastContext
│   │   ├── pages/                # Login, Register, Dashboard, MyFiles, Recent, Folders, Starred, Trash, Settings, Admin
│   │   ├── services/             # Axios API services
│   │   ├── utils/                # Formatters, file types
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── package.json                  # Root runner script
└── README.md
```

---

## ⚡ Installation & Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance running at `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)

### 2. Clone & Setup Backend
```bash
cd backend
npm install
```

Configure `backend/.env` (pre-configured template):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/secure_file_hub
JWT_SECRET=super_secret_jwt_key_secure_file_hub_2026_x89f
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=uploads
CLIENT_URL=http://localhost:5173
```

### 3. Seed Database with Demo Accounts & Sample Files
```bash
npm run seed
```
*This populates sample files across all categories (PDFs, Excel, Word, Images, Audio, Video) with real disk files for instant testing.*

### 4. Setup Frontend
```bash
cd ../frontend
npm install
```

### 5. Running the Application
Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Demo User** | `user@securehub.com` | `User@123` | Full cloud storage workspace, uploads, folders, share links, trash |
| **Admin** | `admin@securehub.com` | `Admin@123` | Full workspace + Admin Control Center, user management, quotas |

*(One-click demo login buttons are built directly into the login page for convenience)*

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new account | Public |
| `POST` | `/api/auth/login` | Login & receive JWT | Public |
| `GET` | `/api/auth/me` | Fetch active user profile & storage quota | Private |
| `PUT` | `/api/auth/profile` | Update display name & avatar | Private |
| `PUT` | `/api/auth/change-password` | Update account password | Private |

### Files (`/api/files`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/files/upload` | Upload multiple files (multipart/form-data) | Private |
| `GET` | `/api/files` | Get files (filters: `folderId`, `category`, `search`, `sortBy`) | Private |
| `GET` | `/api/files/search` | Search files & folders by keyword | Private |
| `GET` | `/api/files/:id` | Get single file metadata | Private |
| `GET` | `/api/files/:id/preview` | Stream file inline (Range video/audio, PDF, image) | Private / Share Token |
| `GET` | `/api/files/:id/download` | Download file stream with safe header | Private / Share Token |
| `PUT` | `/api/files/:id` | Rename, move folder, star, or update public status | Private |
| `DELETE` | `/api/files/:id` | Move file to Trash (soft delete) | Private |
| `POST` | `/api/files/batch` | Batch move, star, or trash multiple files | Private |

### Folders (`/api/folders`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/folders` | Create a new folder with custom color | Private |
| `GET` | `/api/folders` | List folders in directory with file counts | Private |
| `GET` | `/api/folders/:id/breadcrumbs` | Get nested breadcrumb hierarchy trail | Private |
| `PUT` | `/api/folders/:id` | Rename or move folder | Private |
| `DELETE` | `/api/folders/:id` | Move folder and contents to Trash | Private |

### Trash (`/api/trash`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/trash` | List all trashed files and folders | Private |
| `PUT` | `/api/trash/files/:id/restore` | Restore file from trash | Private |
| `PUT` | `/api/trash/folders/:id/restore` | Restore folder from trash | Private |
| `DELETE` | `/api/trash/files/:id` | Permanently delete file & wipe disk | Private |
| `DELETE` | `/api/trash/folders/:id` | Permanently delete folder & all contents | Private |
| `DELETE` | `/api/trash/empty` | Empty entire user trash bin | Private |

### Stats & Admin (`/api/stats` & `/api/admin`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/stats/dashboard` | Aggregated storage breakdown & recent activity | Private |
| `GET` | `/api/admin/stats` | System-wide storage & user telemetry | Admin Only |
| `GET` | `/api/admin/users` | List users with search, storage and status | Admin Only |
| `PUT` | `/api/admin/users/:id/toggle-block` | Suspend or activate user account | Admin Only |
| `PUT` | `/api/admin/users/:id/quota` | Update user storage quota (in GB) | Admin Only |
| `GET` | `/api/admin/files` | Safe file metadata audit | Admin Only |

---

## 🔒 Security Architecture

1. **Path Traversal Shield**: Stored filenames use randomized cryptographic hashes with user-isolated subdirectories (`uploads/{userId}/{hash}.{ext}`), neutralizing `../../` injection attacks.
2. **File MIME & Extension Validation**: Dangerous executable files are filtered out on both client and server.
3. **Database Ownership Verification**: Every file and folder request verifies ownership against `req.user._id` before executing updates or streaming data.
4. **Range Streaming**: Media endpoints handle `HTTP 206 Partial Content` requests safely without loading full multi-gigabyte streams into server memory.
5. **No Broken UI Guarantees**: Centralized Express middleware intercepts errors and returns structured JSON responses, preventing frontend crashes or raw stack leaks.

---

## 🚀 Future Roadmap & Enhancements
- [ ] End-to-End Client-Side AES-256 File Encryption before upload
- [ ] Direct S3 / Cloudflare R2 cloud bucket adapter toggle
- [ ] Real-time collaborative document editing
- [ ] Native Mobile App (React Native)
