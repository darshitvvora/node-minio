# Node-Minio
Async Minio(S3 compatible high performance object storage and retrieval) client for promises support in NodeJS
An helper library which provides core promisified helper functions for using minio bucket from Node API

Want to contribute to Node-Minio? Please read `CONTRIBUTING.md`.

Installation
----------------------

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
+ Generate dynamic expiry URL to access file from bucket
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


## Documentation
+ Documentation is available at [Node-Minio Docs](https://darshitvvora.github.io/node-minio/index.html).

## License

Node-Minio is copyright (c) 2019-present Darshit Vora <dvvrocks@gmail.com> and
the [contributors to Node-Minio](https://github.com/darshitvvora/node-minio/graphs/contributors).

Node-Minio is free software, licensed under the MIT License. See the
`LICENSE` file for more details.