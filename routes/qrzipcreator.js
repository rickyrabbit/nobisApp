let QRCode = require('qrcode');
const tmp = require('tmp-promise');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const AdmZip = require('adm-zip');

const { UnAuthenticatedError, QueryError, InsertError, UpdateError, DeleteError, InternalServerError, ModuleError, InternalOperationError } = require("./errors");

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
                doc.addPage({
                    margins: {
                      top: 50,
                      bottom: 50,
                      left: 72,
                      right: 72
                    }
                  });
                doc.font(details.FONTPATH);
                doc.image(details.LOGOPATH, 146, 50, { fit: [320, 85] });
                // TODO: Add in details if they became final
                doc.font("public/fonts/Roboto-Regular.ttf");
                doc.fontSize(26).text("Sperimentazione di", 72, 150, { align: 'center',  });
                doc.font("public/fonts/Roboto-Bold.ttf");
                doc.fontSize(45).text(details.TITLE, 72, 175, { align: 'center' });
                doc.font("public/fonts/Roboto-Italic.ttf");
                doc.fontSize(16).text("NoBis è un servizio completamente anonimo di conteggio in tempo reale del livello di affollamento di un locale universitario", 72, 235, { align: 'center',   });
                doc.font("public/fonts/Roboto-Bold.ttf");
                doc.fontSize(50).text(`CHECK-${typeCheckOperation}`, 72, 300, { align: 'center' });
                doc.fontSize(28).text(details.PLACENAME, 72, 370, { align: 'center' });
                doc.font(details.FONTPATH);
                doc.fontSize(24).text(details.BUILDINGNAME, 72, 400, { align: 'center' });
                doc.image(imgPath, 206, 430, { width: 190 });
                doc.font("public/fonts/Roboto-Regular.ttf");
                doc.fontSize(20).text(helpText, 72, 630, { align: 'center' });
                doc.fontSize(13).text("nobis.dei.unipd.it", 72, 700, { align: 'center' });
                doc.fontSize(12).text("Giulia Cisotto (giulia.cisotto@dei.unipd.it)", 72, 725, { align: 'left', continued: true});
                doc.fontSize(12).text("Marco Giordani (giordani@dei.unipd.it)", 72, 725, { align: 'right'});
            };

            doc.pipe(out);

            newPdfPage(pdfGraphicalDetails, "IN");
            newPdfPage(pdfGraphicalDetails, "OUT");
            
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