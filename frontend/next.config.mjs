/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "fireops-lab";

const nextConfig = {
  ...(process.env.FIREOPS_API_PROXY
    ? {
        async rewrites() {
          return [
            { source: "/backend/:path*", destination: `${process.env.FIREOPS_API_PROXY}/:path*` },
          ];
        },
      }
    : { output: "export" }),
  trailingSlash: true,
  ...(isGitHubPages ? { basePath: `/${repositoryName}` } : {}),
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
};

export default nextConfig;
