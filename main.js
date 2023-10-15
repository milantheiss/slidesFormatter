const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const p = require('path');

async function embedSlidesOnBase(basePdfPath, slidesPdfPath) {
    // Get pdf which should be embedded
    const slidesPdf = await PDFDocument.load(fs.readFileSync(slidesPdfPath));

    // Get base pdf
    const basePdf = await PDFDocument.load(fs.readFileSync(basePdfPath));

    const { width, height } = basePdf.getPage(0).getSize();

    // Create a new PDFDocument
    const doc = await PDFDocument.create();

    // Add as many pages as there are slides
    for (slide of slidesPdf.getPages()) {
        // Copy base page to new page
        const copiedPage = await doc.copyPages(basePdf, [0]);
        const page = doc.addPage(copiedPage[0]);

        // Embed slide on new page
        const embeddedPage = await doc.embedPage(slide);

        // Get size ration of slide
        const embeddedPageRatio = embeddedPage.width / embeddedPage.height;

        // Draw slide on new page
        // X and Y are position coordinates of slides to the bottom left corner of the base page
        page.drawPage(embeddedPage, {
            x: 0,
            y: height - width / embeddedPageRatio,
            width: width,
            height: width / embeddedPageRatio
        });
    }

    // Get get output path from arguments
    const outputPath = process.argv[4];

    // Save PDF to disk
    fs.writeFileSync(outputPath, await doc.save())

    console.log("Done!");
}

// Validate path and add .pdf if not present
function validatePath(path) {
    // Check if path exists
    if (!fs.existsSync(path)) {
        console.log(`Error: ${path} does not exist.`);
        process.exit(1);
    }

    // Add .pdf if not present
    if (!path.match(/\.pdf$/)) {
        path.concat(".pdf");
    }
    return path;
}

// Check if arguments are valid
if (process.argv[2] !== "-f" && process.argv.length === 5 || process.argv[2] === "-f" && process.argv.length === 6) {
    //Throws an error if -f is not set and output path already exists
    if (process.argv.splice(2, 1)[0] !== "-f" && fs.existsSync(process.argv[4])) {
        console.log(`Error: ${process.argv[4]} already exist. Use -f as last argument to overwrite.`);
        process.exit(1);
    } 

    // Throws an error if directory of output path doesn't exists
    if (!fs.existsSync(p.dirname(process.argv[4]))) {
        console.log(`Error: ${p.dirname(process.argv[4])}/ does not exist.`);
        process.exit(1);
    }

    embedSlidesOnBase(validatePath(process.argv[2]), validatePath(process.argv[3]));
} else {
    console.log("Usage: node main.js [-f if overwrite] <base-pdf-path> <slides-pdf-path> <output-pdf-path>");
}