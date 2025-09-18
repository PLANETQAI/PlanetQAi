export const getToken = async () => {
    try {
        const response = await fetch("/api/chat/session");
        console.log('Response:', response);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Failed to get token: ${error.message || response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        // The token should be in data.client_secret for the realtime API
        console.log('Ephemeral token:', data.client_secret);
        return data.client_secret;
    } catch (error) {
        console.error('Error getting token:', error);
        throw error;
    }
};