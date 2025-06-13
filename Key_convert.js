const fs = require('fs')
const key = fs.readFileSync('./firebase-service.json','utf-8')
const base64 = Buffer.from(key).toString('base64')
console.log(base64)
// ei ta k node filer nam likhe enter dile dekhabhe 
// er por ei lombha  likha ta asbhe oitare copy kore .env the  boshai dibho