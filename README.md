# Memorial Mosaic

## Project Overview
Memorial Mosaic is an AI-guided platform that helps users create comprehensive digital memorials through modular, personalized "tiles" that form a complete picture of a person's life. The AI acts as both curator and guide, helping contributors create meaningful tributes based on their unique relationship to the memorialized person.

## Prototype
This repository contains a clickable prototype that demonstrates the core concept of Memorial Mosaic. The prototype showcases:

- AI-guided conversation flow for collecting memories and stories
- Different memorial objects (tiles) selected based on user relationships
- The concept of building a comprehensive memorial through multiple perspectives
- Configurable conversation scripts that can be selected and played
- Admin interface for managing conversation scripts

## Project Structure

### Application Files
- `public/` - Contains the deployable prototype
  - `scripts/` - JSON files containing different conversation scripts
  - `css/` - Styling for the application
  - `js/` - Application logic
  - `admin.html` - Admin interface for script management
  - `index.html` - Main application interface

### Documentation
- `docs/` - Project documentation and resources
  - `project_plan.md` - Feature roadmap and development guidelines
  - `script_generation_guide.md` - Best practices for creating conversation scripts
  - `script_generation_prompt.md` - LLM prompt for generating new scripts
  - `schema/` - JSON schema definitions
    - `conversation_schema.json` - Formal schema for conversation scripts
- `memorial_mosaic_project_doc.md` - Full project concept and documentation

## Script Generation System

Memorial Mosaic includes a comprehensive system for generating conversation scripts using AI/LLM technologies:

### Creating New Scripts

1. **Define your script needs**: Determine what type of memorial you want to create (timeline, memory collection, etc.)

2. **Use the LLM prompt**: Copy the content from `docs/script_generation_prompt.md` into your preferred LLM (like ChatGPT, Claude, etc.)

3. **Customize the prompt**: Add specific requirements for your script (e.g., "Focus on collecting childhood memories" or "Create a script for a spouse's memorial")

4. **Generate the script**: The LLM will generate a JSON-formatted conversation script following the defined schema

5. **Validate the output**: Ensure the JSON is valid and follows the schema defined in `docs/schema/conversation_schema.json`

6. **Upload via admin panel**: Access the admin interface at `/admin.html` and upload your new script

### Script Structure

Each script follows a standardized JSON format with:
- Metadata (title, description, etc.)
- Conversation array with alternating AI and user messages
- Special properties for controlling conversation flow

See `docs/script_generation_guide.md` for detailed best practices on creating effective scripts.

## Development
This is a prototype built with HTML, CSS, and JavaScript. To run it locally, simply open `public/index.html` in your browser or use a local server:

```
python -m http.server 8080
```

Then visit `http://localhost:8080` in your browser.

## Deployment
The prototype is configured for deployment on Netlify. The repository is set up with continuous deployment from the main branch.
