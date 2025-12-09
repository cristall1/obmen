// WebSocket disabled for now - use polling instead
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useWebSocket(_onMessage: (type: string, data: any) => void) {
    // Disabled - WebSocket через туннель работает плохо
    // Polling используется вместо WebSocket
    return { current: null };
}
