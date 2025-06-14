# Memorial Mosaic Script Generation Quick Start Guide

This guide provides a streamlined workflow for creating new conversation scripts for Memorial Mosaic using AI/LLM tools.

## Step 1: Understand Your Users' Needs

Before generating a script, consider:
- What type of memorial is needed (timeline, memory collection, family history, etc.)
- Who will be using this script (spouse, child, friend, colleague)
- What emotional tone is appropriate (recent loss vs. celebration of life)
- What unique aspects of the person should be emphasized

## Step 2: Generate the Script

### Option A: Using ChatGPT or Similar LLM

1. Copy the content from `docs/script_generation_prompt.md`
2. Paste it into ChatGPT, Claude, or your preferred LLM
3. Add your specific requirements, such as:
   ```
   Create a script focused on collecting childhood memories of a grandparent.
   The tone should be warm and nostalgic, with an emphasis on family traditions.
   ```
4. Review the generated JSON and make any necessary edits

### Option B: Using the Memorial Mosaic API (Coming Soon)

1. Access the script generation API endpoint
2. Provide your requirements through the API parameters
3. Receive the generated script as a JSON response

## Step 3: Validate Your Script

1. Ensure your script is valid JSON (use a tool like [JSONLint](https://jsonlint.com/))
2. Check that it follows the schema in `docs/schema/conversation_schema.json`
3. Verify that it includes:
   - Proper metadata (title, description)
   - Alternating AI and user messages
   - Appropriate emotional tone throughout

## Step 4: Test the Conversation Flow

1. Read through the conversation to ensure it flows naturally
2. Check for logical gaps or inconsistencies
3. Verify that the script collects meaningful information
4. Ensure the final message provides appropriate closure

## Step 5: Upload and Use the Script

1. Open the Memorial Mosaic admin panel at `/admin.html`
2. Click "Browse" or drag and drop your script file
3. The script will be saved to your browser's local storage
4. Access the main application and your script will be available

## Example Script Request

```
Generate a Memorial Mosaic conversation script for collecting memories about a person's career achievements.

The script should:
- Focus on professional accomplishments and impact
- Include questions about mentorship and relationships with colleagues
- Gather stories about challenges overcome
- Maintain a respectful but not overly somber tone
- Be appropriate for colleagues to use at a memorial service
```

## Additional Resources

- Full schema documentation: `docs/schema/conversation_schema.json`
- Detailed best practices: `docs/script_generation_guide.md`
- Complete LLM prompt: `docs/script_generation_prompt.md`
