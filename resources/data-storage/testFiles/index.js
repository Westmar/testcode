const path = require('path');
const pathToSource = path.resolve(__dirname);
const pathToExpected = path.resolve(pathToSource, './expectedResults');
const pathToThumbnail = path.resolve(pathToExpected, './thumbnails');

const filesForConversations = {
    imagePNG: {
        path: `${pathToSource}/data-storage-test-image.png`,
        size: 43193,
        mime: 'image/png',
        width: 140,
        height: 140,
        expectedFile: `${pathToExpected}/expected-image.png`,
        thumbnail: `${pathToThumbnail}/png_thumbnail.jpeg`
    },
    imageBMP: {
        path: `${pathToSource}/data-storage-test-image.bmp`,
        size: 9360,
        mime: 'image/bmp',
        width: 0,
        height: 0,
        preview: 'https://*/images/thumbnails/unknown.png',
        expectedFile: `${pathToExpected}/expected-image.bmp`,
        thumbnail: `${pathToThumbnail}/bmp_thumbnail.png`
    },
    imageGIF: {
        path: `${pathToSource}/data-storage-test-image.gif`,
        size: 14620,
        mime: 'image/gif',
        width: 128,
        height: 128,
        expectedFile: `${pathToExpected}/expected-image.gif`,
        thumbnail: `${pathToThumbnail}/gif_thumbnail.jpeg`
    },
    imageLargeGIF: {
        path: `${pathToSource}/data-storage-test-large.gif`,
        size: 4317176,
        mime: 'image/gif',
        width: 1920,
        height: 912,
        expectedFile: `${pathToExpected}/expected-large.gif`,
        thumbnail: `${pathToThumbnail}/gif_large_thumbnail.jpeg`
    },
    imageSVG: {
        path: `${pathToSource}/data-storage-test-image.svg`,
        size: 4048,
        mime: 'image/svg+xml',
        width: 800,
        height: 800,
        expectedFile: `${pathToExpected}/expected-image.svg`,
        thumbnail: `${pathToThumbnail}/svg_thumbnail.jpeg`
    },
    imageWEBP: {
        path: `${pathToSource}/data-storage-test-image.webp`,
        size: 33426,
        mime: 'image/webp',
        width: 355,
        height: 200,
        expectedFile: `${pathToExpected}/expected-image.webp`,
        thumbnail: `${pathToThumbnail}/webp_thumbnail.jpeg`
    },
    imageJPEG: {
        path: `${pathToSource}/data-storage-test-image.jpeg`,
        size: 81645,
        mime: 'image/jpeg',
        width: 900,
        height: 200,
        expectedFile: `${pathToExpected}/expected-image.jpeg`,
        thumbnail: `${pathToThumbnail}/jpeg_thumbnail.jpeg`
    },
    imageJPG: {
        path: `${pathToSource}/data-storage-test-image.jpg`,
        size: 152665,
        mime: 'image/jpeg',
        width: 355,
        height: 900,
        expectedFile: `${pathToExpected}/expected-image.jpg`,
        thumbnail: `${pathToThumbnail}/jpg_thumbnail.jpeg`
    },
    imageTIFF: {
        path: `${pathToSource}/data-storage-test.tiff`,
        size: 1131930,
        mime: 'image/tiff',
        width: 650,
        height: 434,
        expectedFile: `${pathToExpected}/expected.tiff`,
        thumbnail: `${pathToThumbnail}/tiff_thumbnail.jpeg`
    },
    csv: {
        path: `${pathToSource}/data-storage-test.csv`,
        size: 268,
        mime: 'text/csv',
        width: 0,
        height: 0,
        preview: 'https://*/images/thumbnails/csv.png',
        expectedFile: `${pathToExpected}/expected.csv`,
        thumbnail: `${pathToThumbnail}/csv_thumbnail.png`
    },
    doc: {
        path: `${pathToSource}/data-storage-test.doc`,
        size: 6124,
        mime: 'application/msword',
        width: 0,
        height: 0,
        preview: 'https://*/images/thumbnails/doc.png',
        expectedFile: `${pathToExpected}/expected.doc`,
        thumbnail: `${pathToThumbnail}/doc_thumbnail.png`
    },
    docx: {
        path: `${pathToSource}/data-storage-test.docx`,
        size: 6112,
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        width: 0,
        height: 0,
        preview: 'https://*/images/thumbnails/docx.png',
        expectedFile: `${pathToExpected}/expected.docx`,
        thumbnail: `${pathToThumbnail}/docx_thumbnail.png`
    },
    gzip: {
        path: `${pathToSource}/data-storage-test.gzip`,
        size:1962,
        mime: 'application/gzip',
        width: 0,
        height: 0,
        preview: 'https://*/images/thumbnails/gzip.png',
        expectedFile: `${pathToExpected}/expected.gzip`,
        thumbnail: `${pathToThumbnail}/gzip_thumbnail.png`
    },
    odt: {
        path: `${pathToSource}/data-storage-test.odt`,
        size: 5206,
        mime: 'application/vnd.oasis.opendocument.text',
        width: 0,
        height: 0,
        preview: 'https://*/images/thumbnails/odt.png',
        expectedFile: `${pathToExpected}/expected.odt`,
        thumbnail: `${pathToThumbnail}/odt_thumbnail.png`
    },
    pdf: {
        path: `${pathToSource}/data-storage-test.pdf`,
        size: 33499,
        mime: 'application/pdf',
        width: 0,
        height: 0,
        preview: 'https://*/images/thumbnails/pdf.png',
        expectedFile: `${pathToExpected}/expected.pdf`,
        thumbnail: `${pathToThumbnail}/pdf_thumbnail.png`
    },
    psd: {
        path: `${pathToSource}/data-storage-test.psd`,
        size: 78795,
        mime: 'image/vnd.adobe.photoshop',
        width: 0,
        height: 0,
        preview: 'https://*/images/thumbnails/psd.png',
        expectedFile: `${pathToExpected}/expected.psd`,
        thumbnail: `${pathToThumbnail}/psd_thumbnail.png`
    },
    rar: {
        path: `${pathToSource}/data-storage-test.rar`,
        size: 11789,
        mime: 'application/x-rar-compressed',
        width: 0,
        height: 0,
        preview: 'https://*/images/thumbnails/rar.png',
        expectedFile: `${pathToExpected}/expected.rar`,
        thumbnail: `${pathToThumbnail}/rar_thumbnail.png`
    },
    zip: {
        path: `${pathToSource}/data-storage-test.zip`,
        size: 7701,
        mime: 'application/zip',
        width: 0,
        height: 0,
        preview: 'https://*/images/thumbnails/zip.png',
        expectedFile: `${pathToExpected}/expected.zip`,
        thumbnail: `${pathToThumbnail}/zip_thumbnail.png`
    },
    xls: {
        path: `${pathToSource}/data-storage-test.xls`,
        size: 8704,
        mime: 'application/vnd.ms-excel',
        width: 0,
        height: 0,
        preview: 'https://*/images/thumbnails/xls.png',
        expectedFile: `${pathToExpected}/expected.xls`,
        thumbnail: `${pathToThumbnail}/xls_thumbnail.png`
    },
    xlsx: {
        path: `${pathToSource}/data-storage-test.xlsx`,
        size: 4826,
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        width: 0,
        height: 0,
        preview: 'https://*/images/thumbnails/xlsx.png',
        expectedFile: `${pathToExpected}/expected.xlsx`,
        thumbnail: `${pathToThumbnail}/xlsx_thumbnail.png`
    }
};
const files = {
    mp3: {
        path: `${pathToSource}/data-storage-test.mp3`,
        size: 11205
    },
    zip: {
        path: `${pathToSource}/data-storage-test.zip`,
        size: 7701
    },
    tiff: {
        path: `${pathToSource}/data-storage-test.tiff`,
        size: 1131930
    },
    empty: {
        path: `${pathToSource}/data-storage-test.empty`,
        size: 0
    } };

module.exports = {
    filesForConversations,
    files
};
