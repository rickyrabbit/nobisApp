/*
 * Copyright 2020 Mattia Avanzi, Riccardo Coniglio, Università degli Studi di Padova
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

let QRCode = require('qrcode');
const tmp = require('tmp-promise');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const AdmZip = require('adm-zip');

// Errors Management
const { UnAuthenticatedError, QueryError, InsertError, UpdateError, DeleteError, InternalServerError, ModuleError, InternalOperationError } = require("./errors");

/**
 * Provide both graphical and textual details for the PDF generation
 *
 * @param {*} fontpath Relative path of the used font
 * @param {*} pathLogoImage Relative path of the logo image
 * @param {*} title Title of the document (i.e. NoBis)
 * @param {*} textBelowQR General use description
 * @param {*} placeName Name of the place
 * @param {*} buildingName Name of the building that contains the place
 * @return {*} All information
 */
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

/**
 * Provide the Relative path of the Check-In and Check-Out QR codes images
 *
 * @param {*} pathQRImageCheckIn Check-In QR Code image relative path
 * @param {*} pathQRImageCheckOut Check-Out QR Code image relative path
 * @return {*} 
 */
const QRImages = (pathQRImageCheckIn, pathQRImageCheckOut) => {
    return {
        "CHECK-IN": pathQRImageCheckIn,
        "CHECK-OUT": pathQRImageCheckOut
    }
};

/**
 * Creates and saves the QR code for a specific type action (Check-In/Check-Out)
 * 
 * @param {*} dirpath temporary directory where QR Codes are stored
 * @param {*} placeuuid uuid of the place
 * @param {*} type action: Check-In or Check-Out
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
 * Creates and saves the PDF containing the QR codes
 * 
 * @param {*} dirpath temporary directory where PDF and QR codes are stored
 * @param {*} filenameNoExtension name of the PDF wo extension
 * @param {*} pdfGraphicalDetails graphical and textual details for the PDF generation
 * @param {*} QRImages QR codes images
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
                    helpText = helpText.replace('XXXXX', 'In in');
                } else {
                    imgPath = checkoutFilePath;
                    helpText = helpText.replace('XXXXX', 'Out da');
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
                let logoWidth, logoHeight, logoX;
                if(details.LOGOPATH.indexOf("abano") !== -1){
                    logoWidth = 135;
                    logoHeight = 85;
                    logoX = 120;
                    doc.image(details.LOGOPATH, logoX, 50, { fit: [logoWidth, logoHeight] });
                    doc.image("public/brand/unipd-dei.png", 320, 60, { fit: [240, 63] });
                } else {
                    logoWidth = 320;
                    logoHeight = 85;
                    logoX = 146;
                    doc.image(details.LOGOPATH, logoX, 50, { fit: [logoWidth, logoHeight] });
                }
                // TODO: Add in details if they became final
                doc.font("public/fonts/FiraSans-Regular.ttf");
                doc.fontSize(26).text("Sperimentazione di", 72, 150, { align: 'center',  });
                doc.font("public/fonts/FiraSans-Bold.ttf");
                doc.fontSize(45).text(details.TITLE, 72, 180, { align: 'center' });
                doc.font("public/fonts/FiraSans-Italic.ttf");
                doc.fontSize(16).text("NoBis è un servizio", 72, 240, {align: 'left', continued: true});
                doc.fontSize(16).font("public/fonts/FiraSans-BoldItalic.ttf").text(" anonimo ", 72, 240, {align: 'left',  continued: true});
                doc.fontSize(16).font("public/fonts/FiraSans-Italic.ttf").text("di verifica in tempo reale del livello di affollamento di un luogo pubblico", 72, 240, {align: 'center'});
                doc.font("public/fonts/FiraSans-Bold.ttf");
                doc.fontSize(48).text(`CHECK-${typeCheckOperation}`, 72, 300, { align: 'center' });
                doc.fontSize(36).text(details.PLACENAME, 72, 355, { align: 'center' });
                doc.font(details.FONTPATH);
                doc.fontSize(24).text(details.BUILDINGNAME, 72, 395, { align: 'center' });
                doc.image(imgPath, 210, 425, { width: 190 });
                doc.font("public/fonts/FiraSans-Regular.ttf");
                doc.fontSize(18).text(helpText, 72, 620, { align: 'center' });
                doc.fontSize(12).text("Per maggiori informazioni: nobis.dei.unipd.it", 72, 675, { align: 'center' });
                doc.fontSize(12).text("Contatti: referenti.nobis@gmail.com", 72, 690, { align: 'center'});
                doc.font("public/fonts/FiraSans-Italic.ttf").fontSize(10).text('La tutela dei dati personali degli utenti è garantira ai sensi degli art. 13 e 14 del Regolamento Europeo 2016/679 ("Regolamento Generale sulla protezione dei Dati")', 72, 715, { align: 'center'});
                //doc.fontSize(12).text("Giulia Cisotto (giulia.cisotto@dei.unipd.it)", 72, 725, { align: 'left', continued: true});
                //doc.fontSize(12).text("Marco Giordani (giordani@dei.unipd.it)", 72, 725, { align: 'right'});
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

/**
 *  Creates a zip file
 *
 * @param {*} dirPath Destination directory
 * @param {*} zipname Name of the zip file
 * @return {*} Destination directory where the file is created
 */
const createZip = (dirPath, zipname) => {
    let zip = new AdmZip();
    zip.addLocalFolder(dirPath);
    let destPath = `${dirPath}/${zipname}.zip`;
    zip.writeZip(destPath);
    return destPath;
}

// Exports

module.exports = {
    pdfGraphicalDetails,
    QRImages,
    saveQRImagetoPath,
    saveQRPDFtoPath,
    createZip

}