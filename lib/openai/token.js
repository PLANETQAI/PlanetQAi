export const getToken = async () => {
    try {
        const response = await fetch("/api/chat/session");
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Failed to get token: ${error.message || response.statusText}`);
        }
        
        const data = await response.json();
        // The token should be in data.client_secret for the realtime API
        return data.client_secret.value;
    } catch (error) {
        console.error('Error getting token:', error);
        throw error;
    }
};