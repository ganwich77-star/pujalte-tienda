import crypto from 'crypto';

/**
 * REDSYS IMPLEMENTATION
 */
export function generateRedsysData(params: {
  amount: number;
  orderId: string;
  merchantCode: string;
  terminal: string;
  secretKey: string;
  notificationUrl: string;
  okUrl: string;
  koUrl: string;
}) {
  const merchantParams = {
    DS_MERCHANT_AMOUNT: Math.round(params.amount * 100).toString(),
    DS_MERCHANT_ORDER: params.orderId,
    DS_MERCHANT_MERCHANTCODE: params.merchantCode,
    DS_MERCHANT_CURRENCY: '978',
    DS_MERCHANT_TRANSACTIONTYPE: '0',
    DS_MERCHANT_TERMINAL: params.terminal,
    DS_MERCHANT_MERCHANTURL: params.notificationUrl,
    DS_MERCHANT_URLOK: params.okUrl,
    DS_MERCHANT_URLKO: params.koUrl,
  };

  const merchantParamsBase64 = Buffer.from(JSON.stringify(merchantParams)).toString('base64');
  const decodedKey = Buffer.from(params.secretKey, 'base64');
  
  const hmacOrder = crypto.createHmac('sha256', decodedKey).update(merchantParams.DS_MERCHANT_ORDER).digest();
  const signature = crypto.createHmac('sha256', hmacOrder).update(merchantParamsBase64).digest('base64');

  return {
    Ds_SignatureVersion: 'HMAC_SHA256_V1',
    Ds_MerchantParameters: merchantParamsBase64,
    Ds_Signature: signature,
    url: 'https://sis.redsys.es/sis/realizarPago' // Producción: https://sis.redsys.es/sis/realizarPago, Pruebas: https://sis-t.redsys.es:25443/sis/realizarPago
  };
}

/**
 * PAYCOMET IMPLEMENTATION
 */
export function generatePaycometData(params: {
  amount: number;
  orderId: string;
  merchantCode: string;
  terminal: string;
  password: string;
  notificationUrl: string;
  okUrl: string;
  koUrl: string;
  paymentMethod?: string;
}) {
  const amountCents = Math.round(params.amount * 100).toString();
  const currency = '978'; // EUR
  const operation = '1'; // AUTHORIZATION
  const payMethod = params.paymentMethod === 'bizum' ? '11' : '1';
  
  // Format password as MD5 as per standard Paycomet signature requirements
  const passwordMd5 = crypto.createHash('md5').update(params.password).digest('hex');
  
  // SHA512( MERCHANT_MERCHANTCODE + MERCHANT_TERMINAL + OPERATION + MERCHANT_ORDER + MERCHANT_AMOUNT + MERCHANT_CURRENCY + md5(PASSWORD))
  const signatureString = 
    params.merchantCode + 
    params.terminal + 
    operation + 
    params.orderId + 
    amountCents + 
    currency + 
    passwordMd5;
    
  const signature = crypto.createHash('sha512').update(signatureString).digest('hex');

  return {
    url: 'https://api.paycomet.com/gateway/form-payment',
    params: {
      MERCHANT_MERCHANTCODE: params.merchantCode,
      MERCHANT_TERMINAL: params.terminal,
      OPERATION: operation,
      MERCHANT_ORDER: params.orderId,
      MERCHANT_AMOUNT: amountCents,
      MERCHANT_CURRENCY: currency,
      MERCHANT_SIGNATURE: signature,
      URLOK: params.okUrl,
      URLKO: params.koUrl,
      PAYMETHOD: payMethod, // Cambiado a 11 para Bizum según tu informe
    }
  };
}
