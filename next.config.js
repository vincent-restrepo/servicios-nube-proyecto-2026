// URL del balanceador de carga. La sección "Balanceador de carga" de la intranet
// consulta esta dirección a través del proxy interno /proxy.
const LOAD_BALANCER_URL = process.env.LOAD_BALANCER_URL;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    if (!LOAD_BALANCER_URL) return [];
    return [
      {
        source: '/proxy/:path*',
        destination: `${LOAD_BALANCER_URL}/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
