const baseUrl = import.meta.env.VITE_API_URL;

export const fetchMoodLogs = async () => {
    try{
        const response = await fetch(`${baseUrl}/logs/history`);

        if(!response.ok) {
            throw new Error("Logs fetch karne main error aayi");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching logs:", error);
        return [];
    }
};