export const prerenderApiOrigin = 'http://kurio.prerender'

export const mockApiUrl = (path: string) => (import.meta.env.SSR ? `${prerenderApiOrigin}${path}` : path)
