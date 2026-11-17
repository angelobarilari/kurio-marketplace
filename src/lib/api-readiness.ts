const API_READINESS_TIMEOUT_MS = 8_000

let apiReadiness: Promise<void> = Promise.resolve()

const rejectAfter = (timeoutMs: number) =>
  new Promise<never>((_, reject) => {
    globalThis.setTimeout(() => {
      reject(new Error('A API simulada n\u00e3o iniciou. Recarregue a p\u00e1gina e tente novamente.'))
    }, timeoutMs)
  })

export const setApiReadiness = (readiness: Promise<void>) => {
  apiReadiness = Promise.race([readiness, rejectAfter(API_READINESS_TIMEOUT_MS)])
}

export const waitForApiReadiness = () => apiReadiness
