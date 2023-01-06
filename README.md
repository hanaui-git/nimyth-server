# Nimyth Server
Nimyth Server source code.

## Installation
Github:
```
git clone https://github.com/hanaui-git/nimyth-server
```

NpmJS:
```
npm i mongodb simple-aes-256 js-string-compression body-parser express hqc
```

## Setup
1. Make an environment file and add a variable called **MONGODB_URL**, there you must put your MongoDB url database.
2. Add an admin key in **options.json** and make sure the admin key matches the client admin key.

## Usage
```
node index.js
```

## License
MIT © Hanaui