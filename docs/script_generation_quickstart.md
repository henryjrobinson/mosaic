# Memorial Mosaic Script Generation Quick Start Guide

This guide provides a streamlined workflow for creating new conversation scripts for Memorial Mosaic that help contributors create meaningful memorial tiles.

## Step 1: Identify the Memorial Tile Type

Before generating a script, identify the most appropriate tile type based on:
- The **relationship** between contributor and deceased (spouse, child, friend, colleague)
- **Available resources** (photos, voice recordings, writings, social media)
- **Unique aspects** of their connection that should be emphasized
- **Emotional context** of the contribution (recent loss vs. celebration of life)

## Step 2: Generate the Script

### Option A: Using ChatGPT or Similar LLM

1. Copy the content from `docs/script_generation_prompt.md` (Digital Legacy Memorial Conversation Generator)
2. Paste it into ChatGPT, Claude, or your preferred LLM
3. Add your specific requirements following the format in the example usage:
   ```
   Generate a memorial conversation for the [relationship] of [name], a [age]-year-old [profession/descriptor] who passed away. Focus on creating a [specific tile type] that [purpose/goal].
   ```

   For example:
   ```
   Generate a memorial conversation for the sister of Emma Rodriguez, a 47-year-old teacher who passed away. Focus on creating a Childhood Memories tile that captures their shared experiences growing up.
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
