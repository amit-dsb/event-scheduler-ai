import type { NextConfig } from "next";

const nextConfig: NextConfig = {
//   experimental: {
//     serverComponentsExternalPackages: ['sequelize', 'open-graph-scraper'],
// },
eslint: {
    ignoreDuringBuilds: true,
},

typescript: {
    ignoreBuildErrors: true,
},
};

export default nextConfig;
