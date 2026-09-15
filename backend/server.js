const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();

// ==========================================
// PORT
// ==========================================

// Render provides its own PORT.
// When running locally, it will use 3000.
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

const databaseFolder = path.dirname(
    databasePath
);

if (!fs.existsSync(databaseFolder)) {
    fs.mkdirSync(databaseFolder, {
        recursive: true
    });
}


// ==========================================
// MIDDLEWARE
// ==========================================

// Allow large Base64 image data
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

const db = new sqlite3.Database(
    databasePath,
    (error) => {

        if (error) {

            console.error(
                "Database connection failed:",
                error.message
            );

        } else {

            console.log(
                "Connected to SQLite database."
            );

        }

    }
);


// ==========================================
// CREATE PHOTOS TABLE
// ==========================================

db.run(
    `
    CREATE TABLE IF NOT EXISTS photos (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        filename TEXT NOT NULL,

        original_name TEXT,

        filepath TEXT NOT NULL,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP

    )
    `,
    (error) => {

        if (error) {

            console.error(
                "Failed to create photos table:",
                error.message
            );

        } else {

            console.log(
                "Photos table is ready."
            );

        }

    }
);


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
        db.run(
            `
            INSERT INTO photos
            (filename, original_name, filepath, created_at)

            VALUES (?, ?, ?, ?)
            `,
            [
                filename,
                filename,
                `/uploads/${filename}`,
                createdAt || new Date().toISOString()
            ],
            function (error) {

                if (error) {

                    console.error(
                        "Database error:",
                        error.message
                    );


                    // Delete image if database failed
                    if (fs.existsSync(filepath)) {

                        fs.unlinkSync(filepath);

                    }


                    return res.status(500).json({

                        success: false,

                        message:
                            "Photo was not saved to database."

                    });

                }


                res.json({

                    success: true,

                    message:
                        "Photo saved successfully!",

                    photo: {

                        id: this.lastID,

                        filename: filename,

                        filepath:
                            `/uploads/${filename}`

                    }

                });

            }
        );

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

    db.all(
        `
        SELECT *

        FROM photos

        ORDER BY created_at DESC
        `,
        [],
        (error, rows) => {

            if (error) {

                console.error(
                    "Database error:",
                    error.message
                );


                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to retrieve photos."

                });

            }


            res.json({

                success: true,

                photos: rows

            });

        }
    );

});


// ==========================================
// GET ONE PHOTO
// ==========================================

app.get("/api/photos/:id", (req, res) => {

    const id = req.params.id;


    db.get(
        `
        SELECT *

        FROM photos

        WHERE id = ?
        `,
        [id],
        (error, row) => {

            if (error) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Database error."

                });

            }


            if (!row) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Photo not found."

                });

            }


            res.json({

                success: true,

                photo: row

            });

        }
    );

});


// ==========================================
// DELETE PHOTO
// ==========================================

app.delete("/api/photos/:id", (req, res) => {

    const id = req.params.id;


    // Find photo first
    db.get(
        `
        SELECT *

        FROM photos

        WHERE id = ?
        `,
        [id],
        (error, photo) => {

            if (error) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Database error."

                });

            }


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
            db.run(
                `
                DELETE FROM photos

                WHERE id = ?
                `,
                [id],
                (deleteError) => {

                    if (deleteError) {

                        return res.status(500).json({

                            success: false,

                            message:
                                "Unable to delete photo."

                        });

                    }


                    res.json({

                        success: true,

                        message:
                            "Photo deleted successfully."

                    });

                }
            );

        }
    );

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