let apiReadiness: Promise<void> = Promise.resolve()

export const setApiReadiness = (readiness: Promise<void>) => {
  apiReadiness = readiness
}

export const waitForApiReadiness = () => apiReadiness
