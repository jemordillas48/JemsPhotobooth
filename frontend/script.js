// ==========================================
// ELEMENTS
// ==========================================

const camera =
    document.getElementById("camera");

const canvas =
    document.getElementById("canvas");

const startCameraButton =
    document.getElementById("startCamera");

const startSessionButton =
    document.getElementById("startSession");

const finalizeButton =
    document.getElementById("finalizeButton");

const applyFilterButton =
    document.getElementById("applyFilterButton");

const savePhotoButton =
    document.getElementById("savePhoto");

const newSessionButton =
    document.getElementById("newSession");

const countdownElement =
    document.getElementById("countdown");

const status =
    document.getElementById("status");

const photoCounter =
    document.getElementById("photoCounter");

const progressFill =
    document.getElementById("progressFill");

const finalPreview =
    document.getElementById("finalPreview");

const finalSection =
    document.getElementById("final-section");

const filterSection =
    document.getElementById("filter-section");

const selectedFilterText =
    document.getElementById("selectedFilter");

const finalSelectedFilter =
    document.getElementById("finalSelectedFilter");


// ==========================================
// PHOTO ELEMENTS
// ==========================================

const photoImages = [
    document.getElementById("photo1"),
    document.getElementById("photo2"),
    document.getElementById("photo3")
];

const photoDots = [
    document.getElementById("dot1"),
    document.getElementById("dot2"),
    document.getElementById("dot3")
];

const filterButtons =
    document.querySelectorAll(".filter-option");


// ==========================================
// VARIABLES
// ==========================================

let cameraStream = null;

let capturedPhotos = [];

let finalPhoto = null;

let selectedFilter = "original";

let sessionRunning = false;


// ==========================================
// START CAMERA
// ==========================================

startCameraButton.addEventListener(
    "click",
    async () => {

        try {

            cameraStream =
                await navigator.mediaDevices.getUserMedia({

                    video: {

                        width: {
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        },

                        facingMode: "user"

                    },

                    audio: false

                });


            camera.srcObject =
                cameraStream;


            camera.setAttribute(
                "playsinline",
                ""
            );


            camera.setAttribute(
                "autoplay",
                ""
            );


            startCameraButton.disabled =
                true;


            startSessionButton.disabled =
                false;


            status.textContent =
                "Camera is ready! Start your 3-photo session.";

        }

        catch (error) {

            console.error(
                "Camera error:",
                error
            );


            status.textContent =
                "Unable to access camera. Please allow camera permission.";

        }

    }
);


// ==========================================
// START 3 PHOTO SESSION
// ==========================================

startSessionButton.addEventListener(
    "click",
    async () => {

        if (!cameraStream) {

            status.textContent =
                "Please start the camera first.";

            return;

        }


        if (sessionRunning) {

            return;

        }


        resetPhotos();


        finalPhoto =
            null;


        finalPreview.src =
            "";


        finalSection.classList.remove(
            "visible"
        );


        filterSection.classList.remove(
            "visible"
        );


        finalizeButton.disabled =
            true;


        applyFilterButton.disabled =
            false;


        savePhotoButton.disabled =
            false;


        sessionRunning =
            true;


        startSessionButton.disabled =
            true;


        status.textContent =
            "Get ready for Photo 1!";


        await wait(1000);


        // ==================================
        // PHOTO 1
        // ==================================

        await countdown();

        capturePhoto(0);


        await wait(1500);


        // ==================================
        // PHOTO 2
        // ==================================

        status.textContent =
            "Get ready for Photo 2!";


        await wait(1000);


        await countdown();

        capturePhoto(1);


        await wait(1500);


        // ==================================
        // PHOTO 3
        // ==================================

        status.textContent =
            "Get ready for Photo 3!";


        await wait(1000);


        await countdown();

        capturePhoto(2);


        await wait(800);


        // ==================================
        // FINISHED
        // ==================================

        sessionRunning =
            false;


        finalizeButton.disabled =
            false;


        startSessionButton.disabled =
            false;


        status.textContent =
            "🎉 All three photos captured! Click Finalize Photos.";

    }
);


// ==========================================
// COUNTDOWN
// ==========================================

function countdown() {

    return new Promise(
        (resolve) => {

            let number = 3;


            showCountdown(number);


            const timer =
                setInterval(
                    () => {

                        number--;


                        if (number > 0) {

                            showCountdown(
                                number
                            );

                        }

                        else {

                            clearInterval(
                                timer
                            );


                            showCountdownIcon();


                            setTimeout(
                                () => {

                                    countdownElement.classList.remove(
                                        "show"
                                    );


                                    resolve();

                                },
                                700
                            );

                        }

                    },
                    1000
                );

        }
    );

}


// ==========================================
// SHOW COUNTDOWN
// ==========================================

function showCountdown(number) {

    countdownElement.classList.remove(
        "show"
    );


    void countdownElement.offsetWidth;


    countdownElement.textContent =
        number;


    countdownElement.classList.add(
        "show"
    );

}


// ==========================================
// SHOW CAMERA ICON
// ==========================================

function showCountdownIcon() {

    countdownElement.classList.remove(
        "show"
    );


    void countdownElement.offsetWidth;


    countdownElement.textContent =
        "📸";


    countdownElement.classList.add(
        "show"
    );

}


// ==========================================
// CAPTURE PHOTO
// ==========================================

function capturePhoto(index) {

    if (
        camera.videoWidth === 0 ||
        camera.videoHeight === 0
    ) {

        status.textContent =
            "Camera is not ready yet.";

        return;

    }


    canvas.width =
        camera.videoWidth;


    canvas.height =
        camera.videoHeight;


    const context =
        canvas.getContext("2d");


    // ==================================
    // MIRROR SELFIE PHOTO
    // ==================================

    context.save();


    context.translate(
        canvas.width,
        0
    );


    context.scale(
        -1,
        1
    );


    context.drawImage(

        camera,

        0,
        0,

        canvas.width,
        canvas.height

    );


    context.restore();


    // ==================================
    // CONVERT PHOTO
    // ==================================

    const photo =
        canvas.toDataURL(
            "image/jpeg",
            0.92
        );


    capturedPhotos[index] =
        photo;


    photoImages[index].src =
        photo;


    photoImages[index].classList.add(
        "captured"
    );


    photoDots[index].classList.add(
        "active"
    );


    const count =
        index + 1;


    photoCounter.textContent =
        `${count} / 3`;


    progressFill.style.width =
        `${(count / 3) * 100}%`;


    status.textContent =
        `Photo ${count} captured!`;

}


// ==========================================
// FINALIZE PHOTOS
// ==========================================

finalizeButton.addEventListener(
    "click",
    () => {

        if (
            capturedPhotos.length !== 3
        ) {

            status.textContent =
                "Please capture all three photos first.";

            return;

        }


        generateFilterPreviews();


        filterSection.classList.add(
            "visible"
        );


        filterSection.scrollIntoView({

            behavior: "smooth",

            block: "center"

        });


        status.textContent =
            "Choose your favorite filter from the previews.";

    }
);


// ==========================================
// GENERATE FILTER PREVIEWS
// ==========================================

function generateFilterPreviews() {

    const filters = [

        "original",
        "vintage",
        "bw",
        "sepia",
        "warm",
        "cool",
        "bright",
        "contrast",
        "fade",
        "dramatic",
        "rose",
        "golden"

    ];


    filters.forEach(
        (filter) => {

            for (
                let i = 1;
                i <= 3;
                i++
            ) {

                const preview =
                    document.getElementById(
                        `preview-${filter}-${i}`
                    );


                if (preview) {

                    preview.src =
                        capturedPhotos[i - 1];


                    preview.style.filter =
                        getCanvasFilter(
                            filter
                        );

                }

            }

        }
    );

}


// ==========================================
// FILTER SELECTION
// ==========================================

filterButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach(
                    (item) => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                selectedFilter =
                    button.dataset.filter;


                const filterName =
                    getFilterName(
                        selectedFilter
                    );


                selectedFilterText.textContent =
                    filterName;


                finalSelectedFilter.textContent =
                    filterName;


                status.textContent =
                    `${filterName} filter selected.`;

            }
        );

    }
);


// ==========================================
// FILTER NAME
// ==========================================

function getFilterName(filter) {

    const names = {

        original: "Original",

        vintage: "Vintage",

        bw: "Black & White",

        sepia: "Sepia",

        warm: "Warm",

        cool: "Cool",

        bright: "Bright",

        contrast: "Contrast",

        fade: "Fade",

        dramatic: "Dramatic",

        rose: "Rose",

        golden: "Golden"

    };


    return names[filter] ||
        "Original";

}


// ==========================================
// APPLY FILTER
// ==========================================

applyFilterButton.addEventListener(
    "click",
    async () => {

        if (
            capturedPhotos.length !== 3
        ) {

            status.textContent =
                "Please capture three photos first.";

            return;

        }


        applyFilterButton.disabled =
            true;


        status.textContent =
            "✨ Creating your photobooth template...";


        await wait(500);


        finalPhoto =
            await createFilteredPhotoStrip();


        finalPreview.src =
            finalPhoto;


        finalSection.classList.add(
            "visible"
        );


        finalSelectedFilter.textContent =
            getFilterName(
                selectedFilter
            );


        setTimeout(
            () => {

                finalSection.scrollIntoView({

                    behavior: "smooth",

                    block: "center"

                });

            },
            300
        );


        status.textContent =
            "✨ Your filtered photobooth is ready!";

    }
);


// ==========================================
// CREATE FINAL PHOTO STRIP
// ==========================================

function createFilteredPhotoStrip() {

    return new Promise(
        (resolve) => {

            const stripCanvas =
                document.createElement(
                    "canvas"
                );


            const width =
                700;


            const photoWidth =
                620;


            const photoHeight =
                465;


            const sidePadding =
                40;


            const topPadding =
                55;


            const gap =
                25;


            const bottomSpace =
                125;


            const totalHeight =

                topPadding +

                (photoHeight * 3) +

                (gap * 2) +

                bottomSpace;


            stripCanvas.width =
                width;


            stripCanvas.height =
                totalHeight;


            const context =
                stripCanvas.getContext(
                    "2d"
                );


            // ==================================
            // BACKGROUND
            // ==================================

            context.fillStyle =
                "#f8f1e7";


            context.fillRect(

                0,
                0,
                width,
                totalHeight

            );


            // ==================================
            // TITLE
            // ==================================

            context.fillStyle =
                "#4b382c";


            context.textAlign =
                "center";


            context.font =
                "bold 28px Georgia";


            context.fillText(

                "JEM'S PHOTOBOOTH",

                width / 2,

                34

            );


            const images = [];

            let loaded = 0;


            capturedPhotos.forEach(
                (photo, index) => {

                    const image =
                        new Image();


                    image.onload =
                        () => {

                            loaded++;


                            if (
                                loaded === 3
                            ) {

                                drawFinalTemplate();

                            }

                        };


                    image.onerror =
                        () => {

                            console.error(
                                `Unable to load photo ${index + 1}.`
                            );

                        };


                    image.src =
                        photo;


                    images[index] =
                        image;

                }
            );


            function drawFinalTemplate() {

                images.forEach(
                    (image, index) => {

                        const y =

                            topPadding +

                            (
                                index *
                                (
                                    photoHeight +
                                    gap
                                )
                            );


                        // ==================================
                        // WHITE BORDER
                        // ==================================

                        context.fillStyle =
                            "#ffffff";


                        context.fillRect(

                            sidePadding - 7,

                            y - 7,

                            photoWidth + 14,

                            photoHeight + 14

                        );


                        // ==================================
                        // APPLY FILTER
                        // ==================================

                        context.filter =
                            getCanvasFilter(
                                selectedFilter
                            );


                        context.drawImage(

                            image,

                            sidePadding,

                            y,

                            photoWidth,

                            photoHeight

                        );


                        context.filter =
                            "none";


                        // ==================================
                        // PHOTO BORDER
                        // ==================================

                        context.strokeStyle =
                            "#b9a28d";


                        context.lineWidth =
                            2;


                        context.strokeRect(

                            sidePadding,

                            y,

                            photoWidth,

                            photoHeight

                        );

                    }
                );


                // ==================================
                // DECORATIVE LINE
                // ==================================

                const lineY =
                    totalHeight - 82;


                context.strokeStyle =
                    "#b9a28d";


                context.lineWidth =
                    1;


                context.beginPath();


                context.moveTo(
                    180,
                    lineY
                );


                context.lineTo(
                    520,
                    lineY
                );


                context.stroke();


                // ==================================
                // BOTTOM TEXT
                // ==================================

                context.fillStyle =
                    "#6b4f3a";


                context.font =
                    "18px Georgia";


                context.fillText(

                    "three moments • one memory",

                    width / 2,

                    totalHeight - 50

                );


                // ==================================
                // DATE
                // ==================================

                context.font =
                    "12px Arial";


                context.fillStyle =
                    "#8b7462";


                context.fillText(

                    new Date().toLocaleDateString(),

                    width / 2,

                    totalHeight - 25

                );


                // ==================================
                // CONVERT TO JPEG
                // ==================================

                const result =
                    stripCanvas.toDataURL(

                        "image/jpeg",

                        0.95

                    );


                resolve(result);

            }

        }
    );

}


// ==========================================
// FILTER SETTINGS
// ==========================================

function getCanvasFilter(filter) {

    switch (filter) {

        case "vintage":

            return `
                sepia(0.45)
                contrast(0.9)
                brightness(1.05)
                saturate(0.8)
            `;


        case "bw":

            return `
                grayscale(1)
                contrast(1.1)
            `;


        case "sepia":

            return `
                sepia(0.85)
                contrast(0.95)
            `;


        case "warm":

            return `
                sepia(0.2)
                saturate(1.35)
                brightness(1.05)
            `;


        case "cool":

            return `
                saturate(0.9)
                brightness(1.05)
                hue-rotate(12deg)
            `;


        case "bright":

            return `
                brightness(1.3)
                saturate(1.1)
            `;


        case "contrast":

            return `
                contrast(1.4)
                saturate(1.1)
            `;


        case "fade":

            return `
                brightness(1.12)
                contrast(0.8)
                saturate(0.75)
            `;


        case "dramatic":

            return `
                contrast(1.55)
                saturate(1.15)
                brightness(0.92)
            `;


        case "rose":

            return `
                sepia(0.15)
                saturate(1.3)
                hue-rotate(-12deg)
                brightness(1.05)
            `;


        case "golden":

            return `
                sepia(0.35)
                saturate(1.35)
                brightness(1.08)
                contrast(1.05)
            `;


        case "original":

        default:

            return "none";

    }

}


// ==========================================
// SAVE FINAL PHOTO TO USER'S DEVICE
// ==========================================

savePhotoButton.addEventListener(
    "click",
    async () => {

        if (!finalPhoto) {

            status.textContent =
                "Please create your final template first.";

            return;

        }


        try {

            savePhotoButton.disabled =
                true;


            status.textContent =
                "Preparing your photo strip...";


            // ==================================
            // CREATE FILE NAME
            // ==================================

            const now =
                new Date();


            const timestamp =
                now
                    .toISOString()
                    .replace(
                        /[:.]/g,
                        "-"
                    );


            const filename =
                `Jems-Photobooth-${timestamp}.jpg`;


            // ==================================
            // CONVERT FINAL PHOTO TO BLOB
            // ==================================

            const response =
                await fetch(finalPhoto);


            if (!response.ok) {

                throw new Error(
                    "Unable to read the final photo."
                );

            }


            const blob =
                await response.blob();


            if (
                !blob ||
                blob.size === 0
            ) {

                throw new Error(
                    "The generated photo is empty."
                );

            }


            // ==================================
            // USE SAVE AS DIALOG IF AVAILABLE
            // ==================================

            if (
                typeof window.showSaveFilePicker ===
                "function"
            ) {

                const fileHandle =
                    await window.showSaveFilePicker({

                        suggestedName:
                            filename,

                        types: [

                            {
                                description:
                                    "JPEG Image",

                                accept: {

                                    "image/jpeg":
                                        [".jpg"]

                                }

                            }

                        ]

                    });


                const writable =
                    await fileHandle.createWritable();


                await writable.write(
                    blob
                );


                await writable.close();


                status.textContent =
                    "✅ Photo strip saved successfully!";


                savePhotoButton.disabled =
                    false;


                return;

            }


            // ==================================
            // FALLBACK DOWNLOAD
            // ==================================

            const downloadURL =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                downloadURL;


            link.download =
                filename;


            link.target =
                "_blank";


            link.rel =
                "noopener";


            link.style.display =
                "none";


            document.body.appendChild(
                link
            );


            // ==================================
            // TRIGGER DOWNLOAD
            // ==================================

            link.click();


            // ==================================
            // CLEANUP
            // ==================================

            setTimeout(
                () => {

                    if (
                        link.parentNode
                    ) {

                        link.parentNode.removeChild(
                            link
                        );

                    }


                    URL.revokeObjectURL(
                        downloadURL
                    );

                },
                3000
            );


            status.textContent =
                "✅ Photo strip download started!";


            setTimeout(
                () => {

                    savePhotoButton.disabled =
                        false;

                },
                1500
            );

        }

        catch (error) {

            console.error(
                "Save error:",
                error
            );


            // ==================================
            // USER CANCELLED SAVE DIALOG
            // ==================================

            if (
                error.name ===
                "AbortError"
            ) {

                status.textContent =
                    "Save cancelled.";

            }

            else {

                status.textContent =
                    "❌ Unable to save the photo strip.";

                console.error(
                    "Full save error:",
                    error
                );

            }


            savePhotoButton.disabled =
                false;

        }

    }
);


// ==========================================
// NEW SESSION
// ==========================================

newSessionButton.addEventListener(
    "click",
    () => {

        resetPhotos();


        finalPhoto =
            null;


        selectedFilter =
            "original";


        finalPreview.src =
            "";


        finalSection.classList.remove(
            "visible"
        );


        filterSection.classList.remove(
            "visible"
        );


        finalizeButton.disabled =
            true;


        applyFilterButton.disabled =
            false;


        savePhotoButton.disabled =
            false;


        photoCounter.textContent =
            "0 / 3";


        progressFill.style.width =
            "0%";


        filterButtons.forEach(
            (button, index) => {

                button.classList.remove(
                    "active"
                );


                if (index === 0) {

                    button.classList.add(
                        "active"
                    );

                }

            }
        );


        selectedFilterText.textContent =
            "Original";


        finalSelectedFilter.textContent =
            "Original";


        status.textContent =
            "Ready for a new session!";


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }
);


// ==========================================
// RESET PHOTOS
// ==========================================

function resetPhotos() {

    capturedPhotos =
        [];


    photoImages.forEach(
        (image) => {

            image.src =
                "";


            image.classList.remove(
                "captured"
            );

        }
    );


    photoDots.forEach(
        (dot) => {

            dot.classList.remove(
                "active"
            );

        }
    );

}


// ==========================================
// WAIT
// ==========================================

function wait(milliseconds) {

    return new Promise(
        (resolve) => {

            setTimeout(
                resolve,
                milliseconds
            );

        }
    );

}