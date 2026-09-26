/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't fail `next build` on ESLint problems.
    //
    // This was added for pre-existing lint debt (unescaped entities,
    // rules-of-hooks in a table cell renderer). That debt is now CLEARED —
    // `npx next lint` reports zero warnings and zero errors — so this flag can
    // be flipped to `false` to make lint a real release gate and stop the debt
    // coming back. Left as `true` so enabling the gate is a deliberate choice
    // rather than a surprise failing deploy.
    //
    // Type-safety is enforced separately by `tsc` regardless of this setting.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // Allow images served from S3 buckets (cover photos, dish photos).
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
    ],
  },
}

module.exports = nextConfig
