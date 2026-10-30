import packageJson from "../package.json"

/**
 * Versión actual de la Intranet Corporativa sincronizada automáticamente desde package.json
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version || "1.4.0"
