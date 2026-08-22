const axios = require('axios');

const BASE_URL =
  process.env.ASAAS_ENV === 'producao'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3';

const asaas = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    access_token: process.env.ASAAS_API_KEY || '',
  },
});

module.exports = asaas;
