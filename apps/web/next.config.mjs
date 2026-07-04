/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@tell/schema", "@tell/taste", "@tell/redesign"],
  experimental: {
    serverComponentsExternalPackages: ["playwright", "@tell/core"],
  },
};

export default nextConfig;
