let QRCode = require('qrcode');
const tmp = require('tmp-promise');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const AdmZip = require('adm-zip');

const { UnAuthenticatedError, QueryError, InsertError, UpdateError, DeleteError, InternalServerError, ModuleError, InternalOperationError } = require("./errors");



/* let placeName = await db.getPlaceNameByUUID(req.params.uuid);
let buildingName = await buildingdb.getBuildingNameByPlaceUUID(req.params.uuid);
const options = { unsafeCleanup: true }; */



/* tmp.dir(options, function _tempDirCreated(dirErr, path, cleanupCallback) {
    if (dirErr) throw dirErr;
    QRCode.toFile(`${path}/${req.params.uuid}-check-in.png`, `https://nobis.dei.unipd.it/place/check-in?placeUUID=${req.params.uuid}`, {}, function (inErr) {
        if (inErr) throw inErr
        QRCode.toFile(`${path}/${req.params.uuid}-check-out.png`, `https://nobis.dei.unipd.it/place/check-out?placeUUID=${req.params.uuid}`, {}, function (outErr) {
            if (outErr) throw outErr
            // TODO: Code refactoring needed 
            const doc = new PDFDocument();
            // TODO: Better place for the PDF? Why temporary ${path} doesn't work?
            let out = fs.createWriteStream(`${path}/printable.pdf`);
            doc.pipe(out);
            doc.font('public/fonts/Roboto-Medium.ttf');
            doc.image('public/img/Logo_Universita_Padova.png', 216, 72, { fit: [180, 180] });
            doc.fontSize(20).text('NOBIS', 72, 275, { align: 'center' });
            doc.fontSize(38).text('CHECK-IN', 72, 320, { align: 'center' });
            doc.fontSize(28).text(placeName, 72, 380, { align: 'center' });
            doc.fontSize(24).text(buildingName, 72, 410, { align: 'center' });
            doc.image(`${path}/${req.params.uuid}-check-in.png`, 213, 460, { fit: [180, 180] });
            doc.fontSize(20).text('Inquadra il codice QR con la fotocamera per effettuare il Check-In in questo luogo', 72, 670, { align: 'center' });
            doc.addPage();
            doc.font('public/fonts/Roboto-Medium.ttf');
            doc.image('public/img/Logo_Universita_Padova.png', 216, 72, { fit: [180, 180] });
            doc.fontSize(20).text('NOBIS', 72, 275, { align: 'center' });
            doc.fontSize(38).text('CHECK-OUT', 72, 320, { align: 'center' });
            doc.fontSize(28).text(placeName, 72, 380, { align: 'center' });
            doc.fontSize(24).text(buildingName, 72, 410, { align: 'center' });
            doc.image(`${path}/${req.params.uuid}-check-out.png`, 213, 460, { fit: [180, 180] });
            doc.fontSize(20).text('Inquadra il codice QR con la fotocamera per effettuare il Check-Out da  questo luogo', 72, 670, { align: 'center' });
            doc.end();
            out.on('finish', function () {
                res.zip([
                    { path: `${path}/${req.params.uuid}-check-in.png`, name: `check-in.png` },
                    { path: `${path}/${req.params.uuid}-check-out.png`, name: `check-out.png` },
                    { path: `${path}/printable.pdf`, name: `printable.pdf` }
                ], `QR Codes - ${placeName}`, cleanupCallback);
                //setTimeout(cleanupCallback, 1000);
            });
        })
    })
}); */

const pdfGraphicalDetails = (fontpath, pathLogoImage, title, textBelowQR, placeName, buildingName) => {
    return {
        "FONTPATH": fontpath,
        "LOGOPATH": pathLogoImage,
        "TITLE": title,
        "HELPTEXT": textBelowQR,
        "PLACENAME": placeName,
        "BUILDINGNAME": buildingName
    }
}

const QRImages = (pathQRImageCheckIn, pathQRImageCheckOut) => {
    return {
        "CHECK-IN": pathQRImageCheckIn,
        "CHECK-OUT": pathQRImageCheckOut
    }
};

/**
 * 
 * @param {*} dirpath 
 * @param {*} placeuuid 
 * @param {*} type 
 * @throws {InternalOperationError} WRONGCHECKOPERATIONTYPE
 * @throws {ModuleError} QRFILECREATIONFAIL
 */
const saveQRImagetoPath = async (dirpath, placeuuid, type) => {
    if (type !== "CHECKOUT" && type !== "CHECKIN") {
        let ioe = new InternalOperationError();
        ioe.setReason("WRONGCHECKOPERATIONTYPE");
        throw ioe;
    } else {
        let qrFilePath = '';
        let qrLink = '';
        let typeCheck = '';
        if (type === "CHECKOUT") {
            typeCheck = 'out';
        } else if (type === "CHECKIN") {
            typeCheck = 'in';
        }
        qrFilePath = `${dirpath}/${placeuuid}-check-${typeCheck}.PNG`;
        qrLink = `${process.env.APP_DOMAIN}/place/check-${typeCheck}?placeUUID=${placeuuid}`;

        let me = new ModuleError();
        try {
            await QRCode.toFile(qrFilePath, qrLink);
            return qrFilePath;
        } catch (err) {
            console.error(err);
            me.setReason("QRFILECREATIONFAIL");
            throw me;
        }
    }
}


/**
 * 
 * @param {*} dirpath 
 * @param {*} filenameNoExtension 
 * @param {*} pdfGraphicalDetails 
 * @param {*} QRImages 
 * @returns {string} file path of the pdf or nothing
 */
const saveQRPDFtoPath = (dirpath, filenameNoExtension, pdfGraphicalDetails, checkinFilePath, checkoutFilePath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ autoFirstPage: false });
            let pdfFilePath = `${dirpath}/${filenameNoExtension}.pdf`;
            // TODO: Better place for the PDF? Why temporary ${path} doesn't work?
            let out = fs.createWriteStream(pdfFilePath);

            const newPdfPage = (details, typeCheckOperation) => {
                if (typeCheckOperation !== "IN" && typeCheckOperation !== "OUT") {
                    let ioe = new InternalOperationError();
                    ioe.setReason("WRONGCHECKOPERATIONTYPE");
                    throw ioe;
                }
                let imgPath;
                let helpText = details.HELPTEXT;
                if (typeCheckOperation === "IN") {
                    imgPath = checkinFilePath;
                    helpText = helpText.replace('XXXXX', 'In');
                } else {
                    imgPath = checkoutFilePath;
                    helpText = helpText.replace('XXXXX', 'Out');
                }
                doc.addPage();
                doc.font(details.FONTPATH);
                doc.image(details.LOGOPATH, 216, 72, { fit: [180, 180] });
                doc.fontSize(20).text(details.TITLE, 72, 275, { align: 'center' });
                doc.fontSize(38).text(`CHECK-${typeCheckOperation}`, 72, 320, { align: 'center' });
                doc.fontSize(28).text(details.PLACENAME, 72, 380, { align: 'center' });
                doc.fontSize(24).text(details.BUILDINGNAME, 72, 410, { align: 'center' });
                doc.image(imgPath, 213, 460, { width: 200 });
                doc.fontSize(20).text(helpText, 72, 670, { align: 'center' });
            };
            //doc.on('pageAdded', newPdfPage);
            doc.pipe(out);

            newPdfPage(pdfGraphicalDetails, "IN");
            newPdfPage(pdfGraphicalDetails, "OUT");
            /* doc.font('public/fonts/Roboto-Medium.ttf');
            doc.image('public/img/Logo_Universita_Padova.png', 216, 72, { fit: [180, 180] });
            doc.fontSize(20).text('NOBIS', 72, 275, { align: 'center' });
            doc.fontSize(38).text('CHECK-IN', 72, 320, { align: 'center' });
            doc.fontSize(28).text(placeName, 72, 380, { align: 'center' });
            doc.fontSize(24).text(buildingName, 72, 410, { align: 'center' });
            doc.image(`${path}/${req.params.uuid}-check-in.png`, 213, 460, { fit: [180, 180] });
            doc.fontSize(20).text('Inquadra il codice QR con la fotocamera per effettuare il Check-In in questo luogo', 72, 670, { align: 'center' }); */
            //doc.addPage();
            /*  doc.font('public/fonts/Roboto-Medium.ttf');
             doc.image('public/img/Logo_Universita_Padova.png', 216, 72, { fit: [180, 180] });
             doc.fontSize(20).text('NOBIS', 72, 275, { align: 'center' });
             doc.fontSize(38).text('CHECK-OUT', 72, 320, { align: 'center' });
             doc.fontSize(28).text(placeName, 72, 380, { align: 'center' });
             doc.fontSize(24).text(buildingName, 72, 410, { align: 'center' });
             doc.image(`${path}/${req.params.uuid}-check-out.png`, 213, 460, { fit: [180, 180] });
             doc.fontSize(20).text('Inquadra il codice QR con la fotocamera per effettuare il Check-Out da  questo luogo', 72, 670, { align: 'center' }); */
            doc.end();
            out.on('finish', () => {
                resolve(pdfFilePath);
            });
            out.on('error', () => {
                let ioe = new InternalOperationError();
                ioe.setReason("PDFWRITEFAIL");
                throw ioe;
            });

        } catch (err) {
            console.debug(err);
            let ioe = new InternalOperationError();
            if (err.reason !== "") {
                ioe.setReason(err.reason);
            }
            //throw ioe;
            reject(ioe);
        }
    })

}


const createZip = (dirPath, zipname) => {

    let zip = new AdmZip();
    zip.addLocalFolder(dirPath);
    let destPath = `${dirPath}/${zipname}.zip`;
    zip.writeZip(destPath);
    return destPath;

    /* await fs.promises.mkdir(`${dirFiles}/toZip`);
    await Promise.all(dirFiles.map(filename => {
        fs.promises.copyFile(filename,`${dirFiles}/toZip/${filename}`);
    })); */

    /* return Promise.all(dirFiles.map(filename => {
        return new Promise((resolve, reject) => {
          const fileContents = fs.createReadStream(`./data/${filename}`);
          const writeStream = fs.createWriteStream(`./data/${filename}.gz`);
          const zip = zlib.createGzip();
          fileContents.pipe(zip).pipe(writeStream).on('finish', (err) => {
            if (err) return reject(err);
            else resolve();
          });
        });
      })); */
}


module.exports = {
    pdfGraphicalDetails,
    QRImages,
    saveQRImagetoPath,
    saveQRPDFtoPath,
    createZip

}