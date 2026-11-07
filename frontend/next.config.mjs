/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "fireops-lab";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  ...(isGitHubPages ? { basePath: `/${repositoryName}` } : {}),
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
};

export default nextConfig;
