# Node-Minio
Async Minio(S3 compatible high performance object storage and retrieval) client for promises support in NodeJS
An helper library which provides core promisified helper functions for using minio bucket from Node API

Want to contribute to Node-Minio? Please read `CONTRIBUTING.md`.

Installation
----------------------

Steps to setup minio on linux server - [link](https://github.com/darshitvvora/node-minio/wiki/Install-and-configure-Min.io-on-new-Linode)

Node-Minio supports stable versions of Node.js 8.11.0 and later. You can install
Node Minio in your project's `node_modules` folder.

To install the latest version on npm locally and save it in your package's
`package.json` file:

    npm install --save node-minio

## Usage
+ Initialize Minio Object
```javascript
  const NodeMinio = require('node-minio');
 
  const config = {
      minio: {
        endPoint: "192.168.23.100",
        accessKey: "SN8JBGY43WPMFT0R56fsdfdsf",
        secretKey: "fdfdfdfd+3R9e/x4V0F6Xpjtfdsfd",
        secure: false,
        port: 8000,
      },
      errorFileUrl: "/sample/errorfile.pdf",
      bucket: "sample"     
  }
 
  const Minio = new NodeMinio(config);
```

+ Upload a base64 file to Minio Bucket using NodeJS
```javascript
  async function uploadFile(file) {
      const { base64: base64String, filename } = file;
      const extension = filename.split('.').pop();
      const fileName = moment().format('YYYY_MM_DD_hh_mm_ss_a');
      const object = `sampleFile/${fileName}.${extension}`;
 
      await Minio.base64Upload({ object, base64String });
      return object;
  }
```

+ Generate dynamic URL with expiry to access file from bucket
```javascript
   
    async function viewFile(fileName) {
       const filePath= 'sampleFile/${fileName}.pdf'
       const url = await Minio
        .viewLink({
          object: filePath,
        }, false);
      return url;
    }
```

+ Lists all the directories in current folder/bucket
```javascript
    async function listFilesList() {
       const baseUrl= 'sampleFile/'
       const fileList = await Minio
        .listDirectoryObjects({ object: baseUrl });
      return fileList;
    }
```

+ Download a file from bucket
```javascript
    async function downloadFile(req, res, name) {
            const file = {
                object: 'sampleFiles/',
                name: `${name}_${
                  moment().format('YYYY-DD-MM')}.${ext}`,
              };
             
            return Minio.downloadLinkBase(file)
                .then(downloadLink => res.redirect(downloadLink));
}
```

+ Validate bucket and Download a file from bucket
```javascript
    async function ValidateAndDownloadFile(req,res,name) {
            const file = {
                object: 'sampleFiles/',
                name: `${name}_${
                  moment().format('YYYY-DD-MM')}.${ext}`,
              };
             
            return Minio.downloadLink(file)
                .then(downloadLink => res.redirect(downloadLink));
}
```

+ Used to retry alternative file to be downloaded. Here in tha example below we dont get original file than we search for -rst file and try download it
```javascript
    async function retryFileFromMinio(fileName) {
       const retryObject = fileName.path.toLowerCase();
       const name = `${fileName}.pdf`.replace(/ /g, '_');
      
     const url = await Minio
      .retryDownloadLink({
      name,
      retryObject,
      object: retryObject.replace(/\.pdf$/g, '-rst.pdf'),
    });
}
```

+  Generates and returns presigned URL for HTTP PUT operations.
   Clients may point to this URL to upload objects directly to a bucket even if it is private.
   This presigned URL can have an associated expiration time in seconds after which the URL is no longer valid.
   The default value is 7 days.
```javascript
    async function getUploadLink() {
           const url = await Minio
            .uploadLink({});
          return url;
}
```
+  Uploads base64 file  from temp path(specified path) to bucket
```javascript
    async function uploadFromTemp(file) {
           const extension = (file.name || file.filename).split('.').pop().toLowerCase();
                     minioObject = {
                       base64String: file.base64,
                       temp: file.path,
                       object: `sample/${Id}/${Id
                       }_${moment().format('DD-MM-YYYY_hh-mm-ss-a')}.${extension}`,
                     };
               const out = await Minio
                .uploadTemp(minioObject);
               return out;
}
```

+  Uploads multiple base64 file in one go
```javascript
  return Minio.base64UploadMulti(minioObjects);
```

+  Copies file from one bucket to another
```javascript
  return Minio.customCopyObject(minioObject);
```

+  Gets object from minio bucket as a stream
```javascript
  return Minio.getFileStream(minioObject);
```

## Documentation
+ Documentation of [Min.io client API](https://docs.min.io/docs/javascript-client-api-reference.html) 
+ Documentation is available at [Node-Minio Docs](https://darshitvvora.github.io/node-minio/index.html).

## License

Node-Minio is copyright (c) 2019-present Darshit Vora <dvvrocks@gmail.com> and
the [contributors to Node-Minio](https://github.com/darshitvvora/node-minio/graphs/contributors).

Node-Minio is free software, licensed under the MIT License. See the
`LICENSE` file for more details.
