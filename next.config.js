/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    GAS_API_URL: 'https://script.google.com/macros/s/AKfycbydpEew2V8rkL1OKqml9eAmz8ZAAzI579cD_JeU45kBuIXXjZJV-fatTEUtodFlyzICUA/exec'
  }
}

module.exports = nextConfig
