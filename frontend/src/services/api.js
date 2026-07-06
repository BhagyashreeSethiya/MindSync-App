const API_BASE_URL = "http://localhost:8000";

export const fetchMoodLogs = async () => {
    try{
        const response = await fetch(`${API_BASE_URL}/logs/history`);

        if(!response.ok) {
            throw new Error("Logs fetch karne main error aayi");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching logs:", error);
        return [];
    }
};