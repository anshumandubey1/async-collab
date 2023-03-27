import CryptoJS from 'crypto-js';

export const encrypt = (message: string) => {
  if(!process.env.SECRET_KEY)
    throw new Error('Secret Key is not defined!')
  const cipherText = CryptoJS.AES.encrypt(message, process.env.SECRET_KEY).toString();
  return Buffer.from(cipherText).toString('base64');
}

export const decrypt = (ciphertext: string) => {
  if(!process.env.SECRET_KEY)
    throw new Error('Secret Key is not defined!')
  const asciiText = Buffer.from(ciphertext, 'base64').toString('ascii');
  const bytes  = CryptoJS.AES.decrypt(asciiText, process.env.SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
