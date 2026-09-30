import 'server-only'

export function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL
  const deploymentUrl = configuredUrl || process.env.VERCEL_URL
  if (!deploymentUrl) return 'http://localhost:3000'

  const url = /^https?:\/\//.test(deploymentUrl)
    ? deploymentUrl
    : `https://${deploymentUrl}`

  return url.replace(/\/+$/, '')
}