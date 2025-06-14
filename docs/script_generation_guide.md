# Memorial Mosaic Script Generation Guide

This document provides detailed instructions for generating conversation scripts for the Memorial Mosaic application, designed to guide AI models through the creation process.

## Purpose of Conversation Scripts

Memorial Mosaic scripts serve as the structured dialogue framework that guides users through creating a digital memorial for their loved ones. Each script should:

1. Establish an empathetic, supportive tone
2. Gather meaningful information about the deceased
3. Guide users through sharing memories and stories
4. Structure collected information into a cohesive memorial narrative
5. Provide meaningful closure and next steps

## Anatomy of a Quality Script

### Core Components

1. **Opening Sequence**
   - Begin with a warm, empathetic greeting
   - Acknowledge the user's loss with sensitivity
   - Set expectations for the conversation
   - Start with basic information gathering (name of deceased)

2. **Information Gathering**
   - Ask open-ended questions about relationship to the deceased
   - Explore the deceased's life story in chronological segments
   - Inquire about personality traits and memorable qualities
   - Allow space for sharing meaningful anecdotes

3. **Memorial Development**
   - Based on gathered information, suggest memorial components
   - Offer opportunities to include photos, timelines, or stories
   - Validate the user's choices and contributions
   - Provide previews of how information will be presented

4. **Closure**
   - Summarize the created memorial components
   - Offer options for next steps (sharing, adding more later)
   - Express gratitude for sharing memories
   - End on a comforting, supportive note

### Technical Requirements

Scripts must conform to the JSON schema defined in `conversation_schema.json`. Pay special attention to:

- Alternating `ai` and `user` message types
- Meaningful `ai` messages that advance the conversation
- Realistic, contextually appropriate `user` messages
- Proper use of special properties (`final`, `showExample`, etc.)
- Logical conversation flow that builds toward memorial creation

## Script Design Principles

### Emotional Intelligence

- Use compassionate, warm language
- Acknowledge grief without forcing emotional responses
- Provide space for both positive memories and difficult emotions
- Avoid clichés about loss and death

### Conversational Flow

- Ensure natural transitions between topics
- Build on previous responses for continuity
- Include occasional summaries to reinforce shared information
- Provide gentle guidance without being directive

### Personalization

- Create branching options based on relationship to deceased
- Adapt to different contexts (recent vs. past loss)
- Account for various cultural and spiritual perspectives
- Include flexible response paths for different user engagement levels

## Example Script Patterns

### Biographical Timeline

```json
{
  "title": "Life Journey Timeline",
  "description": "Create a chronological memorial of your loved one's life journey",
  "conversation": [
    {
      "type": "ai",
      "message": "I'd like to help you create a Life Journey Timeline for [name]. Could you share when and where they were born?"
    },
    {
      "type": "user",
      "message": "[Example user response about birthdate and location]"
    },
    {
      "type": "ai",
      "message": "Thank you for sharing that. What are some important milestones or chapters from their childhood and early years that should be included?"
    }
    // Additional steps following this pattern
  ]
}
```

### Memory Collection

```json
{
  "title": "Cherished Memories Collection",
  "description": "Gather and organize special memories and stories",
  "conversation": [
    {
      "type": "ai",
      "message": "What is one of your favorite memories with [name] that you'd like to preserve in their memorial?"
    },
    {
      "type": "user",
      "message": "[Example user response with a memory]"
    },
    {
      "type": "ai",
      "message": "That's a beautiful memory. Would you like to categorize this as a family moment, achievement, or personal story?"
    }
    // Additional steps following this pattern
  ]
}
```

## Testing Your Scripts

Before finalizing a script, verify:

1. The JSON structure is valid and follows the schema
2. The conversation has a clear beginning, middle, and end
3. The tone remains consistently compassionate and helpful
4. There are no logical gaps or inconsistencies in the flow
5. The user has adequate opportunity to provide meaningful input
6. The resulting memorial would contain substantive, personalized content

## Advanced Script Features

For more sophisticated scripts, consider:

- Incorporating conditional logic based on earlier responses
- Including multimedia prompts for photos, audio, or video
- Adding themed memorial suggestions based on gathered information
- Suggesting collaborative contributions from other family members

---

This guide should be used alongside the JSON schema to ensure that generated scripts provide an empathetic, structured, and meaningful experience for users creating memorials for their loved ones.
