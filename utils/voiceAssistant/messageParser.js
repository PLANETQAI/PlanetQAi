// utils/voiceAssistant/messageParser.js
export class MessageParser {
    static parseResponse(response) {
      const commands = {
        generateMusic: response.includes('[GENERATE_MUSIC]'),
        navigateTo: null
      };
  
      // Extract navigation target
      const navMatch = response.match(/\[NAVIGATE_TO:(\w+)\]/);
      if (navMatch) {
        commands.navigateTo = navMatch[1].toLowerCase();
      }
  
      // Extract JSON if present
      let musicData = null;
      const jsonMatch = response.match(/```json([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          musicData = JSON.parse(jsonMatch[1].trim());
        } catch (e) {
          console.error('Invalid JSON in response:', e);
        }
      }
  
      // Clean response text
      const cleanResponse = response
        .replace(/\[GENERATE_MUSIC\]/g, '')
        .replace(/\[NAVIGATE_TO:\w+\]/g, '')
        .replace(/```json[\s\S]*?```/g, '')
        .trim();
  
      return {
        text: cleanResponse,
        commands,
        musicData
      };
    }
  }
  