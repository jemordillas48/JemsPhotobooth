const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const app = express();

// ==========================================
// PORT
// ==========================================

const PORT = process.env.PORT || 3000;

// ==========================================
// FOLDER PATHS
// ==========================================

const frontendPath = path.join(__dirname, "../frontend");

const uploadsPath = path.join(
    __dirname,
    "uploads"
);

const databasePath = path.join(
    __dirname,
    "database",
    "photobooth.db"
);

// ==========================================
// CREATE REQUIRED FOLDERS
// ==========================================

if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, {
        recursive: true
    });
}

const databaseFolder = path.dirname(databasePath);

if (!fs.existsSync(databaseFolder)) {
    fs.mkdirSync(databaseFolder, {
        recursive: true
    });
}

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
    express.json({
        limit: "20mb"
    })
);

// Serve frontend
app.use(
    express.static(frontendPath)
);

// Serve uploaded photos
app.use(
    "/uploads",
    express.static(uploadsPath)
);

// ==========================================
// DATABASE CONNECTION
// ==========================================

let db;

try {
    db = new Database(databasePath);

    console.log("Connected to SQLite database.");
} catch (error) {
    console.error(
        "Database connection failed:",
        error.message
    );

    process.exit(1);
}

// ==========================================
// CREATE PHOTOS TABLE
// ==========================================

try {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            original_name TEXT,
            filepath TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    console.log("Photos table is ready.");
} catch (error) {
    console.error(
        "Failed to create photos table:",
        error.message
    );
}

// ==========================================
// HOME PAGE
// ==========================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            frontendPath,
            "index.html"
        )
    );
});

// ==========================================
// TEST API
// ==========================================

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message:
            "Frontend successfully connected to backend!"
    });
});

// ==========================================
// SAVE PHOTO
// ==========================================

app.post("/api/photos", (req, res) => {
    try {
        const {
            image,
            style,
            createdAt
        } = req.body;

        // Check if image exists
        if (!image) {
            return res.status(400).json({
                success: false,
                message:
                    "No image was received."
            });
        }

        // Check image format
        const imageMatch = image.match(
            /^data:image\/(png|jpeg|jpg);base64,(.+)$/
        );

        if (!imageMatch) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid image format. Only PNG and JPEG are allowed."
            });
        }

        const imageType = imageMatch[1];
        const imageData = imageMatch[2];

        // Create unique filename
        const timestamp = Date.now();

        const extension =
            imageType === "png"
                ? "png"
                : "jpg";

        const filename =
            `photo_${timestamp}.${extension}`;

        const filepath =
            path.join(
                uploadsPath,
                filename
            );

        // Convert Base64 to image
        const buffer =
            Buffer.from(
                imageData,
                "base64"
            );

        // Save image
        fs.writeFileSync(
            filepath,
            buffer
        );

        // Save information in database
        const insertPhoto = db.prepare(`
            INSERT INTO photos
            (filename, original_name, filepath, created_at)
            VALUES (?, ?, ?, ?)
        `);

        const result = insertPhoto.run(
            filename,
            filename,
            `/uploads/${filename}`,
            createdAt || new Date().toISOString()
        );

        res.json({
            success: true,
            message:
                "Photo saved successfully!",
            photo: {
                id: result.lastInsertRowid,
                filename: filename,
                filepath:
                    `/uploads/${filename}`
            }
        });

    } catch (error) {
        console.error(
            "Photo upload error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "An error occurred while saving the photo."
        });
    }
});

// ==========================================
// GET ALL PHOTOS
// ==========================================

app.get("/api/photos", (req, res) => {
    try {
        const photos = db.prepare(`
            SELECT *
            FROM photos
            ORDER BY created_at DESC
        `).all();

        res.json({
            success: true,
            photos: photos
        });

    } catch (error) {
        console.error(
            "Database error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to retrieve photos."
        });
    }
});

// ==========================================
// GET ONE PHOTO
// ==========================================

app.get("/api/photos/:id", (req, res) => {
    try {
        const id = req.params.id;

        const photo = db.prepare(`
            SELECT *
            FROM photos
            WHERE id = ?
        `).get(id);

        if (!photo) {
            return res.status(404).json({
                success: false,
                message:
                    "Photo not found."
            });
        }

        res.json({
            success: true,
            photo: photo
        });

    } catch (error) {
        console.error(
            "Database error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Database error."
        });
    }
});

// ==========================================
// DELETE PHOTO
// ==========================================

app.delete("/api/photos/:id", (req, res) => {
    try {
        const id = req.params.id;

        // Find photo first
        const photo = db.prepare(`
            SELECT *
            FROM photos
            WHERE id = ?
        `).get(id);

        if (!photo) {
            return res.status(404).json({
                success: false,
                message:
                    "Photo not found."
            });
        }

        // Get safe filename
        const filename =
            path.basename(
                photo.filename
            );

        const filepath =
            path.join(
                uploadsPath,
                filename
            );

        // Delete physical file
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        // Delete database record
        db.prepare(`
            DELETE FROM photos
            WHERE id = ?
        `).run(id);

        res.json({
            success: true,
            message:
                "Photo deleted successfully."
        });

    } catch (error) {
        console.error(
            "Delete photo error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to delete photo."
        });
    }
});

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message:
            "Route not found."
    });
});

// ==========================================
// START SERVER
// ==========================================

const server = app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log(
            "=================================="
        );
        console.log(
            "       PHOTOBOOTH SERVER"
        );
        console.log(
            "=================================="
        );
        console.log(
            `Server running on port ${PORT}`
        );
        console.log(
            `Frontend: ${frontendPath}`
        );
        console.log(
            `Photos: ${uploadsPath}`
        );
        console.log(
            `Database: ${databasePath}`
        );
        console.log(
            "=================================="
        );
        console.log("");
        console.log(
            "Server is running."
        );
    }
);

// ==========================================
// SERVER ERROR
// ==========================================

server.on(
    "error",
    (error) => {
        console.error(
            "SERVER ERROR:",
            error
        );
    }
);