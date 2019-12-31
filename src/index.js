/**
 *  @fileOverview Provides core promisified helper functions for using minio bucket from Node API
 *
 *  @author       Darshit Vora
 *  @author       Manjesh Vinayaka
 *  @author       Yatish Balaji
 *  @author       Anish Lushte
 *  @author       Yogesh Chaudhary
 *
 *  @requires     NPM:fs-promise
 *  @requires     NPM:minio
 *  @requires     NPM:bluebird
 */

const fsp = require('fs-promise');
const minio = require('minio');
const Bluebird = require('bluebird');


/**
 * Minio Helper
 * Initialize Node Minio Object
 * @example
 * const NodeMinio = require('node-minio');
 *
 * const config = {
 *     minio: {
 *       endPoint: "192.168.23.100",
 *       accessKey: "SN8JBGY43WPMFT0R56fsdfdsf",
 *       secretKey: "fdfdfdfd+3R9e/x4V0F6Xpjtfdsfd",
 *       secure: false,
 *       port: 8000,
 *     },
 *     errorFileUrl: "/sample/errorfile.pdf",
 *     bucket: "sample"
 * }

 const Minio = new NodeMinio(config);
 * @class
 * @constructor
 * @param {object} config
 * @param {string} bucket
 */
const NodeMinio = function (config) {
    this.config = config;
    this.bucket = config.bucket;
    this.Minio = new minio.Client(this.config.minio);
    Bluebird.promisifyAll(Object.getPrototypeOf(this.Minio));
    return this.Minio;
};


function qualifyBucket(bucketName) {
    let bucket = bucketName;
    if (typeof bucket === 'string' && bucket[0] === '/') {
        bucket = bucket.slice(1);
    }
    return bucket.toLowerCase();
}

/**
 * Takes and object with 3 or 4 attributes {object, base64String, bucket, buffer}.
 * Uploads file in specified minio bucket. This function is internally used by
 * base64Upload function
 * @example
 * const NodeMinio = require('node-minio');
 *
 * const config = {
 *     minio: {
        endPoint: process.env.MINIO_ENDPOINT,
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_SECRET_KEY,
        secure: false,
        port: 8000,
      },
      errorFileUrl: "/sample/errorfile.pdf"
  }
 *
 * const Minio = new NodeMinio(config);
 *
 * async function uploadFile(file) {
 *     const { base64: base64String, filename } = file;
 *     const extension = filename.split('.').pop();
 *     const fileName = moment().format('YYYY_MM_DD_hh_mm_ss_a');
 *     const object = `sampleFile/${fileName}.${extension}`;
 *     const buffer = Buffer.from(base64String, 'base64');
 *
 *     await Minio.bufferUpload({ object, base64String, buffer });
 *     return object;
 *   }
 * @memberof NodeMinio
 * @param   {object} minioObject  Contains an object with filepath, bucket and base64string
 *
 * @returns {object} returns promise object
 */
NodeMinio.prototype.bufferUpload = (minioObject) => {
    const minObj = minioObject;
    minObj.bucket = minObj.bucket || this.bucket; // Bucket name always in lowercaseObj
    return this.Minio.putObjectAsync(
        minObj.bucket, minObj.object,
        minObj.buffer, 'application/octet-stream',
    );
};

/**
 * Takes and object with 2 attributes {object, base64String}.
 * Asynchronously uploads file on specified path and returns promise
 * @example
 * const NodeMinio = require('node-minio');
 *
 * const config = {
 *     minio: {
        endPoint: process.env.MINIO_ENDPOINT,
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_SECRET_KEY,
        secure: false,
        port: 8000,
      },
      errorFileUrl: "/sample/errorfile.pdf"
  }
 *
 * const Minio = new NodeMinio(config);
 *
 * async function uploadFile(file) {
 *     const { base64: base64String, filename } = file;
 *     const extension = filename.split('.').pop();
 *     const fileName = moment().format('YYYY_MM_DD_hh_mm_ss_a');
 *     const object = `sampleFile/${fileName}.${extension}`;
 *
 *     await Minio.base64Upload({ object, base64String });
 *     return object;
 *   }
 * @memberof NodeMinio
 * @param   {object} minioObject  Contains an object with filepath, bucket and base64string
 *
 * @returns {object} returns promise object
 */
NodeMinio.prototype.base64Upload = (minioObject) => {
    const minObj = minioObject;
    minObj.buffer = Buffer.from(minioObject.base64String, 'base64');
    return this.Minio.bufferUpload(minObj);
};

/**
 * Takes and object with 2 attributes {object, bucket, expires}.
 * Generates dynamic Minio URL for accessing file with expiry
 * @example
 *
 * const NodeMinio = require('node-minio');
 *
 * const config = {
 *     minio: {
        endPoint: process.env.MINIO_ENDPOINT,
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_SECRET_KEY,
        secure: false,
        port: 8000,
      },
      errorFileUrl: "/sample/errorfile.pdf"
  }
 *
 * const Minio = new NodeMinio(config);
 *
 * async function viewFile(fileName) {
 *     const filePath= 'sampleFile/${fileName}.pdf'
 *
 *    const url = await minio
 *     .viewLink({
 *       object: filePath,
 *     }, false);
 *   return res.json(url);
 *   }
 * @memberof NodeMinio
 * @param   {object} minioObject  Contains an object with filepath, bucket, expiry time
 * @param   {boolean} FSCompat  Removes forward slash (/) from file path
 *
 * @returns {object} returns promise object
 */
NodeMinio.prototype.viewLink = (minioObject, FSCompat = false) => {
    const minObj = minioObject;
    minObj.bucket = minObj.bucket || this.bucket; // Bucket name always in lowercaseObj
    minObj.expires = minObj.expires || 24 * 60 * 60; // Expired in one day

    if (!minObj.object) {
        console.error('Minio: View File not found', minObj);
        return Promise.resolve(this.config.errorFileUrl);
    }

    return this.Minio.statObjectAsync(
        minObj.bucket,
        FSCompat
            ? qualifyBucket(minObj.object)
            : minObj.object,
    )
        .then(() => this.Minio
            .presignedGetObjectAsync(
                minObj.bucket,
                FSCompat
                    ? qualifyBucket(minObj.object)
                    : minObj.object, minObj.expires,
            ))
        .catch((err) => {
            console.error('Minio: View File not found', minObj, err);
            return this.config.errorFileUrl;
        });
};

/**
 * Takes an object with 1 attributes {object}.
 * Lists all the directories in current folder
 * @example
 *
 * const Minio = require('node-minio');
 *
 * async function listFilesInDirectory() {
 *
 *  const baseUrl = "/sampleFile";
 *   let fileList = await Minio.listDirectoryObjects({ object: baseUrl });
 *   return fileList;
 *   }
 * @memberof NodeMinio
 * @param   {object} minioObject  Contains an object with filepath, bucket, expiry time
 * @param   {boolean} FSCompat  Removes forward slash (/) from file path
 *
 * @returns {object} returns promise object
 */
NodeMinio.prototype.listDirectoryObjects = async (minioObject) => {
    const minObj = minioObject;
    minObj.bucket = minObj.bucket || this.bucket; // Bucket name always in lowercaseObj
    if (!minObj.object) {
        console.error('Minio: View Folder not found', minObj);
        return Promise.resolve(this.config.errorFileUrl);
    }

    return new Promise((res, rej) => {
        const objectsStream = this.Minio.listObjects(minObj.bucket, qualifyBucket(minObj.object), false);
        const data = [];
        objectsStream.on('data', (obj) => {
            data.push(obj);
        });
        objectsStream.on('error', (e) => {
            rej(e);
        });
        objectsStream.on('end', () => {
            res(data);
        });
    });
};

/**
 * Takes an object with 2 attributes {object, name}.
 * Create a downloadable link for file
 * @example
 *
 * const Minio = require('node-minio');
 *
 * async function downloadFile(name) {
 *       const file = {
 *           object: 'sampleFiles/',
 *           name: `${name}_${
 *             moment().format('YYYY-DD-MM')}.${ext}`,
 *         };
 *
 *       return Minio.downloadLinkBase(file)
            .then(downloadLink => res.redirect(downloadLink));
            }
 * @memberof NodeMinio
 * @param   {object} minioObject  Contains an object with  bucket, filepath
 * @returns {url} returns url
 */
NodeMinio.prototype.downloadLinkBase = (minioObject) => {
    if (!minioObject.name) return console.error('File Name required for download');
    const minObj = minioObject;
    minObj.bucket = minObj.bucket || this.bucket; // Bucket name always in lowercaseObj
    minObj.expires = minObj.expires || 24 * 60 * 60; // Expired in one day
    minObj.headers = {
        'response-content-disposition':
            `attachment; filename="${minObj.name.replace(/[^a-zA-Z0-9-_.]/g, '')}"`,
    };
    return this.Minio.presignedGetObjectAsync(
        minObj.bucket.toLowerCase(), minObj.object,
        minObj.expires, minObj.headers,
    );
};

/**
 * Takes an object with 2 attributes {object, name}.
 * Create a downloadable link for file
 * @example
 *
 * const Minio = require('node-minio');
 *
 * async function downloadFile(name) {
 *       const file = {
 *           object: 'sampleFiles/',
 *           name: `${name}_${
 *             moment().format('YYYY-DD-MM')}.${ext}`,
 *         };
 *
 *       return Minio.downloadLink(file)
            .then(downloadLink => res.redirect(downloadLink));
            }
 * @memberof NodeMinio
 * @param   {object} minioObject  Contains an object with  bucket, filepath
 * @returns {url} returns url
 */
NodeMinio.prototype.downloadLink = (minioObject, qualify = false) => {
    const minObj = minioObject;
    minObj.bucket = minObj.bucket || this.bucket; // Bucket name always in lowercase
    return this.Minio
        .statObjectAsync(minObj.bucket, qualify
            ? qualifyBucket(minObj.object)
            : minObj.object)
        .then(() => this.Minio.downloadLinkBase(minObj))
        .catch((err) => {
            console.error('Minio: File not found', minObj, err);
            return this.config.errorFileUrl;
        });
};

/**
 * Takes and object with 2 attributes {object}.
 * Used to retry alternative file to be downloaded. Here in tha example below we dont get original file than we search for -rst file and try download it
 * @example
 *
 * const Minio = require('node-minio');
 *
 * async function retryFileFromMinio(fileName) {
 *      const retryObject = fileName.path.toLowerCase();
 *      const name = `${fileName}.pdf`.replace(/ /g, '_');
 *
 *    const url = await Minio
 *     .retryDownloadLink({
 *     name,
 *     retryObject,
 *     object: retryObject.replace(/\.pdf$/g, '-rst.pdf'),
 *   });
 *   }
 * @memberof NodeMinio
 * @param   {object} minioObject  Contains an object with filepath
 * *
 * @returns {object} returns download link
 */
NodeMinio.prototype.retryDownloadLink = (minioObject) => {
    const minObj = minioObject;
    minObj.bucket = minObj.bucket || this.bucket; // Bucket name always in lowercase
    return this.Minio.statObjectAsync(minObj.bucket, qualifyBucket(minObj.object))
        .then(() => this.Minio.downloadLinkBase(minObj))
        .catch((e) => {
            console.error('Minio: retry', minObj, e);
            return this.Minio.statObjectAsync(minObj.bucket, qualifyBucket(minObj.retryObject))
                .then(() => {
                    minObj.object = minObj.retryObject;
                    return this.Minio.downloadLink(minObj);
                })
                .catch((err) => {
                    logger.error('Minio: File not found', minObj, err);
                    return this.config.errorFileUrl;
                });
        });
};

/**
 * Takes and object with 2 attributes {object, bucket, expires}.
 * Generates and returns presigned URL for HTTP PUT operations.
 * Clients may point to this URL to upload objects directly to a bucket even if it is private.
 * This presigned URL can have an associated expiration time in seconds after which the URL is no longer valid.
 * The default value is 7 days.
 * @example
 * https://docs.min.io/docs/upload-files-from-browser-using-pre-signed-urls.html
 * https://docs.min.io/docs/javascript-client-api-reference.html#presignedPutObject
 * const Minio = require('node-minio');
 *
 * async function getUploadLink(req,res) {
 *    const url = await Minio
 *     .uploadLink({});
 *   return res.json(url);
 *   }
 * @memberof NodeMinio
 * @param   {object} minioObject  Contains an object with option bucket name and expiry
 *
 * @returns {object} returns url which can be used to upload file
 */
NodeMinio.prototype.uploadLink = (minioObject) => {
    const minObj = minioObject;
    minObj.bucket = minObj.bucket || this.bucket; // Bucket name always in lowercaseObj
    minObj.expires = minObj.expires || 24 * 60 * 60; // Expired in one day
    return this.Minio.presignedPutObjectAsync(minObj.bucket, qualifyBucket(minObj.object), minObj.expires);
};

/**
 * Uploads base64 file  from temp path(specified path) to bucket
 * @example
 *
 * const Minio = require('node-minio');
 *
 * async function uploadFromTemp(req, res, file) {
 * const extension = (file.name || file.filename).split('.').pop().toLowerCase();
 *         minioObject = {
 *           base64String: file.base64,
 *           temp: file.path,
 *           object: `sample/${Id}/${Id
 *           }_${moment().format('DD-MM-YYYY_hh-mm-ss-a')}.${extension}`,
 *         };
 *    const file = await Minio
 *     .uploadTemp(minioObject);
 *   return res.json(file);
 *   }
 * @memberof NodeMinio
 * @param   {object} minioObject  Contains an object with option bucket
 *
 * @returns {object} returns promise
 */
NodeMinio.prototype.uploadTemp = (minioObject) => {
    const minObj = minioObject;
    const fileStream = fsp.createReadStream(minioObject.temp);
    return fsp.stat(minioObject.temp).then(stats => this.Minio
        .putObjectAsync(this.bucket, minObj.object, fileStream, stats.size, 'application/octet-stream'));
};

/**
 * Takes and object with 2 attributes {object, bucket, expires}.
 * Uploads multiple base64 files. Used in sync with Multer
 *
 */
NodeMinio.prototype.base64UploadMulti = minioObjects => Promise.all(minioObjects.map(m => this.Minio.base64Upload(m)));

/**
 * Takes and object with 2 attributes {object, bucket, expires}.
 * Copies file from one bucket to another
 */
NodeMinio.prototype.customCopyObject = (minioObject) => {
    const conds = new minio.CopyConditions();

    const bucket = minioObject.bucket || this.bucket;

    this.Minio.copyObject(
        bucket,
        minioObject.destObj,
        `/${bucket}/${minioObject.srcObj}`,
        conds,
        (e, data) => {
            if (e) {
                console.error(e);
                return e;
            }

            return data;
        },
    );
};

/**
 * Takes and object with 2 attributes {object, bucket, expires}.
 * Gets object from minio as a stream
 *
 */
NodeMinio.prototype.getFileStream = minioObject => new Promise(((resolve, reject) => {
    this.Minio.getObject(
        minioObject.bucket || this.bucket, minioObject.object,
        (err, stream) => {
            if (err) return reject(err);
            return resolve(stream);
        },
    );
}));

module.exports = NodeMinio;